"use client";

import { useRouter } from "next/navigation";
import SettingsScreen from "@/components/mobile/SettingsScreen";

export default function SettingsPage() {
  const router = useRouter();
  return <SettingsScreen onBack={() => router.back()} />;
}
