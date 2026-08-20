"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, Bell, Check, ChevronDown, Mail, MessageCircle, Phone, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { TEAM_MEMBERS, TeamMember, MOBILE_PROJECTS } from "@/lib/mobile/mockData";
import MobileNavDrawer from "./MobileNavDrawer";
import NotificationsPanel from "./NotificationsPanel";

type SortKey = "company" | "firstName" | "lastName";
type SubScreen = "list" | "detail" | "invite";

interface Props {
  projectId: string;
  onBack: () => void;
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

function MemberAvatar({ member, size = 40 }: { member: TeamMember; size?: number }) {
  if (member.photoUrl) {
    return (
      <img
        src={member.photoUrl}
        alt={member.name}
        className="rounded-full object-cover flex-none"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center flex-none text-sm font-semibold"
      style={{ width: size, height: size, background: "#dbeafe", color: "#1e40af" }}
    >
      {member.initials}
    </div>
  );
}


// ─── Sort Modal ───────────────────────────────────────────────────────────────

function SortModal({ current, onChange, onClose }: { current: SortKey; onChange: (k: SortKey) => void; onClose: () => void }) {
  const options: { key: SortKey; label: string }[] = [
    { key: "company", label: "Company" },
    { key: "firstName", label: "First name" },
    { key: "lastName", label: "Last name" },
  ];
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl mx-6 w-full max-w-xs overflow-hidden" onClick={e => e.stopPropagation()}>
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 tracking-widest px-5 pt-5 pb-3">SORT BY</p>
        {options.map((opt, i) => (
          <button
            key={opt.key}
            className="w-full flex items-center justify-between px-5 py-4 text-base text-gray-800 dark:text-gray-100 border-t border-gray-100 dark:border-gray-800"
            onClick={() => { onChange(opt.key); onClose(); }}
          >
            {opt.label}
            {current === opt.key && <Check size={18} className="text-blue-500 dark:text-blue-400" />}
          </button>
        ))}
        <div className="h-4" />
      </div>
    </div>
  );
}

// ─── Member Detail Screen ─────────────────────────────────────────────────────

function MemberDetail({ member, onBack }: { member: TeamMember; onBack: () => void }) {
  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <header className="flex items-center px-3 py-3 flex-none" style={{ backgroundColor: "#1b3a5c" }}>
        <button onClick={onBack} className="text-white p-1 mr-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-white font-semibold text-base">Member</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Avatar + name */}
        <div className="flex flex-col items-center py-6 border-b border-gray-200 dark:border-gray-800">
          <MemberAvatar member={member} size={72} />
          <p className="mt-3 text-lg font-semibold text-gray-800 dark:text-gray-100">{member.name}</p>
        </div>

        {/* Contact rows */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          <div className="px-5 py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Company</p>
            <p className="text-base text-gray-800 dark:text-gray-100 mt-0.5">{member.company}</p>
          </div>

          {member.phone && (
            <div className="flex items-center px-5 py-4 gap-3">
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                <p className="text-base text-gray-800 dark:text-gray-100 mt-0.5">{member.phone}</p>
              </div>
              <button className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#1b3a5c" }}>
                <Phone size={18} className="text-white" />
              </button>
            </div>
          )}

          {member.mobile && (
            <div className="flex items-center px-5 py-4 gap-3">
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Mobile</p>
                <p className="text-base text-gray-800 dark:text-gray-100 mt-0.5">{member.mobile}</p>
              </div>
              <div className="flex gap-2">
                <button className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#1b3a5c" }}>
                  <MessageCircle size={18} className="text-white" />
                </button>
                <button className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#1b3a5c" }}>
                  <Phone size={18} className="text-white" />
                </button>
              </div>
            </div>
          )}

          {member.email && (
            <div className="flex items-center px-5 py-4 gap-3">
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-base text-gray-800 dark:text-gray-100 mt-0.5">{member.email}</p>
              </div>
              <button className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#1b3a5c" }}>
                <Mail size={18} className="text-white" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Invite Screen ────────────────────────────────────────────────────────────

function InviteScreen({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Standard User");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [cellphone, setCellphone] = useState("");

  const roles = ["Standard User", "Project Admin", "Read Only", "Contractor"];

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <header className="flex items-center px-3 py-3 flex-none" style={{ backgroundColor: "#1b3a5c" }}>
        <button onClick={onBack} className="text-white p-1 mr-2">
          <X size={20} />
        </button>
        <h1 className="text-white font-semibold text-base flex-1">Invite team member</h1>
        <div className="flex items-center gap-3">
          <button className="text-white opacity-70"><Plus size={20} /></button>
          <button className="text-white font-medium text-sm">Invite</button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        <div>
          <label className="text-sm text-gray-700 dark:text-gray-300">Email <span className="text-red-500">*</span></label>
          <input
            className="mt-1 w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-500"
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder=""
            type="email"
          />
        </div>

        <div>
          <label className="text-sm text-gray-700 dark:text-gray-300">Security role <span className="text-red-500">*</span></label>
          <div className="mt-1 relative">
            <select
              className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2.5 text-sm appearance-none focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
              value={role} onChange={e => setRole(e.target.value)}
            >
              {roles.map(r => <option key={r}>{r}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-700 dark:text-gray-300">First name <span className="text-red-500">*</span></label>
          <input
            className="mt-1 w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-500"
            value={firstName} onChange={e => setFirstName(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-gray-700 dark:text-gray-300">Last name <span className="text-red-500">*</span></label>
          <input
            className="mt-1 w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-500"
            value={lastName} onChange={e => setLastName(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-gray-700 dark:text-gray-300">Company <span className="text-red-500">*</span></label>
          <div className="mt-1 flex">
            <input
              className="flex-1 border border-gray-300 dark:border-gray-700 rounded-l px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500"
              value={company} onChange={e => setCompany(e.target.value)}
              placeholder="Enter or search..."
            />
            <button className="px-3 py-2.5 rounded-r flex items-center justify-center" style={{ backgroundColor: "#1b3a5c" }}>
              <Search size={18} className="text-white" />
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-700 dark:text-gray-300">Cellphone</label>
          <input
            className="mt-1 w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-500"
            value={cellphone} onChange={e => setCellphone(e.target.value)}
            type="tel"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TeamMembersScreen({ projectId, onBack }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("lastName");
  const [showSort, setShowSort] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [subScreen, setSubScreen] = useState<SubScreen>("list");
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const project = MOBILE_PROJECTS.find((p) => p.id === projectId) ?? MOBILE_PROJECTS[0];

  const sortLabel: Record<SortKey, string> = {
    company: "Company",
    firstName: "First name",
    lastName: "Last name",
  };

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return TEAM_MEMBERS.filter(m =>
      !q || m.name.toLowerCase().includes(q) || m.company.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const grouped = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => {
      const va = a[sortKey].toLowerCase();
      const vb = b[sortKey].toLowerCase();
      return va.localeCompare(vb);
    });
    const sections: { letter: string; members: TeamMember[] }[] = [];
    for (const m of sorted) {
      const letter = (m[sortKey][0] ?? "#").toUpperCase();
      const last = sections[sections.length - 1];
      if (last && last.letter === letter) {
        last.members.push(m);
      } else {
        sections.push({ letter, members: [m] });
      }
    }
    return sections;
  }, [filtered, sortKey]);

  if (subScreen === "detail" && selectedMember) {
    return <MemberDetail member={selectedMember} onBack={() => setSubScreen("list")} />;
  }
  if (subScreen === "invite") {
    return <InviteScreen onBack={() => setSubScreen("list")} />;
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden relative">
      <MobileNavDrawer
        isOpen={navOpen}
        onClose={() => setNavOpen(false)}
        projectId={project.id}
        projectName={`${project.number} - ${project.name}`}
        companyName={project.company}
      />
      {notificationsOpen && <NotificationsPanel onClose={() => setNotificationsOpen(false)} />}
      {showSort && (
        <SortModal current={sortKey} onChange={setSortKey} onClose={() => setShowSort(false)} />
      )}

      {/* Header */}
      <header className="flex items-center px-3 py-3 flex-none z-10" style={{ backgroundColor: "#1b3a5c" }}>
        {searchMode ? (
          <>
            <input
              autoFocus
              className="flex-1 bg-white/20 text-white placeholder-white/60 rounded px-3 py-1.5 text-sm focus:outline-none"
              placeholder="Search members…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button className="ml-2 text-white text-sm" onClick={() => { setSearchMode(false); setSearchQuery(""); }}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setNavOpen(true)} className="mr-3 text-white opacity-90 hover:opacity-100 p-1">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <h1 className="text-white font-semibold text-base flex-1">Team members</h1>
            <div className="flex items-center gap-1">
              <button className="relative p-2 text-white" onClick={() => setNotificationsOpen(true)}>
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">6</span>
              </button>
              <button className="p-2 text-white" onClick={() => setSearchMode(true)}><Search size={20} /></button>
              <button className="p-2 text-white" onClick={() => setSubScreen("invite")}><Plus size={20} /></button>
            </div>
          </>
        )}
      </header>

      {/* Sub-header: count + sort */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-none">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider">{TEAM_MEMBERS.length} MEMBERS</span>
        <button className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm font-medium" onClick={() => setShowSort(true)}>
          <SlidersHorizontal size={14} />
          Sort
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-950">
        {grouped.map(({ letter, members }) => (
          <div key={letter}>
            <div className="px-4 py-1.5 bg-gray-100 dark:bg-gray-900">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{letter}</span>
            </div>
            {members.map(member => (
              <button
                key={member.id}
                className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
                onClick={() => { setSelectedMember(member); setSubScreen("detail"); }}
              >
                <MemberAvatar member={member} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{member.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.company}</p>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
