import { redirect } from "next/navigation";

interface PunchItemsPageProps {
  params: { id: string };
}

export default function PunchItemsPage({ params }: PunchItemsPageProps) {
  redirect(`/mobile/projects/${params.id}/records/punch-items`);
}
