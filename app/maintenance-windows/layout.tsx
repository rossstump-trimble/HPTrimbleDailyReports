import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maintenance Windows | ProjectSight",
  description:
    "View current and upcoming scheduled maintenance windows for ProjectSight.",
};

export default function MaintenanceWindowsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
