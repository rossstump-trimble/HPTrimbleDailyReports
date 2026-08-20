import dynamic from "next/dynamic";

const ProjectSightDashboard = dynamic(
  () => import("@/components/projectsight/PSDashboard"),
  { ssr: false }
);

export default function DashboardPage() {
  return (
    <div className="w-full h-full">
      <ProjectSightDashboard />
    </div>
  );
}
