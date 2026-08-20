"use client";

import { useEffect, useState } from "react";
import { EyeOff, History, Send, XCircle } from "lucide-react";

interface DrawingMoreMenuProps {
  annotationsHidden: boolean;
  onToggleAnnotations: () => void;
  onShare: () => void;
  onClose: () => void;
}

export default function DrawingMoreMenu({
  annotationsHidden,
  onToggleAnnotations,
  onShare,
  onClose,
}: DrawingMoreMenuProps) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true))); }, []);
  const handleClose = () => { setVisible(false); setTimeout(onClose, 250); };

  return (
    <>
      <div
        className="absolute inset-0 z-20 bg-black/40 transition-opacity duration-250"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={handleClose}
      />
      <div
        className="absolute bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 rounded-t-2xl overflow-hidden transition-transform duration-250"
        style={{ transform: visible ? "translateY(0)" : "translateY(100%)" }}
      >
        <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
          <button className="flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-800">
            <History size={20} className="text-gray-600 dark:text-gray-300 flex-none" />
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Recently Viewed</span>
          </button>
          <button onClick={() => { onToggleAnnotations(); handleClose(); }} className="flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-800">
            <EyeOff size={20} className="text-gray-600 dark:text-gray-300 flex-none" />
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{annotationsHidden ? "Show Annotations" : "Hide Annotations"}</span>
          </button>
          <button onClick={() => { onShare(); handleClose(); }} className="flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-800">
            <Send size={20} className="text-gray-600 dark:text-gray-300 flex-none" />
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Share</span>
          </button>
          <button onClick={handleClose} className="flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-800">
            <XCircle size={20} className="text-gray-500 dark:text-gray-400 flex-none" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Cancel</span>
          </button>
        </div>
      </div>
    </>
  );
}
