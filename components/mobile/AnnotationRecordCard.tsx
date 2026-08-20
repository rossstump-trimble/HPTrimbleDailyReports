"use client";

import { CalendarDays, Users, MessageSquare, Download, X } from "lucide-react";

export interface AnnotationRecord {
  type: string;
  status: string;
  statusColor: string;
  number: string;
  title: string;
  description: string;
  date: string;
  assigneeCount: number;
  commentCount: number;
  recordType: string;
  recordId: string;
  latestComment?: {
    authorInitials: string;
    authorName: string;
    date: string;
    text: string;
  };
}

interface AnnotationRecordCardProps {
  record: AnnotationRecord;
  onOpen: () => void;
  onClose: () => void;
}

export default function AnnotationRecordCard({
  record,
  onOpen,
  onClose,
}: AnnotationRecordCardProps) {
  return (
    <div className="absolute bottom-0 inset-x-0 z-10 px-3 pb-3">
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
        onClick={onOpen}
      >
        {/* Top row: type · status · download · close */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            {record.type}
          </span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded"
            style={{ color: record.statusColor, background: `${record.statusColor}18` }}
          >
            {record.status}
          </span>
          <div className="flex-1" />
          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 p-1"
          >
            <Download size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1"
          >
            <X size={16} />
          </button>
        </div>

        {/* Title */}
        <div className="px-4 pb-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug line-clamp-1">
            {record.number} {record.title}
          </p>
        </div>

        {/* Latest comment (if present) or description */}
        <div className="px-4 pb-3">
          {record.latestComment ? (
            <div className="flex items-start gap-2.5">
              {/* Author avatar */}
              <div
                className="flex-none w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold mt-0.5"
                style={{ background: "#2563eb" }}
              >
                {record.latestComment.authorInitials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 mb-0.5">
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 truncate">
                    {record.latestComment.authorName}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-none">
                    {record.latestComment.date}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">
                  {record.latestComment.text}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-blue-400 dark:text-blue-500 flex-none">
                <MessageSquare size={13} />
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">
                {record.description}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-4 pb-3 border-t border-gray-50 dark:border-gray-800 pt-2">
          <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
            <CalendarDays size={12} />
            <span className="text-[11px]">{record.date}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
            <Users size={12} />
            <span className="text-[11px]">{record.assigneeCount}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
            <MessageSquare size={12} />
            <span className="text-[11px]">{record.commentCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
