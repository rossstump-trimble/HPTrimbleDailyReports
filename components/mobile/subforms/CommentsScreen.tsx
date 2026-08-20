"use client";

import { useRef, useState } from "react";
import { Camera, ChevronLeft, MoreVertical, Plus } from "lucide-react";
import type { RecordComment } from "@/lib/mobile/mockData";
import AttachmentsSheet from "./AttachmentsSheet";

interface CommentsScreenProps {
  comments: RecordComment[];
  onBack: () => void;
}

export default function CommentsScreen({ comments, onBack }: CommentsScreenProps) {
  const [localComments, setLocalComments] = useState<RecordComment[]>(comments);
  const [newText, setNewText] = useState("");
  const [showAttachments, setShowAttachments] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const submitComment = () => {
    const text = newText.trim();
    if (!text) return;
    setLocalComments((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        authorName: "Jesse Lavine",
        authorInitials: "JL",
        date: new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        text,
      },
    ]);
    setNewText("");
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <header
        className="flex items-center px-3 py-3 flex-none gap-2"
        style={{ backgroundColor: "#1b3a5c" }}
      >
        <button
          onClick={onBack}
          className="text-white opacity-90 hover:opacity-100 p-1"
          aria-label="Back"
        >
          <ChevronLeft size={22} />
        </button>
        <span className="flex-1 text-white font-semibold text-base">Comments</span>
        <button
          onClick={() => inputRef.current?.focus()}
          className="text-white opacity-70 hover:opacity-100 text-sm font-medium"
        >
          Add
        </button>
      </header>

      {/* Comment list — empty space above, comments pinned to bottom */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
        {/* Spacer pushes comments to the bottom when the list is short */}
        <div className="flex-1" />

        {localComments.map((comment) => (
          <CommentRow key={comment.id} comment={comment} />
        ))}
      </div>

      {/* Sticky input bar */}
      <div className="flex-none border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-2 px-4 py-3">
          <input
            ref={inputRef}
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitComment()}
            placeholder="Add a comment..."
            className="flex-1 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 bg-transparent focus:outline-none"
          />
          <button
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 flex-none p-1"
            aria-label="Attach photo"
          >
            <Camera size={20} />
          </button>
          <button
            onClick={() => setShowAttachments(true)}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 flex-none p-1"
            aria-label="Add attachment"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Attachment bottom sheet */}
      {showAttachments && (
        <AttachmentsSheet showUploadFiles onClose={() => setShowAttachments(false)} />
      )}
    </div>
  );
}

// ─── Comment row ──────────────────────────────────────────────────────────────

function CommentRow({ comment }: { comment: RecordComment }) {
  return (
    <div className="px-4 pt-3 pb-3 border-t border-gray-100 dark:border-gray-800">
      {/* Author + date + menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Generic person avatar */}
          <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center flex-none overflow-hidden">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-gray-500 dark:text-gray-400"
              fill="currentColor"
            >
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">
              {comment.authorName}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 leading-tight whitespace-nowrap">
              {comment.date}
            </span>
          </div>
        </div>
        <button className="text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 flex-none p-0.5 mt-0.5">
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Optional badge */}
      {comment.badge && (
        <div className="flex items-center gap-1.5 mt-2 ml-9">
          <span
            className="w-4 h-4 rounded-full flex items-center justify-center flex-none"
            style={{ backgroundColor: comment.badgeColor }}
          >
            <svg
              viewBox="0 0 12 12"
              className="w-2.5 h-2.5 text-white"
              fill="currentColor"
            >
              <path d="M10 3L5 8.5 2 5.5l-1 1 4 4 6-7z" />
            </svg>
          </span>
          <span
            className="text-sm font-semibold"
            style={{ color: comment.badgeColor }}
          >
            {comment.badge}
          </span>
        </div>
      )}

      {/* Comment text */}
      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1.5 ml-9 leading-snug">{comment.text}</p>
    </div>
  );
}
