import { LucideIcon } from "lucide-react";
import { ClipboardList, LayoutGrid, TableProperties, QrCode } from "lucide-react";
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

export const navigationData: MenuItem[] = [
  {
    id: "projects",
    name: "Projects",
    icon: LayoutGrid,
    path: "/projects",
    order: 10,
  },
  {
    id: "bowling-sheet",
    name: "Bowling Sheet",
    icon: TableProperties,
    path: "/projects/cys07/bowling",
    order: 20,
  },
  {
    id: "daily-report",
    name: "Daily Report",
    icon: ClipboardList,
    path: "/daily",
    order: 25,
  },
  {
    id: "trade-qr-intake",
    name: "Trade QR Intake",
    icon: QrCode,
    path: "/intake/cys07",
    order: 30,
  },
];

export function getSortedNavigationData(
  data: MenuItem[] = navigationData
): MenuItem[] {
  const sortedData = [...data].sort((a, b) => a.order - b.order);

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
