"use client";

import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ClipboardCheck,
  ExternalLink,
  FileText,
  HardHat,
  HelpCircle,
  Home,
  Layers,
  Lightbulb,
  LogOut,
  MessageSquare,
  PenLine,
  Settings,
  ShieldAlert,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  external?: boolean;
}

const PROJECT_MENU_ITEMS: NavItem[] = [
  { label: "Home", icon: <Home size={18} />, href: "" },
  { label: "Drawings", icon: <Layers size={18} />, href: "/drawings" },
  { label: "Specifications", icon: <FileText size={18} />, href: "/specifications" },
  { label: "Team members", icon: <Users size={18} />, href: "/team" },
];

const RECORDS_ITEMS: NavItem[] = [
  { label: "Action items", icon: <CheckCircle2 size={18} />, href: "/records/action-items" },
  { label: "Checklists", icon: <ClipboardCheck size={18} />, href: "/records/checklists" },
  { label: "Daily reports", icon: <Calendar size={18} />, href: "/records/daily-reports" },
  { label: "Field work directives", icon: <PenLine size={18} />, href: "/records/field-work-directives" },
  { label: "Issues", icon: <AlertTriangle size={18} />, href: "/records/issues" },
  { label: "Notices to comply", icon: <XCircle size={18} />, href: "/records/notices-to-comply" },
  { label: "Punch items", icon: <CheckSquare size={18} />, href: "/records/punch-items" },
  { label: "RFIs", icon: <MessageSquare size={18} />, href: "/records/rfis" },
  { label: "Safety notices", icon: <ShieldAlert size={18} />, href: "/records/safety-notices" },
  { label: "Submittal packages", icon: <HardHat size={18} />, href: "/records/submittal-packages" },
  { label: "Submittals", icon: <FileText size={18} />, href: "/records/submittals" },
];

const RESOURCES_ITEMS: NavItem[] = [
  { label: "Trimble Connect", icon: <ExternalLink size={18} />, href: "/trimble-connect", external: true },
  { label: "Settings", icon: <Settings size={18} />, href: "/mobile/settings" },
  { label: "My profile", icon: <User size={18} />, href: "/mobile/profile" },
  { label: "Help", icon: <HelpCircle size={18} />, href: "/mobile/help" },
  { label: "Idea portal", icon: <Lightbulb size={18} />, href: "/mobile/ideas" },
  { label: "Sign out", icon: <LogOut size={18} />, href: "/mobile/signin" },
];

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  companyName: string;
}

export default function MobileNavDrawer({
  isOpen,
  onClose,
  projectId,
  projectName,
  companyName,
}: MobileNavDrawerProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const base = `/mobile/projects/${projectId}`;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="absolute inset-0 bg-black/40 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer panel */}
      <aside
        className={`absolute inset-y-0 left-0 z-50 w-[280px] bg-white dark:bg-gray-900 flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-modal="true"
        role="dialog"
      >
        {/* Drawer header — project name + avatar */}
        <div
          className="flex items-start p-4 pt-5 flex-none"
          style={{ backgroundColor: "#1b3a5c" }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-tight truncate">
              {projectName}
            </p>
            <p className="text-white text-xs opacity-70 mt-0.5">{companyName}</p>
          </div>
          {/* Project image circle */}
          <div className="w-10 h-10 rounded-full border-2 border-white/40 overflow-hidden flex-none ml-2">
            <img
              src="/images/project-render.jpg"
              alt="Project"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* My projects back link */}
        <Link
          href="/mobile/projects"
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 flex-none"
        >
          <ChevronLeft size={18} className="text-gray-400 dark:text-gray-500" />
          My projects
        </Link>

        {/* Scrollable nav content */}
        <nav className="flex-1 overflow-y-auto min-h-0">
          {/* Project menu */}
          <div className="pt-3 pb-1">
            <p className="px-4 py-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Project menu
            </p>
            {PROJECT_MENU_ITEMS.map((item) => (
              <NavLink key={item.label} item={item} base={base} onClose={onClose} />
            ))}
          </div>

          {/* Records */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-3 pb-1">
            <p className="px-4 py-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Records
            </p>
            {RECORDS_ITEMS.map((item) => (
              <NavLink key={item.label} item={item} base={base} onClose={onClose} />
            ))}
          </div>

          {/* Resources */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-3 pb-1">
            <p className="px-4 py-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Resources
            </p>
            {RESOURCES_ITEMS.map((item) => (
              <NavLink key={item.label} item={item} base={base} onClose={onClose} />
            ))}
          </div>

          {/* ProjectSight logo lockup */}
          <div className="border-t border-gray-100 dark:border-gray-800 py-6 flex flex-col items-center gap-1">
            <ProjectSightLogo />
          </div>
        </nav>
      </aside>
    </>
  );
}

// ─── Nav link helper ──────────────────────────────────────────────────────────

function NavLink({
  item,
  base,
  onClose,
}: {
  item: NavItem;
  base: string;
  onClose: () => void;
}) {
  const isAnchor = item.href === "#";
  const isAbsolute = item.href.startsWith("/mobile/");
  const resolvedHref = isAnchor ? "#" : isAbsolute ? item.href : `${base}${item.href}`;

  return (
    <Link
      href={resolvedHref}
      onClick={isAnchor ? (e) => e.preventDefault() : onClose}
      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
    >
      <span className="text-gray-400 dark:text-gray-500 flex-none">{item.icon}</span>
      <span className="flex-1">{item.label}</span>
      {item.external && (
        <ExternalLink size={13} className="text-gray-300 dark:text-gray-600 flex-none" />
      )}
    </Link>
  );
}

// ─── ProjectSight logo ────────────────────────────────────────────────────────

function ProjectSightLogo() {
  return (
    <img
      src="/images/projectsight-logo.png"
      alt="ProjectSight"
      className="h-6 w-auto opacity-80"
    />
  );
}
