import type { RefObject } from "react";
import type { Notification } from "../../../interface/notification/notification.interface";
import NotificationItem from "./notification-item";

interface NotificationListProps {
  notifications: Notification[];
  loading: boolean;
  loadingMore: boolean;
  hasNext: boolean;
  sentinelRef: RefObject<HTMLDivElement | null>;
  selectedIds: Set<string>;
  onMarkAsRead: (notification: Notification) => void;
  onToggleSelect: (id: string) => void;
}

export default function NotificationList({
  notifications,
  loading,
  loadingMore,
  hasNext,
  sentinelRef,
  selectedIds,
  onMarkAsRead,
  onToggleSelect,
}: NotificationListProps) {
  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-sm text-white/40">
        Loading…
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-sm text-white/40">
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8 opacity-40"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 7H3s3 0 3-7" />
          <path d="M10 21a2 2 0 0 0 4 0" />
        </svg>
        <span>No notifications</span>
      </div>
    );
  }

  return (
    <>
      {notifications.map((n) => (
        <NotificationItem
          key={n.id}
          notification={n}
          selected={selectedIds.has(n.id)}
          onMarkAsRead={onMarkAsRead}
          onToggleSelect={onToggleSelect}
        />
      ))}

      {/* Infinite scroll sentinel */}
      {hasNext && (
        <div ref={sentinelRef} className="flex items-center justify-center py-3">
          {loadingMore && (
            <svg
              className="h-4 w-4 animate-spin text-white/30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          )}
        </div>
      )}

      {!hasNext && notifications.length > 0 && (
        <p className="py-3 text-center text-xs text-white/20">You're all caught up</p>
      )}
    </>
  );
}
