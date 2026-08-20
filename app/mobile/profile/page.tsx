"use client";

import { useRouter } from "next/navigation";
import MyProfileScreen from "@/components/mobile/MyProfileScreen";

export default function ProfilePage() {
  const router = useRouter();
  return <MyProfileScreen onBack={() => router.back()} />;
}
