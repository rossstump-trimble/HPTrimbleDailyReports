"use client";

import { useRouter } from "next/navigation";
import HelpScreen from "@/components/mobile/HelpScreen";

export default function HelpPage() {
  const router = useRouter();
  return <HelpScreen onBack={() => router.back()} />;
}
