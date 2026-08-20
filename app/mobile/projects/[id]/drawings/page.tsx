import DrawingsScreen from "@/components/mobile/DrawingsScreen";

interface DrawingsPageProps {
  params: { id: string };
}

export default function DrawingsPage({ params }: DrawingsPageProps) {
  return <DrawingsScreen projectId={params.id} />;
}
