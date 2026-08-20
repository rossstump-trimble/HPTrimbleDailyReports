import { LucideIcon } from "lucide-react";
import {
  Home,
  PencilRuler,
  FileText,
  Aperture,
  MapPinned,
  FileBox,
  DollarSign,
  Folder,
  Box,
  FileImage,
  ScrollText,
  Calendar,
  CheckSquare,
  AlertTriangle,
  ClipboardList,
  Hammer,
  Users,
  AlertOctagon,
  ShieldAlert,
  PackageCheck,
  Send,
  Wallet,
  ShoppingCart,
  FileOutput,
  Users2,
  Receipt,
  FileSpreadsheet,
  Calculator,
  FileCheck,
  FileCog,
  Files,
  FolderOpen,
  TrendingUp,
  LayoutGrid,
  TableProperties,
  QrCode,
} from "lucide-react";
import { SiAutodesk } from "react-icons/si";
import { FaMicrosoft } from "react-icons/fa";
import { FaGoogle } from "react-icons/fa";
import { IconType } from "react-icons";
import { FaGoogleDrive } from "react-icons/fa";
import { BsMicrosoftTeams } from "react-icons/bs";

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

export const navigationData: MenuItem[] = [
  {
    id: "projects",
    name: "Projects",
    icon: LayoutGrid,
    path: "/projects",
    order: 5,
  },
  {
    id: "bowling-sheet",
    name: "Bowling Sheet",
    icon: TableProperties,
    path: "/projects/cys07/bowling",
    order: 7,
  },
  {
    id: "trade-qr-intake",
    name: "Trade QR Intake",
    icon: QrCode,
    path: "/intake/cys07",
    order: 8,
  },
  {
    id: "home",
    name: "Home",
    icon: Home,
    path: "/dashboard",
    order: 10,
  },
  {
    id: "drawings",
    name: "Drawings",
    icon: PencilRuler,
    path: "/drawings",
    order: 20,
  },
  {
    id: "documents",
    name: "Documents",
    icon: Files,
    path: "/trimble-connect",
    order: 25,
  },
  {
    id: "specifications",
    name: "Specifications",
    icon: FileText,
    path: "#",
    order: 30,
  },
  {
    id: "schedule",
    name: "Schedule",
    icon: Calendar,
    path: "/schedule",
    order: 35,
  },
  {
    id: "photos",
    name: "Photos",
    icon: Aperture,
    path: "/photos",
    order: 40,
  },
  {
    id: "field-management",
    name: "Field Management",
    icon: MapPinned,
    path: "/field-data",
    order: 50,
  },
  {
    id: "progress-tracking",
    name: "Progress Tracking",
    icon: TrendingUp,
    path: "/progress-tracking",
    order: 55,
  },
  {
    id: "records",
    name: "Records",
    icon: FileBox,
    path: "#",
    hasSubmenu: true,
    order: 60,
    subItems: [
      {
        id: "drawing-sets",
        name: "Drawing Sets",
        icon: FileImage,
        path: "#",
        order: 10,
      },
      {
        id: "rfis",
        name: "RFIs",
        icon: ScrollText,
        path: "/rfis",
        order: 20,
      },
      {
        id: "submittals",
        name: "Submittals",
        icon: FileText,
        path: "#",
        order: 30,
      },
      {
        id: "daily-reports",
        name: "Daily Reports",
        icon: Calendar,
        path: "#",
        order: 40,
      },
      {
        id: "punch-items",
        name: "Punch Items",
        icon: CheckSquare,
        path: "#",
        order: 50,
      },
      {
        id: "action-items",
        name: "Action Items",
        icon: AlertTriangle,
        path: "#",
        order: 60,
      },
      {
        id: "checklists",
        name: "Checklists",
        icon: ClipboardList,
        path: "#",
        order: 70,
      },
      {
        id: "field-work-directives",
        name: "Field Work Directives",
        icon: Hammer,
        path: "#",
        order: 80,
      },
      {
        id: "issues",
        name: "Issues",
        icon: AlertOctagon,
        path: "#",
        order: 90,
      },
      {
        id: "meeting-minutes",
        name: "Meeting Minutes",
        icon: Users,
        path: "#",
        order: 100,
      },
      {
        id: "notices-to-comply",
        name: "Notices to Comply",
        icon: ShieldAlert,
        path: "#",
        order: 110,
      },
      {
        id: "safety-notices",
        name: "Safety Notices",
        icon: AlertOctagon,
        path: "#",
        order: 120,
      },
      {
        id: "specification-sets",
        name: "Specification Sets",
        icon: FileText,
        path: "#",
        order: 130,
      },
      {
        id: "submittal-packages",
        name: "Submittal Packages",
        icon: PackageCheck,
        path: "#",
        order: 140,
      },
      {
        id: "transmittals",
        name: "Transmittals",
        icon: Send,
        path: "#",
        order: 150,
      },
    ],
  },
  {
    id: "financials",
    name: "Financials",
    icon: DollarSign,
    path: "#",
    hasSubmenu: true,
    order: 70,
    subItems: [
      {
        id: "budget",
        name: "Budget",
        icon: Wallet,
        path: "#",
        order: 10,
      },
      {
        id: "contracts",
        name: "Contracts",
        icon: ScrollText,
        path: "#",
        order: 20,
      },
      {
        id: "purchase-orders",
        name: "Purchase Orders",
        icon: ShoppingCart,
        path: "#",
        order: 30,
      },
      {
        id: "potential-change-orders",
        name: "Potential Change Orders",
        icon: FileOutput,
        path: "/potential-change-orders",
        order: 40,
      },
      {
        id: "subcontract-change-orders",
        name: "Subcontract Change Orders",
        icon: Users2,
        path: "#",
        order: 50,
      },
      {
        id: "applications-for-payment",
        name: "Applications For Payment",
        icon: Receipt,
        path: "#",
        order: 60,
      },
      {
        id: "change-order-requests",
        name: "Change Order Requests",
        icon: FileSpreadsheet,
        path: "#",
        order: 70,
      },
      {
        id: "contract-invoices",
        name: "Contract Invoices",
        icon: FileCheck,
        path: "#",
        order: 80,
      },
      {
        id: "cost-forecasts",
        name: "Cost Forecasts",
        icon: Calculator,
        path: "#",
        order: 90,
      },
      {
        id: "general-invoices",
        name: "General Invoices",
        icon: Receipt,
        path: "#",
        order: 100,
      },
      {
        id: "prime-contract-change-orders",
        name: "Prime Contract Change Orders",
        icon: FileCog,
        path: "#",
        order: 110,
      },
    ],
  },
  {
    id: "files",
    name: "Files",
    icon: Folder,
    path: "#",
    hasSubmenu: true,
    order: 90,
    subItems: [
      {
        id: "library",
        name: "Library",
        icon: FolderOpen,
        path: "#",
        order: 10,
      },
      {
        id: "models",
        name: "Models",
        icon: Box,
        path: "/3dviewer",
        target: "_blank",
        order: 20,
      },
    ],
  },
];

// Helper function to get sorted navigation data based on order property
export function getSortedNavigationData(
  data: MenuItem[] = navigationData
): MenuItem[] {
  // Create a deep copy to avoid modifying the original
  const sortedData = [...data].sort((a, b) => a.order - b.order);

  // Sort subItems if they exist
  return sortedData.map((item) => {
    if (item.subItems && item.subItems.length > 0) {
      return {
        ...item,
        subItems: [...item.subItems].sort((a, b) => a.order - b.order),
      };
    }
    return item;
  });
}

// Helper function to get navigation based on UI config
export function getNavigationByConfig(
  showUpdatedNavigation: boolean,
  showIntegrations: boolean = false
): MenuItem[] {
  const sorted = getSortedNavigationData();

  if (showIntegrations) {
    // If integrations is enabled, filter out both Files and Documents
    return sorted.filter(
      (item) => item.id !== "files" && item.id !== "documents"
    );
  } else if (showUpdatedNavigation) {
    // Keep "Documents" but remove "Files"
    return sorted.filter(
      (item) => item.id !== "files" && item.id !== "integrations"
    );
  } else {
    // Keep "Files" but remove "Documents" and "Integrations"
    return sorted.filter(
      (item) => item.id !== "documents" && item.id !== "integrations"
    );
  }
}
