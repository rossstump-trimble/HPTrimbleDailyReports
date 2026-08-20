"use client";

import { useState } from "react";
import { ChevronLeft, Search, Trash2 } from "lucide-react";
import type { Assignee } from "@/lib/mobile/mockData";
import { MOCK_CONTACTS } from "@/lib/mobile/mockData";

interface ContactListScreenProps {
  title: string;
  assignees: Assignee[];
  onChange: (assignees: Assignee[]) => void;
  onBack: () => void;
}

export default function ContactListScreen({
  title,
  assignees,
  onChange,
  onBack,
}: ContactListScreenProps) {
  const [list, setList] = useState<Assignee[]>(assignees);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState("");

  const toggleDone = (id: string) => {
    setList((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              isDone: !a.isDone,
              doneDate: !a.isDone ? new Date().toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "2-digit" }) : undefined,
            }
          : a
      )
    );
  };

  const removeAssignee = (id: string) => {
    const next = list.filter((a) => a.id !== id);
    setList(next);
    onChange(next);
  };

  const addContact = (contact: typeof MOCK_CONTACTS[0]) => {
    const next = [
      ...list,
      {
        id: `${contact.id}-${Date.now()}`,
        name: contact.name,
        company: contact.company,
        dueDate: "11/30/26",
        isDone: false,
      },
    ];
    setList(next);
    onChange(next);
    setShowPicker(false);
  };

  if (showPicker) {
    const filtered = search
      ? MOCK_CONTACTS.filter(
          (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.company.toLowerCase().includes(search.toLowerCase())
        )
      : MOCK_CONTACTS;

    return (
      <div className="absolute inset-0 z-20 flex flex-col bg-gray-50 dark:bg-gray-950">
        <header
          className="flex items-center px-3 py-3 flex-none gap-2"
          style={{ backgroundColor: "#1b3a5c" }}
        >
          <button
            onClick={() => { setShowPicker(false); setSearch(""); }}
            className="text-white opacity-90 hover:opacity-100 p-1"
          >
            <ChevronLeft size={22} />
          </button>
          <span className="flex-1 text-white font-semibold text-base">Add {title}</span>
        </header>

        <div className="px-3 py-2.5 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-none">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
            <Search size={15} className="text-gray-400 dark:text-gray-500 flex-none" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {filtered.map((c) => {
            const alreadyAdded = list.some((a) => a.name === c.name);
            return (
              <button
                key={c.id}
                onClick={() => !alreadyAdded && addContact(c)}
                disabled={alreadyAdded}
                className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 text-left bg-white dark:bg-gray-900 ${
                  alreadyAdded ? "opacity-40" : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-none"
                  style={{ backgroundColor: "#1b3a5c" }}
                >
                  {c.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{c.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{c.company}</p>
                </div>
                {alreadyAdded && (
                  <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">Added</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-gray-50 dark:bg-gray-950">
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
        <span className="flex-1 text-white font-semibold text-base">{title}</span>
        <button className="text-white opacity-80 hover:opacity-100 p-1" aria-label="Search">
          <Search size={20} />
        </button>
      </header>

      {/* Sub-header with count + Add */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-none">
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          {title} ({list.length})
        </span>
        <button
          onClick={() => setShowPicker(true)}
          className="text-sm font-semibold text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
        >
          Add
        </button>
      </div>

      {/* Assignee list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {list.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center mt-12">No {title.toLowerCase()} yet</p>
        )}
        {list.map((a) => (
          <div
            key={a.id}
            className="flex items-center px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                {a.name} ({a.company})
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {a.isDone ? (
                  <>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#9ca3af" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span className="text-xs text-gray-400 dark:text-gray-500">Done on {a.doneDate}</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#ef4444" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{a.dueDate}</span>
                  </>
                )}
              </div>
            </div>

            {/* Mark done toggle */}
            <button
              onClick={() => toggleDone(a.id)}
              className="p-2 ml-1"
              aria-label={a.isDone ? "Mark incomplete" : "Mark done"}
            >
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke={a.isDone ? "#16a34a" : "#2563eb"}
                strokeWidth="2.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>

            {/* Delete */}
            <button
              onClick={() => removeAssignee(a.id)}
              className="p-2 ml-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400"
              aria-label="Remove"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
