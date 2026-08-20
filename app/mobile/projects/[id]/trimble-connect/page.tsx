"use client";

import { useParams, useRouter } from "next/navigation";
import TrimbleConnectScreen from "@/components/mobile/TrimbleConnectScreen";

export default function TrimbleConnectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id ?? "";

  return (
    <TrimbleConnectScreen
      projectId={projectId}
      onBack={() => router.push(`/mobile/projects/${projectId}`)}
    />
  );
}
