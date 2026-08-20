"use client";

import { X } from "lucide-react";
import { MOCK_NOTIFICATIONS } from "@/lib/mobile/mockData";

interface NotificationsPanelProps {
  onClose: () => void;
}

const TAG_COLORS: Record<string, string> = {
  Overdue: "#dc2626",
  Assigned: "#2563eb",
  Updated: "#d97706",
  Closed: "#6b7280",
};

export default function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-none"
        style={{ backgroundColor: "#1b3a5c" }}
      >
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-white opacity-90 hover:opacity-100" aria-label="Close">
            <X size={20} />
          </button>
          <span className="text-white font-semibold text-base">Notifications</span>
        </div>
        {unreadCount > 0 && (
          <span className="text-white font-semibold text-base">{unreadCount}</span>
        )}
      </div>

      {/* Notification list */}
      <div className="flex-1 overflow-y-auto bg-blue-50 dark:bg-blue-950/30 min-h-0">
        {MOCK_NOTIFICATIONS.map((notification) => (
          <div
            key={notification.id}
            className="bg-blue-50 dark:bg-blue-950/30 px-4 py-4 border-b border-blue-100 dark:border-blue-900/40 flex items-start gap-3"
          >
            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 dark:text-gray-100 leading-snug mb-1">
                {notification.message}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{notification.timestamp}</p>
            </div>

            {/* Right side: tag + unread dot */}
            <div className="flex flex-col items-end gap-1.5 flex-none">
              <span
                className="text-white text-[11px] font-semibold px-2 py-0.5 rounded"
                style={{ backgroundColor: TAG_COLORS[notification.tag] ?? "#6b7280" }}
              >
                {notification.tag}
              </span>
              {notification.unread && (
                <span className="w-2 h-2 rounded-full bg-blue-500 mt-0.5" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
