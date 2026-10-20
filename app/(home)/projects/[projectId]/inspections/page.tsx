"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  ClipboardCheck,
  Camera,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InspectionGrid } from "@/components/inspections/InspectionGrid";
import { InspectionDetailSheet } from "@/components/inspections/InspectionDetailSheet";
import { InspectionScanModal } from "@/components/inspections/InspectionScanModal";
import { InspectionVerifyDrawer } from "@/components/inspections/InspectionVerifyDrawer";
import type {
  InspectionExtractionResult,
  InspectionRecord,
} from "@/types/inspections";

export default function InspectionsPage() {
  const params = useParams<{ projectId: string }>();
  const searchParams = useSearchParams();
  const projectId = params.projectId;

  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modals & Drawers state
  const [selectedInspection, setSelectedInspection] = useState<InspectionRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [scanResult, setScanResult] = useState<InspectionExtractionResult | null>(null);
  const [scanPreviewUrl, setScanPreviewUrl] = useState<string | null>(null);
  const [scanPreviewUrls, setScanPreviewUrls] = useState<string[]>([]);
  const [scanTargetChecklistId, setScanTargetChecklistId] = useState<string | undefined>(undefined);

  const fetchInspections = useCallback(async () => {
    setLoading(true);
    try {
      const qs = searchParams.toString();
      const res = await fetch(`/api/inspections/${projectId}${qs ? `?${qs}` : ""}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.inspections)) {
        setInspections(data.inspections);
      }
    } catch (err) {
      console.error("Failed to load inspections:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId, searchParams]);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  const handleSyncProjectSight = async () => {
    setIsSyncing(true);
    try {
      const qs = searchParams.toString();
      const res = await fetch(`/api/inspections/${projectId}${qs ? `?${qs}` : ""}`, { method: "POST" });
      const data = await res.json();
      if (data.success && Array.isArray(data.inspections)) {
        setInspections(data.inspections);
      }
    } catch (err) {
      console.error("Failed to sync inspections:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleScanComplete = (
    result: InspectionExtractionResult,
    previewUrls: string[],
    targetChecklistId?: string,
  ) => {
    setScanResult(result);
    setScanPreviewUrls(previewUrls);
    setScanPreviewUrl(previewUrls[0] || null);
    setScanTargetChecklistId(targetChecklistId);
    setIsVerifyOpen(true);
  };

  const handleCardScan = (record: InspectionRecord) => {
    setScanTargetChecklistId(record.id);
    setIsScanModalOpen(true);
  };

  const handleHeaderScan = () => {
    setScanTargetChecklistId(undefined);
    setIsScanModalOpen(true);
  };

  const handleCommitSuccess = (committed: InspectionRecord) => {
    setInspections((prev) => {
      const idx = prev.findIndex((ins) => ins.id === committed.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = committed;
        return next;
      }
      return [committed, ...prev];
    });
  };

  const handleRowSelect = (record: InspectionRecord) => {
    setSelectedInspection(record);
    setIsDetailOpen(true);
  };

  // Filtered list
  const filtered = inspections.filter((ins) => {
    if (statusFilter !== "all" && ins.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const numMatch = ins.number.toLowerCase().includes(q);
      const titleMatch = ins.title.toLowerCase().includes(q);
      const locMatch = ins.location?.toLowerCase().includes(q) || false;
      return numMatch || titleMatch || locMatch;
    }
    return true;
  });

  return (
    <div className="flex-1 space-y-6 p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ClipboardCheck className="h-7 w-7 text-primary" />
            Checklists
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Digitize completed field inspection sheets, verify checkboxes and handwritten notes side-by-side, and push to ProjectSight.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncProjectSight}
            disabled={isSyncing}
            className="gap-2 min-h-[44px] sm:min-h-0"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            Sync ProjectSight
          </Button>

          <Button
            size="sm"
            onClick={handleHeaderScan}
            className="gap-2 min-h-[44px] sm:min-h-0 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm"
          >
            <Camera className="h-4 w-4" />
            Scan Inspection Sheet
          </Button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by checklist #, title, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px] bg-card">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Inspection Register Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading inspections...</p>
        </div>
      ) : (
        <InspectionGrid
          inspections={filtered}
          onSelectInspection={handleRowSelect}
          onScanChecklist={handleCardScan}
        />
      )}

      {/* Inspection Detail Sheet */}
      <InspectionDetailSheet
        inspection={selectedInspection}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />

      {/* Scan Modal */}
      <InspectionScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        projectId={projectId}
        inspections={inspections}
        initialChecklistId={scanTargetChecklistId}
        onScanComplete={handleScanComplete}
      />

      {/* Side-by-Side Verification Drawer */}
      <InspectionVerifyDrawer
        isOpen={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
        projectId={projectId}
        extraction={scanResult}
        previewUrl={scanPreviewUrl}
        previewUrls={scanPreviewUrls}
        targetInspectionId={scanTargetChecklistId}
        inspections={inspections}
        onCommitSuccess={handleCommitSuccess}
      />
    </div>
  );
}
