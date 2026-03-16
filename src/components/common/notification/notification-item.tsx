import type { Notification } from "../../../interface/notification/notification.interface";

const TYPE_CONFIG: Record<
  string,
  { bg: string; icon: React.ReactNode; label: string }
> = {
  task_assigned: {
    bg: "bg-blue-500/20 text-blue-400",
    label: "Assigned",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  task_approved: {
    bg: "bg-green-500/20 text-green-400",
    label: "Approved",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  task_rejected: {
    bg: "bg-red-500/20 text-red-400",
    label: "Rejected",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="m15 9-6 6M9 9l6 6" />
      </svg>
    ),
  },
  system_alert: {
    bg: "bg-yellow-500/20 text-yellow-400",
    label: "Alert",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
};

const DEFAULT_CONFIG = TYPE_CONFIG.system_alert;

function formatRelativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(dateString),
  );
}

function getNotificationType(notification: Notification): string {
  const additionalType = (
    notification.additionalData as Record<string, unknown> | null
  )?.type as string | undefined;
  return additionalType ?? "system_alert";
}

interface NotificationItemProps {
  notification: Notification;
  selected: boolean;
  onMarkAsRead: (notification: Notification) => void;
  onToggleSelect: (id: string) => void;
}

export default function NotificationItem({
  notification,
  selected,
  onMarkAsRead,
  onToggleSelect,
}: NotificationItemProps) {
  const type = getNotificationType(notification);
  const config = TYPE_CONFIG[type] ?? DEFAULT_CONFIG;

  return (
    <div
      className={`group flex w-full gap-3 px-4 py-3 transition-colors hover:bg-white/5 ${
        selected ? "bg-white/[0.06]" : !notification.isRead ? "bg-white/[0.03]" : ""
      }`}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={() => onToggleSelect(notification.id)}
        className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-white/20 transition-colors hover:border-blue-400"
        style={selected ? { background: "rgb(96 165 250)", borderColor: "rgb(96 165 250)" } : {}}
        aria-label="Select notification"
      >
        {selected && (
          <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m2 6 3 3 5-5" />
          </svg>
        )}
      </button>

      {/* Type icon */}
      <button
        type="button"
        onClick={() => onMarkAsRead(notification)}
        className="flex min-w-0 flex-1 gap-3 text-left"
      >
        <div
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.bg}`}
        >
          {config.icon}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p
              className={`truncate text-sm ${
                !notification.isRead
                  ? "font-semibold text-white"
                  : "font-normal text-white/70"
              }`}
            >
              {notification.title}
            </p>
            {!notification.isRead && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-blue-400" />
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs text-white/50">
            {notification.content}
          </p>
          <p className="mt-1 text-xs text-white/30">
            {formatRelativeTime(notification.createdAt)}
          </p>
        </div>
      </button>
    </div>
  );
}
