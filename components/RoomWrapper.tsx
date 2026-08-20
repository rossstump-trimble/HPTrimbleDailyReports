"use client";

import { ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react";
import { useUIConfig } from "@/hooks/useUIConfig";

export function RoomWrapper({ children }: { children: ReactNode }) {
  const { config, isLoaded } = useUIConfig();

  // If live collaboration is not enabled, just render children
  if (!isLoaded || !config.showLiveCollaboration) {
    return <>{children}</>;
  }

  return (
    <LiveblocksProvider publicApiKey="pk_prod_TM51cczoKsYnowqT4povUciC6JGB6qkHOGmtP0AlFLuYqbTeXopeR3ahRpsSENzb">
      <RoomProvider id="my-room" initialPresence={{}}>
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
