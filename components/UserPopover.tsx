"use client";

import React, { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, ChevronDown, User } from "lucide-react";

export function UserPopover() {
  const [currentUser, setCurrentUser] = useState({
    name: "Ross Stump",
    email: "ross_stump@trimble.com",
  });

  useEffect(() => {
    try {
      const match = document.cookie.match(/(?:^|; )ps_user=([^;]*)/);
      if (match) {
        const decoded = decodeURIComponent(match[1]);
        const parsed = JSON.parse(decoded);
        if (parsed && (parsed.name || parsed.email)) {
          setCurrentUser((prev) => ({
            ...prev,
            name: parsed.name || prev.name,
            email: parsed.email || prev.email,
          }));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSignOut = () => {
    window.location.href = "/api/auth/logout";
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full px-1 py-1 border-none bg-transparent cursor-pointer transition-colors hover:bg-muted"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-muted text-muted-foreground">
              <User className="h-4 w-4" aria-hidden />
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72 p-0">
        {/* User identity header */}
        <div className="flex flex-col items-center gap-2 px-4 py-5">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-muted text-muted-foreground">
              <User className="h-8 w-8" aria-hidden />
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <p className="text-sm font-semibold">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground">{currentUser.email}</p>
          </div>
        </div>

        <div className="p-1.5">
          <button
            type="button"
            onClick={handleSignOut}
            className="popover-menu-item destructive w-full"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
