"use client";

import { useState } from "react";
import { ChevronRight, List, MessageCircle, MoreHorizontal, X } from "lucide-react";

interface Props {
  onBack: () => void;
}

const ARTICLES = [
  {
    id: "welcome",
    breadcrumb: ["Home", "…", "ProjectSight Mobile", "Welcome to ProjectSight Mobile"],
    title: "Welcome to ProjectSight Mobile",
    modified: "19 Jun 2026",
    body: [
      "ProjectSight Mobile enables you to capture and update project information while you're out in the field.",
      "Use the app to manage punch items, RFIs, submittals, checklists, daily reports, and more — all synced with your web account.",
    ],
    note: "Your administrator sets the permissions that control what you can see and do in the app.",
  },
  {
    id: "drawings",
    breadcrumb: ["Home", "…", "ProjectSight Mobile", "Drawings"],
    title: "Drawings",
    modified: "12 May 2026",
    body: [
      "Download drawing sheets to your device for offline use. Tap any drawing to open the full-screen viewer.",
      "Use pinch-to-zoom and pan gestures to navigate. Annotations such as punch pins and cloud markups are displayed on top of the drawing.",
    ],
    note: "Only drawings marked as downloaded are available offline.",
  },
  {
    id: "punch",
    breadcrumb: ["Home", "…", "ProjectSight Mobile", "Punch Items"],
    title: "Punch Items",
    modified: "3 Apr 2026",
    body: [
      "Punch items represent deficiencies found during inspections. You can create, assign, and close punch items directly from the mobile app.",
      "To add a punch item to a drawing, open the drawing viewer, tap '+', and place a pin on the location.",
    ],
    note: "Closed punch items require manager approval before they are removed from the active list.",
  },
];

const CONTENTS = [
  "Welcome to ProjectSight Mobile",
  "Sign in",
  "My Projects",
  "Drawings",
  "Specifications",
  "Punch Items",
  "RFIs",
  "Submittals",
  "Daily Reports",
  "Team Members",
  "Notifications",
  "Offline mode",
];

export default function HelpScreen({ onBack }: Props) {
  const [activeArticle, setActiveArticle] = useState(ARTICLES[0]);
  const [showContents, setShowContents] = useState(false);
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="flex flex-col flex-1 overflow-hidden relative bg-white dark:bg-gray-900">
      {/* App header */}
      <header className="flex items-center px-3 py-3 flex-none" style={{ backgroundColor: "#1b3a5c" }}>
        <button onClick={onBack} className="text-white p-1 mr-2"><X size={20} /></button>
        <h1 className="text-white font-semibold text-base">Help</h1>
      </header>

      {/* Trimble help site header */}
      <div className="flex items-center px-4 py-3 flex-none bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 flex-1">
          <img src="/images/trimble-logo.png" alt="Trimble" className="h-7 w-auto" />
          <span className="text-gray-700 dark:text-gray-200 text-base font-medium">Help</span>
        </div>
        <button className="text-gray-500 dark:text-gray-400 p-1">
          <MoreHorizontal size={22} />
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center flex-wrap gap-1 px-4 py-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-none">
        {activeArticle.breadcrumb.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} className="text-gray-400 dark:text-gray-500" />}
            <span className={`text-xs ${i < activeArticle.breadcrumb.length - 1 ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-200 font-medium"}`}>
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Show contents button */}
        <button
          className="w-full flex items-center justify-center gap-2 mx-auto my-4 border border-gray-300 dark:border-gray-700 rounded py-2.5 text-blue-600 dark:text-blue-400 text-sm font-medium bg-white dark:bg-gray-900"
          style={{ width: "calc(100% - 32px)", marginLeft: 16, marginRight: 16 }}
          onClick={() => setShowContents(!showContents)}
        >
          <List size={18} className="text-blue-600 dark:text-blue-400" />
          {showContents ? "Hide contents" : "Show contents"}
        </button>

        {/* Contents panel */}
        {showContents && (
          <div className="mx-4 mb-4 border border-gray-200 dark:border-gray-800 rounded bg-gray-50 dark:bg-gray-900">
            {CONTENTS.map((item, i) => (
              <button
                key={i}
                className="w-full text-left px-4 py-2.5 text-sm text-blue-600 dark:text-blue-400 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => {
                  const found = ARTICLES.find(a => a.title === item);
                  if (found) setActiveArticle(found);
                  setShowContents(false);
                }}
              >
                {item}
              </button>
            ))}
          </div>
        )}

        <div className="px-4 pb-8">
          {/* Article title */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
            {activeArticle.title}
          </h1>

          {/* Modified date */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-gray-600 dark:text-gray-400">
              Modified: {activeArticle.modified}
            </span>
            <button
              className="text-blue-600 dark:text-blue-400 text-sm flex items-center gap-1"
              onClick={() => setShowMore(!showMore)}
            >
              Show {showMore ? "less" : "more"}
              <ChevronRight size={14} className={`transition-transform ${showMore ? "rotate-90" : ""}`} />
            </button>
          </div>

          {/* Body paragraphs */}
          {activeArticle.body.map((para, i) => (
            <p key={i} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">{para}</p>
          ))}

          {/* Note box */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <span className="font-bold">Note:</span> {activeArticle.note}
            </p>
          </div>

          {/* Navigation between articles */}
          <div className="mt-8 flex flex-col gap-2">
            {ARTICLES.filter(a => a.id !== activeArticle.id).map(a => (
              <button
                key={a.id}
                className="text-left text-blue-600 dark:text-blue-400 text-sm flex items-center gap-1 hover:underline"
                onClick={() => setActiveArticle(a)}
              >
                <ChevronRight size={14} />
                {a.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat FAB */}
      <button className="absolute bottom-5 right-4 w-11 h-11 rounded-full bg-gray-800 flex items-center justify-center shadow-lg">
        <MessageCircle size={20} className="text-white" />
      </button>
    </div>
  );
}
