"use client";

import { useState } from "react";
import { Bell, ChevronLeft, Globe, MoreHorizontal, Pencil, Search, SlidersHorizontal, X } from "lucide-react";

interface Props {
  onBack: () => void;
}

const FEATURED_ARTICLES = [
  {
    id: "1",
    title: "Have Your Say: Product Office Hours",
    excerpt: "We're always looking for new ways to make it easy for you to connect with product experts, get your questions answered, and share feedback.",
    imageSrc: "https://images.unsplash.com/photo-1551836022-4c4c79ecde51?w=400&h=200&fit=crop",
    votes: 42,
    comments: 8,
  },
  {
    id: "2",
    title: "Introducing the New Mobile Dashboard",
    excerpt: "The updated dashboard gives you a quick overview of your project's health, including open punch items, pending RFIs, and recent activity.",
    imageSrc: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=200&fit=crop",
    votes: 87,
    comments: 14,
  },
];

const TRENDING_IDEAS = [
  { id: "t1", title: "Bulk export punch items to PDF", votes: 234, status: "Under Review" },
  { id: "t2", title: "Offline mode for specifications", votes: 198, status: "Planned" },
  { id: "t3", title: "Dark mode support", votes: 176, status: "Under Review" },
  { id: "t4", title: "Calendar view for daily reports", votes: 142, status: "Gathering Feedback" },
  { id: "t5", title: "QR code scanning for equipment", votes: 117, status: "Gathering Feedback" },
];

const STATUS_COLORS: Record<string, string> = {
  "Under Review": "#f59e0b",
  "Planned": "#3b82f6",
  "Gathering Feedback": "#8b5cf6",
  "Shipped": "#16a34a",
};

export default function IdeaPortalScreen({ onBack }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSubmit, setShowSubmit] = useState(false);
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaBody, setIdeaBody] = useState("");

  const filtered = TRENDING_IDEAS.filter(i =>
    !searchQuery || i.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden relative bg-white dark:bg-gray-900">
      {/* App header */}
      <header className="flex items-center px-3 py-3 flex-none" style={{ backgroundColor: "#1b3a5c" }}>
        <button className="text-white p-1 mr-3">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 className="text-white font-semibold text-base flex-1">Idea Portal</h1>
        <button onClick={onBack} className="text-white p-1"><X size={20} /></button>
      </header>

      {/* Trimble site top bar */}
      <div className="flex items-center px-3 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-none">
        <button className="text-gray-500 dark:text-gray-400 p-1 mr-1"><MoreHorizontal size={20} /></button>
        <div className="flex items-center gap-1 flex-1">
          <img src="/images/trimble-logo.png" alt="Trimble" className="h-6 w-auto" />
        </div>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
            <Globe size={16} className="text-white" />
          </button>
          <button className="relative w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
            <Bell size={16} className="text-white" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">6</span>
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-300 dark:border-gray-700">
            <img src="https://i.pravatar.cc/40?img=11" alt="User" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Network best practices banner */}
      <div className="flex items-center justify-between px-4 py-2 flex-none" style={{ backgroundColor: "#60a5fa" }}>
        <span className="text-white text-sm font-semibold">Network Best Practices</span>
        <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-white">
          <img src="https://i.pravatar.cc/40?img=5" alt="" className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
        {/* Hero section */}
        <div className="bg-gray-100 dark:bg-gray-900 px-4 pt-6 pb-5">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Product Ideas</h1>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Your Ideas. Our Roadmap. Drive Trimble Products Forward.
          </p>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2.5 shadow-sm">
              <Search size={16} className="text-gray-400 dark:text-gray-500 flex-none" />
              <input
                className="flex-1 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none bg-transparent"
                placeholder="Find what you're looking for…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="w-10 h-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center shadow-sm">
              <SlidersHorizontal size={16} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <button className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm">
            <ChevronLeft size={14} />
            Home
          </button>
        </div>

        {/* Featured articles */}
        {!searchQuery && (
          <div className="px-4 pt-5 pb-2">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">Featured Article</h2>
            {FEATURED_ARTICLES.map(article => (
              <div key={article.id} className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm mb-4">
                <img src={article.imageSrc} alt={article.title} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <h3 className="text-base font-bold text-blue-700 dark:text-blue-400 mb-1">{article.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">{article.excerpt}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trending ideas */}
        <div className="px-4 pt-2 pb-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
            {searchQuery ? `Results (${filtered.length})` : "Trending Ideas"}
          </h2>
          <div className="flex flex-col gap-3">
            {filtered.map(idea => (
              <div key={idea.id} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-0.5 flex-none">
                    <button className="text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400">
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                        <path d="M12 4l8 8H4z" />
                      </svg>
                    </button>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{idea.votes}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug">{idea.title}</p>
                    <span
                      className="inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: STATUS_COLORS[idea.status] ?? "#6b7280" }}
                    >
                      {idea.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Submit idea FAB */}
      {!showSubmit && (
        <button
          className="absolute bottom-5 right-4 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg hover:bg-blue-700"
          onClick={() => setShowSubmit(true)}
        >
          <Pencil size={20} className="text-white" />
        </button>
      )}

      {/* Submit idea sheet */}
      {showSubmit && (
        <div className="absolute inset-0 z-50 flex flex-col bg-white dark:bg-gray-900">
          <header className="flex items-center px-3 py-3 flex-none border-b border-gray-200 dark:border-gray-800">
            <button onClick={() => setShowSubmit(false)} className="p-1 mr-2 text-gray-600 dark:text-gray-300"><X size={20} /></button>
            <h1 className="font-semibold text-base flex-1 text-gray-900 dark:text-gray-100">Submit an Idea</h1>
            <button
              className="px-4 py-1.5 rounded text-sm font-semibold text-white"
              style={{ backgroundColor: "#1b3a5c" }}
              onClick={() => setShowSubmit(false)}
            >
              Submit
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title <span className="text-red-500">*</span></label>
              <input
                className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:border-blue-500"
                placeholder="Summarize your idea in one line"
                value={ideaTitle}
                onChange={e => setIdeaTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:border-blue-500 resize-none"
                rows={6}
                placeholder="Describe the problem you're trying to solve and how your idea would help…"
                value={ideaBody}
                onChange={e => setIdeaBody(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
