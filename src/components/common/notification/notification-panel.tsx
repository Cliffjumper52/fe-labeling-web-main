import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { Notification } from "../../../interface/notification/notification.interface";
import {
  deleteAllNotifications,
  deleteManyNotifications,
  getNotifications,
  getUnreadCount,
  markAllNotificationsAsRead,
  markManyNotificationsAsRead,
  markNotificationAsRead,
} from "../../../services/notification-service.service";
import { getAccessToken } from "../../../utils/auth-storage";
import NotificationList from "./notification-list";

const WS_URL = "ws://localhost:2000/notifications";
const PAGE_LIMIT = 10;

export default function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const listFetchedRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Fetch unread count only — called on mount
  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Silently fail
    }
  }, []);

  // Load first page — called only once per page lifecycle (when panel opens first time)
  const fetchFirstPage = useCallback(async () => {
    if (listFetchedRef.current) return;
    listFetchedRef.current = true;
    setLoading(true);
    try {
      const page = await getNotifications({
        page: 1,
        limit: PAGE_LIMIT,
        order: "DESC",
        orderBy: "createdAt",
      });
      setNotifications(page.data);
      setCurrentPage(page.currentPage);
      setHasNext(page.hasNext);
    } catch {
      listFetchedRef.current = false; // allow retry on failure
    } finally {
      setLoading(false);
    }
  }, []);

  // Load next page — triggered by infinite scroll sentinel
  const fetchNextPage = useCallback(async () => {
    if (loadingMore || !hasNext) return;
    setLoadingMore(true);
    try {
      const nextPageNum = currentPage + 1;
      const page = await getNotifications({
        page: nextPageNum,
        limit: PAGE_LIMIT,
        order: "DESC",
        orderBy: "createdAt",
      });
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const fresh = page.data.filter((n) => !existingIds.has(n.id));
        return [...prev, ...fresh];
      });
      setCurrentPage(page.currentPage);
      setHasNext(page.hasNext);
    } catch {
      // Silently fail
    } finally {
      setLoadingMore(false);
    }
  }, [currentPage, hasNext, loadingMore]);

  // Mount: fetch unread count immediately
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Open panel for the first time: fetch first page
  useEffect(() => {
    if (isOpen) {
      fetchFirstPage();
    }
  }, [isOpen, fetchFirstPage]);

  // IntersectionObserver on sentinel for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage]);

  // Socket.IO connection
  useEffect(() => {
    const token = getAccessToken();
    const socket: Socket = io(WS_URL, {
      autoConnect: false,
      auth: { token: token ? `Bearer ${token}` : "" },
    });
    socketRef.current = socket;
    socket.connect();

    socket.on("connect", () => {
      console.log("[NotificationPanel] Socket connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("[NotificationPanel] Socket connection error:", err.message);
    });

    socket.on(
      "notification.created",
      (payload: Notification) => {
        setNotifications((prev) => [payload, ...prev]);
        if (!payload.isRead) {
          setUnreadCount((c) => c + 1);
        }
      },
    );

    socket.on(
      "notification.unread-count",
      (payload: { count: number }) => {
        setUnreadCount(payload.count);
      },
    );

    socket.on(
      "notification.read",
      (payload: { notificationIds: string[] | null }) => {
        if (payload.notificationIds === null) {
          setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
          setUnreadCount(0);
        } else {
          const ids = new Set(payload.notificationIds);
          setNotifications((prev) =>
            prev.map((n) => (ids.has(n.id) ? { ...n, isRead: true } : n)),
          );
          setUnreadCount((prev) => {
            // Recalculate based on latest state after the map
            return Math.max(0, prev - payload.notificationIds!.length);
          });
        }
      },
    );

    socket.on(
      "notification.deleted",
      (payload: { notificationIds: string[] | null }) => {
        if (payload.notificationIds === null) {
          setNotifications([]);
          setUnreadCount(0);
        } else {
          const ids = new Set(payload.notificationIds);
          setNotifications((prev) => {
            const next = prev.filter((n) => !ids.has(n.id));
            setUnreadCount(next.filter((n) => !n.isRead).length);
            return next;
          });
        }
      },
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Close panel on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.isRead) return;
    try {
      await markNotificationAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      setSelectedIds(new Set());
    } catch {
      // Ignore
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleMarkSelectedAsRead = async () => {
    const ids = [...selectedIds].filter(
      (id) => notifications.find((n) => n.id === id && !n.isRead),
    );
    if (ids.length === 0) {
      setSelectedIds(new Set());
      return;
    }
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - ids.length));
    setSelectedIds(new Set());
    try {
      await markManyNotificationsAsRead(ids);
    } catch {
      // Revert optimistic update on failure
      setNotifications((prev) =>
        prev.map((n) => (ids.includes(n.id) ? { ...n, isRead: false } : n)),
      );
      setUnreadCount((c) => c + ids.length);
    }
  };

  const handleDeleteSelected = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    // Optimistic update
    const removed = notifications.filter((n) => ids.includes(n.id));
    const removedUnread = removed.filter((n) => !n.isRead).length;
    setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
    setUnreadCount((c) => Math.max(0, c - removedUnread));
    setSelectedIds(new Set());
    try {
      await deleteManyNotifications(ids);
    } catch {
      // Revert optimistic update on failure
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const restored = removed.filter((n) => !existingIds.has(n.id));
        return [...prev, ...restored].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      });
      setUnreadCount((c) => c + removedUnread);
    }
  };

  const handleDeleteAll = async () => {
    const snapshot = notifications;
    const snapshotUnread = unreadCount;
    // Optimistic update
    setNotifications([]);
    setUnreadCount(0);
    setSelectedIds(new Set());
    try {
      await deleteAllNotifications();
    } catch {
      // Revert optimistic update on failure
      setNotifications(snapshot);
      setUnreadCount(snapshotUnread);
    }
  };

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 hover:bg-white/20"
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 7H3s3 0 3-7" />
          <path d="M10 21a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-sm">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleMarkSelectedAsRead}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Mark {selectedIds.size} as read
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Delete {selectedIds.size}
                  </button>
                </>
              )}
              {selectedIds.size === 0 && unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Mark all as read
                </button>
              )}
              {selectedIds.size === 0 && notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteAll}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Delete all
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-white/40 hover:text-white/80"
                aria-label="Close notifications"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            <NotificationList
              notifications={notifications}
              loading={loading}
              loadingMore={loadingMore}
              hasNext={hasNext}
              sentinelRef={sentinelRef}
              selectedIds={selectedIds}
              onMarkAsRead={handleMarkAsRead}
              onToggleSelect={handleToggleSelect}
            />
          </div>
        </div>
      )}
    </div>
  );
}
