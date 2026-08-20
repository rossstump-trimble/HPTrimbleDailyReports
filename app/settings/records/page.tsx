import dynamic from "next/dynamic";

const PSSettingsRecords = dynamic(
  () => import("@/components/projectsight/PSSettingsRecords"),
  { ssr: false }
);

export default function SettingsRecordsPage() {
  return (
    <div className="w-full h-full">
      <PSSettingsRecords />
    </div>
  );
}
