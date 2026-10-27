"use client";

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { InspectionStatusBadge } from './InspectionStatusBadge';
import { ClipboardCheck, CheckCircle2, AlertTriangle, Camera } from 'lucide-react';
import type { InspectionRecord } from '@/types/inspections';

interface InspectionGridProps {
  inspections: InspectionRecord[];
  onSelectInspection: (inspection: InspectionRecord) => void;
  onScanChecklist?: (inspection: InspectionRecord) => void;
  selectedId?: string;
}

export function InspectionGrid({
  inspections,
  onSelectInspection,
  onScanChecklist,
  selectedId,
}: InspectionGridProps) {
  const [page, setPage] = React.useState(1);
  const PAGE_SIZE = 25;

  if (inspections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-card">
        <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground">No Checklists Yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm mt-1">
          Scan a completed paper checklist sheet or sync with ProjectSight to populate checklist records.
        </p>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(inspections.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedInspections = inspections.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  return (
    <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-[120px] font-semibold">Record #</TableHead>
            <TableHead className="font-semibold">Title</TableHead>
            <TableHead className="font-semibold">Location</TableHead>
            <TableHead className="w-[160px] font-semibold">Checklist Items</TableHead>
            <TableHead className="w-[120px] font-semibold">Status</TableHead>
            <TableHead className="w-[110px] font-semibold text-right">Updated</TableHead>
            <TableHead className="w-[140px] font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedInspections.map((record) => {
            const isSelected = record.id === selectedId;
            const items = record.items || [];
            const passed = items.filter((it) => it.result === 'Pass').length;
            const failed = items.filter((it) => it.result === 'Fail').length;
            const total = items.length;

            return (
              <TableRow
                key={record.id}
                onClick={() => onSelectInspection(record)}
                className={`cursor-pointer transition-colors ${
                  isSelected ? 'bg-primary/10 font-medium' : 'hover:bg-muted/50'
                }`}
              >
                <TableCell className="font-mono font-semibold text-primary">
                  {record.number}
                </TableCell>
                <TableCell>
                  <div className="font-medium text-foreground">{record.title}</div>
                  {record.inspectorName && (
                    <div className="text-xs text-muted-foreground">Inspector: {record.inspectorName}</div>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {record.location || '—'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-medium">
                      {passed}/{total} Passed
                    </span>
                    {failed > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-semibold">
                        <AlertTriangle className="h-3 w-3" /> {failed} Fail
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <InspectionStatusBadge status={record.status} />
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {record.updatedAt ? new Date(record.updatedAt).toLocaleDateString() : '—'}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  {onScanChecklist && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs font-medium border-primary/30 hover:bg-primary/10 text-primary"
                      onClick={() => onScanChecklist(record)}
                    >
                      <Camera className="h-3.5 w-3.5" />
                      Scan Sheet(s)
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {totalPages > 1 && (
        <div className="border-t border-border bg-muted/20 px-4 py-2.5 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page <strong className="text-foreground">{safePage}</strong> of{" "}
            <strong className="text-foreground">{totalPages}</strong> ({inspections.length} checklists)
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-7 px-2 text-xs"
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 px-2 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
