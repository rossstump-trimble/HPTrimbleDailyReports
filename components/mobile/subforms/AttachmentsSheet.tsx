"use client";

import { useEffect, useState } from "react";
import { Camera, File, Image as ImageIcon, Link, MapPin, XCircle } from "lucide-react";

interface AttachmentsSheetProps {
  onClose: () => void;
  /** Show the "Upload files" option (used in the Comments context) */
  showUploadFiles?: boolean;
}

const BASE_ACTIONS = [
  { label: "Pin to a Drawing", icon: <MapPin size={20} className="text-gray-600 dark:text-gray-300" /> },
  { label: "Link Drawings", icon: <Link size={20} className="text-gray-600 dark:text-gray-300" /> },
  { label: "Photos/Videos", icon: <ImageIcon size={20} className="text-gray-600 dark:text-gray-300" /> },
  { label: "Take Photos", icon: <Camera size={20} className="text-gray-600 dark:text-gray-300" /> },
];

const UPLOAD_ACTION = { label: "Upload files", icon: <File size={20} className="text-gray-600 dark:text-gray-300" /> };

export default function AttachmentsSheet({ onClose, showUploadFiles = false }: AttachmentsSheetProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 250);
  };

  const actions = showUploadFiles
    ? [...BASE_ACTIONS, UPLOAD_ACTION]
    : BASE_ACTIONS;

  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 z-30 bg-black/40 transition-opacity duration-250"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 rounded-t-2xl overflow-hidden transition-transform duration-250"
        style={{ transform: visible ? "translateY(0)" : "translateY(100%)" }}
      >
        <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={handleClose}
              className="flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
            >
              <span className="flex-none">{action.icon}</span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{action.label}</span>
            </button>
          ))}

          {/* Cancel */}
          <button
            onClick={handleClose}
            className="flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
          >
            <XCircle size={20} className="text-gray-500 dark:text-gray-400 flex-none" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Cancel</span>
          </button>
        </div>
      </div>
    </>
  );
}
