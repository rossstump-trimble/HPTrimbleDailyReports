import RecordsScreen from "./RecordsScreen";

interface PunchItemsScreenProps {
  projectId: string;
}

export default function PunchItemsScreen({ projectId }: PunchItemsScreenProps) {
  return <RecordsScreen projectId={projectId} recordType="punch-items" />;
}
