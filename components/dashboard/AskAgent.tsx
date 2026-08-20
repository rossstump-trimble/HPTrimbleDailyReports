"use client";

import React, { useRef, useState } from "react";
import { Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { AskResult } from "@/lib/dashboard/types";

const STARTERS = [
  "Who didn't turn in a daily today?",
  "Is Berg Electric on site today?",
  "When did CB Floors last check in?",
  "Which reports are waiting on HP to log?",
  "Which days this month had the most missing reports?",
];

interface Message {
  id: string;
  role: "user" | "agent";
  text: string;
  bullets?: string[];
  followUps?: string[];
}

export function AskAgent({
  open,
  onOpenChange,
  projectId,
  month,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  month: string;
}) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "hello",
      role: "agent",
      text: "Ask about today's missing dailies, whether a trade is on site, last check-in, or HP logging backlog.",
      followUps: STARTERS.slice(0, 3),
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    setInput("");
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text: q }]);
    setBusy(true);
    try {
      const res = await fetch(`/api/dashboard/${projectId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, month }),
      });
      const json = (await res.json()) as AskResult & { success?: boolean; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Ask failed");
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "agent",
          text: json.answer,
          bullets: json.bullets,
          followUps: json.suggestedFollowUps,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "agent",
          text: err instanceof Error ? err.message : "Something went wrong.",
        },
      ]);
    } finally {
      setBusy(false);
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col sm:max-w-md p-0 gap-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border text-left">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-sky-600" />
            Ask the dashboard
          </SheetTitle>
          <SheetDescription>
            Answers come from this month's bowling data — not a live Project Sight call.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-sky-600 text-white rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md",
                )}
              >
                <p>{m.text}</p>
                {m.bullets && m.bullets.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-[13px]">
                    {m.bullets.map((b) => (
                      <li key={b} className="pl-3 relative before:content-['·'] before:absolute before:left-0">
                        {b}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {m.followUps && m.followUps.length > 0 ? (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {m.followUps.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => ask(f)}
                        className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-foreground hover:bg-accent"
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
          {busy ? (
            <div className="text-xs text-muted-foreground px-1">Looking at the grid…</div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <form
          className="border-t border-border p-3 flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void ask(input);
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void ask(input);
              }
            }}
            rows={2}
            placeholder="Ask about a trade, today, or this month…"
            className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button type="submit" size="sm" disabled={busy || !input.trim()} className="h-9">
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
