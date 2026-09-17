import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { InspectionRecord } from '@/types/inspections';

interface InspectionStatusBadgeProps {
  status: InspectionRecord['status'];
  className?: string;
}

export function InspectionStatusBadge({ status, className }: InspectionStatusBadgeProps) {
  switch (status) {
    case 'approved':
      return (
        <Badge
          variant="outline"
          className={`bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 ${className || ''}`}
        >
          Approved
        </Badge>
      );
    case 'in_review':
      return (
        <Badge
          variant="outline"
          className={`bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 ${className || ''}`}
        >
          In Review
        </Badge>
      );
    case 'closed':
      return (
        <Badge
          variant="outline"
          className={`bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 ${className || ''}`}
        >
          Closed
        </Badge>
      );
    case 'open':
    default:
      return (
        <Badge
          variant="outline"
          className={`bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800 ${className || ''}`}
        >
          Open
        </Badge>
      );
  }
}
