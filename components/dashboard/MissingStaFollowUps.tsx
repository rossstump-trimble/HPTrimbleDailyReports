"use client";

import React from "react";
import { AlertTriangle, Mail, ShieldAlert } from "lucide-react";
import type { DailyReport } from "@/types/hpproto";

interface MissingStaFollowUpsProps {
  reports: DailyReport[];
  month: string;
}

export function MissingStaFollowUps({ reports, month }: MissingStaFollowUpsProps) {
  const missingStas = (reports || []).filter((r) => {
    if (!r.date || !r.date.startsWith(month)) return false;
    const hasSta = r.staCompleted === true || Boolean(r.staFiles && r.staFiles.length > 0);
    return !hasSta;
  });

  if (missingStas.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
          <ShieldAlert className="h-5 w-5" />
          <h3 className="font-semibold text-sm">Missing STA Follow-Ups ({missingStas.length})</h3>
        </div>
        <span className="text-xs text-amber-700/80 dark:text-amber-400 font-medium">
          Requires Safety Form
        </span>
      </div>

      <div className="divide-y divide-amber-200/60 dark:divide-amber-900/40">
        {missingStas.map((r) => {
          const reporter = r.submittedBy || "Field Submitter";
          const email = r.emailRecipients?.[0];
          return (
            <div key={r.id} className="py-2.5 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-200">{r.tradePartnerName}</p>
                <p className="text-gray-500 dark:text-gray-400">
                  {r.date} · Reporter: <span className="font-medium text-gray-700 dark:text-gray-300">{reporter}</span>
                </p>
              </div>

              {email ? (
                <a
                  href={`mailto:${email}?subject=Missing%20STA%20Form%20-%20${encodeURIComponent(r.tradePartnerName)}%20(${r.date})&body=Hi%20${encodeURIComponent(reporter)},%0A%0APlease%20provide%20the%20signed%20STA%20safety%20form%20for%20${r.date}.%0A%0AThank%20you.`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium transition"
                >
                  <Mail size={12} />
                  <span>Contact</span>
                </a>
              ) : (
                <span className="text-muted-foreground italic text-[11px]">No email on file</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
