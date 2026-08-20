import dynamic from "next/dynamic";

const ScheduleModule = dynamic(
  () => import("@/components/schedule/ScheduleNewModule"),
  { ssr: false }
);

export default function SchedulePage() {
  return (
    <div className="w-full h-full">
      <ScheduleModule />
    </div>
  );
}
