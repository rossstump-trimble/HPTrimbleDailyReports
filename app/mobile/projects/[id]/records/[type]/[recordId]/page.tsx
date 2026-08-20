import RecordFormScreen from "@/components/mobile/RecordFormScreen";
import ChecklistFormScreen from "@/components/mobile/ChecklistFormScreen";
import DailyReportFormScreen from "@/components/mobile/DailyReportFormScreen";
import SubmittalPackageFormScreen from "@/components/mobile/SubmittalPackageFormScreen";
import SubmittalFormScreen from "@/components/mobile/SubmittalFormScreen";

interface RecordFormPageProps {
  params: { id: string; type: string; recordId: string };
}

export default function RecordFormPage({ params }: RecordFormPageProps) {
  if (params.type === "checklists") {
    return (
      <ChecklistFormScreen
        projectId={params.id}
        recordId={params.recordId}
      />
    );
  }
  if (params.type === "daily-reports") {
    return (
      <DailyReportFormScreen
        projectId={params.id}
        recordId={params.recordId}
      />
    );
  }
  if (params.type === "submittal-packages") {
    return (
      <SubmittalPackageFormScreen
        projectId={params.id}
        recordId={params.recordId}
      />
    );
  }
  if (params.type === "submittals") {
    return (
      <SubmittalFormScreen
        projectId={params.id}
        recordId={params.recordId}
      />
    );
  }
  return (
    <RecordFormScreen
      projectId={params.id}
      recordType={params.type}
      recordId={params.recordId}
    />
  );
}
