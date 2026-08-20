import RecordsScreen from "@/components/mobile/RecordsScreen";

interface RecordsPageProps {
  params: { id: string; type: string };
}

export default function RecordsPage({ params }: RecordsPageProps) {
  return <RecordsScreen projectId={params.id} recordType={params.type} />;
}
