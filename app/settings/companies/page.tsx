import dynamic from "next/dynamic";

const PSSettingsCompanies = dynamic(
  () => import("@/components/projectsight/PSSettingsCompanies"),
  { ssr: false }
);

export default function SettingsCompaniesPage() {
  return (
    <div className="w-full h-full">
      <PSSettingsCompanies />
    </div>
  );
}
