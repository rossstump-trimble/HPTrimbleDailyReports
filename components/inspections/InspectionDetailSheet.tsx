"use client";

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { InspectionStatusBadge } from './InspectionStatusBadge';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, MinusCircle, HelpCircle } from 'lucide-react';
import type { InspectionItemResult, InspectionRecord } from '@/types/inspections';

interface InspectionDetailSheetProps {
  inspection: InspectionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenVerify?: (inspection: InspectionRecord) => void;
}

function ItemResultPill({ result }: { result: InspectionItemResult }) {
  switch (result) {
    case 'Pass':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" /> Pass
        </span>
      );
    case 'Fail':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
          <XCircle className="h-3.5 w-3.5" /> Fail
        </span>
      );
    case 'N/A':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <MinusCircle className="h-3.5 w-3.5" /> N/A
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-muted text-muted-foreground">
          <HelpCircle className="h-3.5 w-3.5" /> Unchecked
        </span>
      );
  }
}

export function InspectionDetailSheet({
  inspection,
  isOpen,
  onClose,
}: InspectionDetailSheetProps) {
  if (!inspection) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-lg w-full overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-sm font-semibold text-primary">
              {inspection.number}
            </span>
            <InspectionStatusBadge status={inspection.status} />
          </div>
          <SheetTitle className="text-xl font-bold">{inspection.title}</SheetTitle>
          <SheetDescription className="text-xs">
            {inspection.location ? `Location: ${inspection.location}` : 'No location specified'}
            {inspection.inspectorName ? ` • Inspector: ${inspection.inspectorName}` : ''}
          </SheetDescription>
        </SheetHeader>

        <div className="py-4 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Checklist Requirements ({inspection.items?.length || 0})
          </h4>
          <div className="space-y-3">
            {(inspection.items || []).map((item) => (
              <div
                key={item.id || item.itemNumber}
                className="p-3 rounded-lg border bg-card text-card-foreground shadow-xs space-y-1.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="text-xs font-semibold text-muted-foreground">
                    #{item.itemNumber}
                  </div>
                  <ItemResultPill result={item.result} />
                </div>
                <div className="text-sm font-medium">{item.prompt}</div>
                {item.comment && (
                  <div className="text-xs bg-muted/50 p-2 rounded text-muted-foreground border-l-2 border-primary/40">
                    <span className="font-semibold text-foreground">Note: </span>
                    {item.comment}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
