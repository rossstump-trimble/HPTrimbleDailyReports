"use client";

import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const SpecificationsScreen = dynamic(
  () => import("@/components/mobile/SpecificationsScreen"),
  { ssr: false }
);

export default function SpecificationsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id ?? "";

  return (
    <SpecificationsScreen
      projectId={projectId}
      onBack={() => router.push(`/mobile/projects/${projectId}`)}
    />
  );
}
