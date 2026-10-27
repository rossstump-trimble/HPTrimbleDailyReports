import { LucideIcon } from "lucide-react";
import {
  Building2,
  ClipboardCheck,
  LayoutDashboard,
  ListTodo,
  QrCode,
  ShieldCheck,
  Sparkles,
  TableProperties,
} from "lucide-react";
import { IconType } from "react-icons";

export interface MenuItem {
  id: string;
  name: string;
  icon?: LucideIcon;
  icon2?: React.ReactNode | IconType;
  path: string;
  order: number;
  hasSubmenu?: boolean;
  target?: string;
  subItems?: MenuItem[];
}

export function getNavigationItemsForProject(projectId: string = "1025"): MenuItem[] {
  return [
    {
      id: "projects",
      name: "Projects",
      icon: Building2,
      path: "/projects",
      order: 10,
    },
    {
      id: "dashboard",
      name: "Dashboard",
      icon: LayoutDashboard,
      path: `/projects/${projectId}/dashboard`,
      order: 15,
    },
    {
      id: "companies",
      name: "Companies",
      icon: Building2,
      path: `/projects/${projectId}/companies`,
      order: 18,
    },
    {
      id: "bowling-sheet",
      name: "Bowling Sheet",
      icon: TableProperties,
      path: `/projects/${projectId}/bowling`,
      order: 20,
    },
    {
      id: "superdaily",
      name: "Superdaily",
      icon: Sparkles,
      path: `/projects/${projectId}/superdaily`,
      order: 21,
    },
    {
      id: "review-queue",
      name: "Review & Approvals",
      icon: ClipboardCheck,
      path: `/projects/${projectId}/review`,
      order: 22,
    },
    {
      id: "punch-list",
      name: "Punch List",
      icon: ListTodo,
      path: `/projects/${projectId}/punch-list`,
      order: 23,
    },
    {
      id: "inspections",
      name: "Checklist",
      icon: ClipboardCheck,
      path: `/projects/${projectId}/inspections`,
      order: 24,
    },
    {
      id: "daily-report",
      name: "Daily Intake",
      icon: QrCode,
      path: `/intake/${projectId}`,
      order: 25,
    },
    {
      id: "admin",
      name: "Admin Controls",
      icon: ShieldCheck,
      path: "/admin",
      order: 30,
    },
  ];
}

export const navigationData: MenuItem[] = getNavigationItemsForProject("1025");

export function getSortedNavigationData(
  projectId: string = "1025"
): MenuItem[] {
  const items = getNavigationItemsForProject(projectId);
  return items.sort((a, b) => a.order - b.order);
}
