"use client";

import { Bell, Edit, Menu, Search } from "lucide-react";
import Link from "next/link";

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  onMenuOpen?: () => void;
  showEdit?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
  notificationCount?: number;
  onNotificationsOpen?: () => void;
}

export default function MobileHeader({
  title,
  subtitle,
  onMenuOpen,
  showEdit = false,
  showSearch = false,
  showNotifications = false,
  notificationCount = 0,
  onNotificationsOpen,
}: MobileHeaderProps) {
  return (
    <header
      className="flex items-center px-3 py-3 flex-none"
      style={{ backgroundColor: "#1b3a5c" }}
    >
      {onMenuOpen && (
        <button
          onClick={onMenuOpen}
          className="mr-3 text-white opacity-90 hover:opacity-100 p-1"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
      )}

      <div className="flex-1 min-w-0">
        <h1 className="text-white font-semibold text-base leading-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-white text-xs opacity-70 leading-tight truncate">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 ml-2">
        {showEdit && (
          <button className="text-white opacity-90 hover:opacity-100 p-1" aria-label="Edit">
            <Edit size={20} />
          </button>
        )}

        {showNotifications && (
          <button
            onClick={onNotificationsOpen}
            className="relative text-white opacity-90 hover:opacity-100 p-1"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-[3px]">
                {notificationCount}
              </span>
            )}
          </button>
        )}

        {showSearch && (
          <button className="text-white opacity-90 hover:opacity-100 p-1" aria-label="Search">
            <Search size={20} />
          </button>
        )}
      </div>
    </header>
  );
}
