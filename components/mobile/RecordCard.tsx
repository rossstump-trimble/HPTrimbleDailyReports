"use client";

import { CalendarDays, CheckCircle2, Circle, CloudDownload, MapPin, MessageSquare, MoreVertical, User } from "lucide-react";
import type { MobileRecord } from "@/lib/mobile/mockData";

interface RecordCardProps {
  record: MobileRecord;
  statusColor: string;
  batchMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onClick: () => void;
}

export default function RecordCard({
  record,
  statusColor,
  batchMode,
  selected,
  onToggleSelect,
  onClick,
}: RecordCardProps) {
  const handleClick = () => {
    if (batchMode) {
      onToggleSelect();
    } else {
      onClick();
    }
  };

  return (
    <div
      className="bg-white dark:bg-gray-900 border-l-4 px-4 py-3 relative cursor-pointer"
      style={{
        borderLeftColor: statusColor,
        outline: selected ? "2px solid #2563eb" : "none",
        outlineOffset: "-1px",
      }}
      onClick={handleClick}
    >
      {/* Status badge row */}
      <div className="flex items-start justify-between mb-1">
        <span className="text-xs font-bold tracking-wide" style={{ color: statusColor }}>
          {record.status}
        </span>

        <div className="flex items-center gap-1.5 flex-none ml-2">
          {!record.downloaded && !batchMode && (
            <button
              className="text-blue-500 dark:text-blue-400"
              aria-label="Download"
              onClick={(e) => e.stopPropagation()}
            >
              <CloudDownload size={16} />
            </button>
          )}

          {batchMode ? (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
              aria-label={selected ? "Deselect" : "Select"}
              className="text-blue-500 dark:text-blue-400"
            >
              {selected ? (
                <CheckCircle2 size={22} className="fill-blue-500 text-white" />
              ) : (
                <Circle size={22} className="text-gray-300 dark:text-gray-600" />
              )}
            </button>
          ) : (
            <button
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              aria-label="More options"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Number + title */}
      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-snug mb-1.5">
        {record.number} {record.title}
      </p>

      {/* Location */}
      {record.location && (
        <div className="flex items-center gap-1 mb-2">
          <MapPin size={12} className="text-gray-400 dark:text-gray-500 flex-none" />
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{record.location}</span>
        </div>
      )}

      {/* Meta chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded px-2 py-0.5">
          <CalendarDays size={11} className="text-gray-500 dark:text-gray-400" />
          <span className="text-[11px] text-gray-600 dark:text-gray-300">{record.dueDate}</span>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded px-2 py-0.5">
          <User size={11} className="text-gray-500 dark:text-gray-400" />
          <span className="text-[11px] text-gray-600 dark:text-gray-300">{record.assigneeCount}</span>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded px-2 py-0.5">
          <MessageSquare size={11} className="text-gray-500 dark:text-gray-400" />
          <span className="text-[11px] text-gray-600 dark:text-gray-300">{record.commentCount}</span>
        </div>
      </div>
    </div>
  );
}
