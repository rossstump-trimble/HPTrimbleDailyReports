"use client";

import { useParams, useRouter } from "next/navigation";
import TeamMembersScreen from "@/components/mobile/TeamMembersScreen";

export default function TeamPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id ?? "";

  return (
    <TeamMembersScreen
      projectId={projectId}
      onBack={() => router.push(`/mobile/projects/${projectId}`)}
    />
  );
}
