"use client";

import { useTheme } from "next-themes";
import Image from "next/image";
import { useEffect, useState } from "react";

export function Logo() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and before mounting, return the light theme version
  if (!mounted) {
    return (
      <Image
        src="/trimbleconnect_header.svg"
        alt="Logo"
        width={40}
        height={20}
        priority
      />
    );
  }

  return (
    <Image
      src={
        resolvedTheme === "dark"
          ? "/trimbleconnect_header_dark.svg"
          : "/trimbleconnect_header.svg"
      }
      alt="Logo"
      width={40}
      height={20}
      priority
    />
  );
}
