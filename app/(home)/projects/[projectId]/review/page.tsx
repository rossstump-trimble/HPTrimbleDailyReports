"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  ExternalLink,
  FileText,
  Filter,
  Handshake,
  Loader2,
  Paperclip,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DailyReport, ProjectCompany, CompanyContact } from "@/types/hpproto";
import { AddContactModal } from "@/components/review/AddContactModal";

interface ReviewResponse {
  projectId: string;
  projectName: string;
  reports: DailyReport[];
  counts: {
    total: number;
    pending: number;
    approved: number;
    synced: number;
  };
}

export default function ReviewQueuePage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const projectId = params.projectId;

  const [data, setData] = useState<ReviewResponse | null>(null);
  const [companies, setCompanies] = useState<ProjectCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<"pending" | "approved" | "all">("pending");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Add Contact Modal State
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [pendingReportForContact, setPendingReportForContact] = useState<DailyReport | null>(null);
  const [pendingCompanyForContact, setPendingCompanyForContact] = useState<ProjectCompany | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setActionError(null);
    try {
      const [reportsRes, compRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/dailyreports`),
        fetch(`/api/projects/${projectId}/companies`),
      ]);

      if (!reportsRes.ok) throw new Error("Failed to load review queue");
      const json = (await reportsRes.json()) as ReviewResponse;
      setData(json);

      if (compRes.ok) {
        const compJson = await compRes.json();
        if (compJson.success && Array.isArray(compJson.companies)) {
          setCompanies(compJson.companies);
        }
      }
    } catch (err) {
      console.error("[review queue]", err);
      setActionError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const getMatchingCompanyAndVerification = (report: DailyReport) => {
    const comp = companies.find(
      (c) =>
        c.id.toLowerCase() === (report.tradePartnerId || "").toLowerCase() ||
        c.name.toLowerCase() === (report.tradePartnerName || "").toLowerCase(),
    );
    if (!comp) return { company: null, isVerified: false };

    const rawSub = (report.submittedBy || "").trim().toLowerCase();
    if (!rawSub) return { company: comp, isVerified: false };

    const isVerified = comp.contacts.some((ct) => {
      const disp = (ct.displayName || "").trim().toLowerCase();
      const full = `${ct.firstName} ${ct.lastName}`.trim().toLowerCase();
      return (
        (disp && (disp === rawSub || rawSub.includes(disp) || disp.includes(rawSub))) ||
        (full && (full === rawSub || rawSub.includes(full) || full.includes(rawSub)))
      );
    });

    return { company: comp, isVerified };
  };

  const handleApprove = async (report: DailyReport) => {
    // Contact verification gate: prompt to add to PS before sending
    if (!report.projectSightDailyId) {
      const { company, isVerified } = getMatchingCompanyAndVerification(report);
      if (company && !isVerified) {
        setPendingReportForContact(report);
        setPendingCompanyForContact(company);
        setContactModalOpen(true);
        return;
      }
    }

    setApprovingId(report.id);
    setActionError(null);
    try {
      const res = await fetch(`/api/dailyreports/${report.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Approval failed");
      await fetchReports();
      if (editModalOpen) setEditModalOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setApprovingId(null);
    }
  };

  const handleOpenEdit = (report: DailyReport) => {
    setSelectedReport({ ...report });
    setEditModalOpen(true);
  };

  const handleSaveEditAndApprove = async () => {
    if (!selectedReport) return;
    setApprovingId(selectedReport.id);
    try {
      // 1. Update local daily report
      await fetch("/api/intake/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedReport),
      });
      // 2. Approve and dispatch to ProjectSight
      const res = await fetch(`/api/dailyreports/${selectedReport.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Approval failed");
      setEditModalOpen(false);
      await fetchReports();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Save and approve failed");
    } finally {
      setApprovingId(null);
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (reportId: string) => {
    if (!confirm("Are you sure you want to remove this daily report from the review queue?")) return;
    setDeletingId(reportId);
    setActionError(null);
    try {
      const res = await fetch(`/api/dailyreports/${reportId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Delete failed");
      await fetchReports();
      if (editModalOpen) setEditModalOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const reports = data?.reports || [];
  const filteredReports = reports.filter((r) => {
    if (filterTab === "pending") return !r.approvalStatus || r.approvalStatus === "pending";
    if (filterTab === "approved") return r.approvalStatus === "approved";
    return true;
  });

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Top Header Bar */}
      <div className="flex-none px-6 py-4 border-b border-border bg-background flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/projects")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ChevronLeft className="h-4 w-4" />
            Projects
          </button>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-foreground">Review &amp; Approvals</h1>
            <Badge variant="outline" className="font-mono text-xs">
              {projectId.toUpperCase()}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReports}
            disabled={loading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => router.push(`/projects/${projectId}/bowling`)}
            variant="outline"
            className="gap-1.5 text-xs"
          >
            Bowling Sheet
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
        {/* Banner */}
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-blue-900 dark:text-blue-200">
              Superintendent Review Queue
            </p>
            <p className="text-blue-800 dark:text-blue-300">
              Trade partners submit daily reports from the field via QR intake. Review details, adjust labor or notes if necessary, and approve to create live ProjectSight Daily Reports.
            </p>
          </div>
        </div>

        {actionError && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Pending Review</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {data?.counts.pending ?? 0}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Clock className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Approved &amp; Synced</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {data?.counts.synced ?? 0}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Received</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {data?.counts.total ?? 0}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                <FileText className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
          <Tabs
            value={filterTab}
            onValueChange={(val) => setFilterTab(val as "pending" | "approved" | "all")}
          >
            <TabsList className="bg-muted/60 p-1 rounded-xl">
              <TabsTrigger value="pending" className="text-xs gap-1.5 rounded-lg">
                Pending Review
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] ml-1">
                  {data?.counts.pending ?? 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="approved" className="text-xs gap-1.5 rounded-lg">
                Approved &amp; Synced
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] ml-1">
                  {data?.counts.approved ?? 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs rounded-lg">
                All Reports ({data?.counts.total ?? 0})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading review queue…
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border rounded-2xl border-dashed border-border p-8">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
              <Check className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {filterTab === "pending"
                ? "No pending reports to review"
                : "No reports found in this view"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Trade daily reports submitted through QR intake or voice interview will appear here for superintendent review.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => {
              const isApproved = report.approvalStatus === "approved" || Boolean(report.projectSightDailyId);
              const isApproving = approvingId === report.id;
              const { company, isVerified } = getMatchingCompanyAndVerification(report);

              return (
                <Card key={report.id} className="border-border shadow-sm hover:border-border/80 transition">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-foreground">
                            {report.tradePartnerName || "Unassigned Trade"}
                          </h3>
                          <Badge variant="outline" className="text-xs font-mono">
                            {report.date}
                          </Badge>
                          {report.projectSightDailyId ? (
                            <Badge className="bg-emerald-600 text-white text-[11px] gap-1">
                              <CheckCircle2 className="h-3 w-3" /> PS #{report.projectSightDailyId}
                            </Badge>
                          ) : isApproved ? (
                            <Badge className="bg-blue-600 text-white text-[11px] gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Approved Locally
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-300 dark:text-amber-400 text-[11px] gap-1">
                              <Clock className="h-3 w-3" /> Pending Superintendent Review
                            </Badge>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                          <span>Submitted: {new Date(report.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1.5">
                            By: <strong className="text-foreground">{report.submittedBy || "Field Foreman"}</strong>
                            {report.isHpEmployee && (
                              <Badge className="bg-[#0063a3] text-white hover:bg-[#0063a3] text-[10px] py-0 h-4 font-bold">
                                HP Staff
                              </Badge>
                            )}
                            {isVerified ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] gap-1 py-0 h-4 font-normal">
                                <UserCheck className="w-2.5 h-2.5" /> PS Contact Verified
                              </Badge>
                            ) : !report.projectSightDailyId ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setPendingReportForContact(report);
                                  setPendingCompanyForContact(company);
                                  setContactModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded hover:bg-amber-100 transition cursor-pointer"
                                title="Click to add as registered contact"
                              >
                                <AlertCircle className="w-2.5 h-2.5 text-amber-600" /> Missing from PS Contacts
                              </button>
                            ) : null}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 self-end sm:self-start">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleOpenEdit(report)}
                        >
                          Review &amp; Edit
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                          disabled={deletingId === report.id}
                          onClick={() => handleDelete(report.id)}
                          aria-label="Delete report"
                        >
                          {deletingId === report.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>

                        {!report.projectSightDailyId && (
                          <Button
                            size="sm"
                            className="h-8 text-xs gap-1.5 font-semibold"
                            disabled={isApproving}
                            onClick={() => handleApprove(report)}
                          >
                            {isApproving ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Approving…
                              </>
                            ) : (
                              <>
                                <Send className="h-3.5 w-3.5" />
                                Approve &amp; Send to PS
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Report Summary Data Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/40 p-3.5 rounded-xl text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                          Headcount
                        </span>
                        <span className="font-bold text-foreground text-sm">
                          {report.workerCount} workers
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                          Hours per person
                        </span>
                        <span className="font-bold text-foreground text-sm">
                          {report.workerCount > 0 && report.totalHours > 0
                            ? `${Math.round((report.totalHours / report.workerCount) * 10) / 10} hrs/person`
                            : `${report.totalHours} hrs`}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                          STA Completed
                        </span>
                        <span className={`font-semibold ${report.staCompleted ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                          {report.staCompleted ? "Yes" : "No"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                          Source File{report.rawSourceFiles && report.rawSourceFiles.length > 1 ? "s" : ""}
                        </span>
                        <span className="text-foreground truncate block">
                          {report.rawSourceFiles && report.rawSourceFiles.length > 0 ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[11px]" title={report.rawSourceFiles.map((f) => f.fileName).join(", ")}>
                              <Paperclip className="h-3 w-3" /> {report.rawSourceFiles.length} {report.rawSourceFiles.length === 1 ? "file" : "files"} ({report.rawSourceFiles.map((f) => f.fileName).join(", ")})
                            </span>
                          ) : report.rawSourceFileName ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                              <Paperclip className="h-3 w-3" /> {report.rawSourceFileName}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Voice / Form Entry</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Location & Work Performed */}
                    {report.locationDescription && (
                      <div className="text-xs space-y-1">
                        <span className="font-semibold text-foreground">Location &amp; Work Performed:</span>
                        <p className="text-muted-foreground whitespace-pre-line bg-background p-2.5 rounded-lg border border-border">
                          {report.locationDescription}
                        </p>
                      </div>
                    )}

                    {/* Tier Subcontractors */}
                    {((report.tierSubcontractors && report.tierSubcontractors.length > 0) || (report.tierSubsSummary && report.tierSubsSummary.toLowerCase() !== "none")) && (
                      <div className="text-xs space-y-1">
                        <span className="font-semibold text-foreground">Tier Subcontractors on Site:</span>
                        <div className="bg-background p-2.5 rounded-lg border border-border flex flex-wrap gap-2 items-center">
                          {report.tierSubcontractors && report.tierSubcontractors.length > 0 ? (
                            report.tierSubcontractors.map((sub, i) => (
                              <Badge key={i} variant="outline" className="text-[11px] gap-1 py-0.5">
                                <Users className="h-3 w-3 text-muted-foreground" />
                                <span className="font-semibold">{sub.name}:</span> {sub.count} workers
                                {sub.trade ? ` (${sub.trade})` : ""}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">{report.tierSubsSummary}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Trades & Favors */}
                    {report.tradesAndFavors && (
                      <div className="text-xs space-y-1">
                        <span className="font-semibold text-foreground flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                          <Handshake className="h-3.5 w-3.5" /> Trades &amp; Favors for Partners:
                        </span>
                        <p className="text-muted-foreground whitespace-pre-line bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                          {report.tradesAndFavors}
                        </p>
                      </div>
                    )}

                    {/* Notes & Equipment */}
                    {(report.notes || (report.equipment && report.equipment.length > 0)) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {report.notes && (
                          <div>
                            <span className="font-semibold text-foreground">Field Notes:</span>
                            <p className="text-muted-foreground mt-0.5">{report.notes}</p>
                          </div>
                        )}
                        {report.equipment && report.equipment.length > 0 && (
                          <div>
                            <span className="font-semibold text-foreground">Equipment on Site:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {report.equipment.map((eq, i) => (
                                <Badge key={i} variant="secondary" className="text-[10px]">
                                  <Wrench className="h-2.5 w-2.5 mr-1 opacity-70" />
                                  {eq}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit & Review Modal */}
      {selectedReport && (
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Review Daily Report: {selectedReport.tradePartnerName}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Edit report details before approving and sending to ProjectSight.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Trade Company</Label>
                  <Input
                    value={selectedReport.tradePartnerName}
                    onChange={(e) =>
                      setSelectedReport({ ...selectedReport, tradePartnerName: e.target.value })
                    }
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Report Date</Label>
                  <Input
                    type="date"
                    value={selectedReport.date}
                    onChange={(e) =>
                      setSelectedReport({ ...selectedReport, date: e.target.value })
                    }
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Headcount</Label>
                  <Input
                    type="number"
                    value={selectedReport.workerCount}
                    onChange={(e) =>
                      setSelectedReport({
                        ...selectedReport,
                        workerCount: Number(e.target.value) || 0,
                      })
                    }
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Hours per person</Label>
                  <Input
                    type="number"
                    value={
                      selectedReport.workerCount > 0 && selectedReport.totalHours > 0
                        ? Math.round((selectedReport.totalHours / selectedReport.workerCount) * 10) / 10
                        : selectedReport.totalHours || 8
                    }
                    onChange={(e) => {
                      const hpp = Number(e.target.value) || 0;
                      const workers = selectedReport.workerCount || 1;
                      setSelectedReport({
                        ...selectedReport,
                        totalHours: Math.round(hpp * workers * 10) / 10,
                      });
                    }}
                    className="text-xs"
                  />
                  {selectedReport.totalHours > 0 && selectedReport.workerCount > 1 && (
                    <span className="text-[10px] text-muted-foreground block">
                      Total: {selectedReport.totalHours} hrs
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">STA Completed</Label>
                  <select
                    value={selectedReport.staCompleted ? "yes" : "no"}
                    onChange={(e) =>
                      setSelectedReport({
                        ...selectedReport,
                        staCompleted: e.target.value === "yes",
                      })
                    }
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Location &amp; Work Performed</Label>
                <Textarea
                  rows={3}
                  value={selectedReport.locationDescription}
                  onChange={(e) =>
                    setSelectedReport({ ...selectedReport, locationDescription: e.target.value })
                  }
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Field Notes &amp; Issues</Label>
                <Textarea
                  rows={2}
                  value={selectedReport.notes}
                  onChange={(e) =>
                    setSelectedReport({ ...selectedReport, notes: e.target.value })
                  }
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                  <Handshake className="h-3.5 w-3.5" /> Trades &amp; Favors Done for Trade Partners
                </Label>
                <Textarea
                  rows={2}
                  value={selectedReport.tradesAndFavors || ""}
                  onChange={(e) =>
                    setSelectedReport({ ...selectedReport, tradesAndFavors: e.target.value })
                  }
                  placeholder="Record any favors, equipment loaned, or trade coordination..."
                  className="text-xs"
                />
              </div>

              {/* Tier Subcontractors */}
              <div className="space-y-2 pt-1 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Tier Subcontractors on Site</Label>
                  {((selectedReport.tierSubcontractors || []).length > 0) && (
                    <span className="text-[11px] text-muted-foreground">
                      Total: {(selectedReport.tierSubcontractors || []).reduce((s, r) => s + (r.count || 0), 0)} workers
                    </span>
                  )}
                </div>
                {(!selectedReport.tierSubcontractors || selectedReport.tierSubcontractors.length === 0) ? (
                  <p className="text-xs text-muted-foreground italic py-1">No tier subcontractors recorded.</p>
                ) : (
                  (selectedReport.tierSubcontractors || []).map((sub, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={sub.name}
                        onChange={(e) => {
                          const updated = [...(selectedReport.tierSubcontractors || [])];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          setSelectedReport({ ...selectedReport, tierSubcontractors: updated });
                        }}
                        placeholder="Subcontractor company name"
                        className="text-xs flex-1"
                      />
                      <div className="flex items-center gap-1 bg-muted/40 px-2 py-1 rounded-lg border border-border">
                        <span className="text-[11px] text-muted-foreground font-semibold">Headcount:</span>
                        <input
                          type="number"
                          min={0}
                          value={sub.count || ""}
                          onChange={(e) => {
                            const updated = [...(selectedReport.tierSubcontractors || [])];
                            updated[idx] = { ...updated[idx], count: Number(e.target.value) || 0 };
                            setSelectedReport({ ...selectedReport, tierSubcontractors: updated });
                          }}
                          className="w-12 bg-transparent text-xs text-center font-bold text-foreground focus:outline-none"
                        />
                      </div>
                      <Input
                        value={sub.trade || ""}
                        onChange={(e) => {
                          const updated = [...(selectedReport.tierSubcontractors || [])];
                          updated[idx] = { ...updated[idx], trade: e.target.value };
                          setSelectedReport({ ...selectedReport, tierSubcontractors: updated });
                        }}
                        placeholder="Trade (optional)"
                        className="text-xs w-28"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          const updated = (selectedReport.tierSubcontractors || []).filter((_, i) => i !== idx);
                          setSelectedReport({ ...selectedReport, tierSubcontractors: updated });
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1 text-[#0063a3] dark:text-blue-400"
                  onClick={() => {
                    setSelectedReport({
                      ...selectedReport,
                      tierSubcontractors: [
                        ...(selectedReport.tierSubcontractors || []),
                        { name: "", count: 1, trade: "" },
                      ],
                    });
                  }}
                >
                  <Plus className="h-3 w-3" /> Add tier subcontractor
                </Button>
              </div>

              <div className="space-y-2 pt-1 border-t">
                <Label className="text-xs font-semibold block">Equipment on Site</Label>
                {(!selectedReport.equipment || selectedReport.equipment.length === 0) ? (
                  <p className="text-xs text-muted-foreground italic py-1">No equipment recorded.</p>
                ) : (
                  (selectedReport.equipment || []).map((eqStr, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={eqStr.replace(/\s*\(Qty:\s*\d+\)/i, "")}
                        onChange={(e) => {
                          const updated = [...(selectedReport.equipment || [])];
                          const qtyMatch = eqStr.match(/\(Qty:\s*(\d+)\)/i);
                          const qty = qtyMatch ? qtyMatch[1] : "1";
                          updated[idx] = `${e.target.value} (Qty: ${qty})`;
                          setSelectedReport({ ...selectedReport, equipment: updated });
                        }}
                        placeholder="Equipment item"
                        className="text-xs flex-1"
                      />
                      <div className="flex items-center gap-1 bg-muted/40 px-2 py-1 rounded-lg border border-border">
                        <span className="text-[11px] text-muted-foreground font-semibold">Qty:</span>
                        <input
                          type="number"
                          min={1}
                          value={(() => {
                            const match = eqStr.match(/\(Qty:\s*(\d+)\)/i);
                            return match ? match[1] : "1";
                          })()}
                          onChange={(e) => {
                            const updated = [...(selectedReport.equipment || [])];
                            const cleanName = eqStr.replace(/\s*\(Qty:\s*\d+\)/i, "");
                            updated[idx] = `${cleanName} (Qty: ${e.target.value || 1})`;
                            setSelectedReport({ ...selectedReport, equipment: updated });
                          }}
                          className="w-12 bg-transparent text-xs text-center font-bold text-foreground focus:outline-none"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          const updated = (selectedReport.equipment || []).filter((_, i) => i !== idx);
                          setSelectedReport({ ...selectedReport, equipment: updated });
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1 text-[#0063a3] dark:text-blue-400"
                  onClick={() => {
                    setSelectedReport({
                      ...selectedReport,
                      equipment: [...(selectedReport.equipment || []), "Scissor Lift (Qty: 1)"],
                    });
                  }}
                >
                  <Plus className="h-3 w-3" /> Add equipment item
                </Button>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2 flex items-center justify-between sm:justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 mr-auto"
                onClick={() => handleDelete(selectedReport.id)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="gap-1.5 font-semibold"
                  disabled={Boolean(approvingId)}
                  onClick={handleSaveEditAndApprove}
                >
                  {approvingId ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Approving…
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Save &amp; Approve to PS
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Contact Verification Modal */}
      <AddContactModal
        open={contactModalOpen}
        onOpenChange={setContactModalOpen}
        projectId={projectId}
        report={pendingReportForContact}
        company={pendingCompanyForContact}
        onContactCreatedAndApproved={async (_contact: CompanyContact) => {
          if (pendingReportForContact) {
            const reportToApprove = pendingReportForContact;
            await fetchReports();
            setApprovingId(reportToApprove.id);
            try {
              const res = await fetch(`/api/dailyreports/${reportToApprove.id}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
              });
              const json = await res.json();
              if (!res.ok) throw new Error(json.error || "Approval failed");
              await fetchReports();
            } catch (err) {
              setActionError(err instanceof Error ? err.message : "Approval failed");
            } finally {
              setApprovingId(null);
            }
          }
        }}
      />
    </div>
  );
}
