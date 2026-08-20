import ProjectHomeScreen from "@/components/mobile/ProjectHomeScreen";

interface ProjectHomePageProps {
  params: { id: string };
}

export default function ProjectHomePage({ params }: ProjectHomePageProps) {
  return <ProjectHomeScreen projectId={params.id} />;
}
