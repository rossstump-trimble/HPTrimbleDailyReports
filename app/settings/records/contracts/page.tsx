import dynamic from "next/dynamic";

const PSSettingsContracts = dynamic(
  () => import("@/components/projectsight/PSSettingsContracts"),
  { ssr: false }
);

export default function SettingsContractsPage() {
  return (
    <div className="w-full h-full">
      <PSSettingsContracts />
    </div>
  );
}
