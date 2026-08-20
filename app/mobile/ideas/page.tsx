"use client";

import { useRouter } from "next/navigation";
import IdeaPortalScreen from "@/components/mobile/IdeaPortalScreen";

export default function IdeasPage() {
  const router = useRouter();
  return <IdeaPortalScreen onBack={() => router.back()} />;
}
