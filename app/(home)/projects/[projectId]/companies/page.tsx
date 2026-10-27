"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Building2,
  RefreshCw,
  Search,
  Users,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowLeft,
  Mail,
  Phone,
  UserCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { ProjectCompany } from "@/types/hpproto";

interface SyncCandidateCompany {
  id: string;
  psCompanyId?: number;
  name: string;
  trade: string;
  contactsCount: number;
  alreadyExists: boolean;
}

interface SyncPreviewData {
  remoteCount: number;
  addedCount: number;
  existingMatchCount: number;
  currentCount: number;
  totalAfterSync: number;
  sampleNames: string[];
  candidates: SyncCandidateCompany[];
  message: string;
}

const PAGE_SIZE_OPTIONS = [25, 50, 100];

export default function CompaniesPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const projectId = params.projectId;

  const [companies, setCompanies] = useState<ProjectCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [expandedCompanyIds, setExpandedCompanyIds] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync Confirmation Dialog State
  const [syncPreview, setSyncPreview] = useState<SyncPreviewData | null>(null);
  const [trackImportedByDefault, setTrackImportedByDefault] = useState(true);
  const [selectedImportIds, setSelectedImportIds] = useState<Set<string>>(new Set());
  const [importFilterQuery, setImportFilterQuery] = useState("");

  // New Contact Dialog
  const [selectedCompanyForContact, setSelectedCompanyForContact] = useState<ProjectCompany | null>(null);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [savingContact, setSavingContact] = useState(false);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}/companies`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load companies");
      const json = await res.json();
      if (json.success && Array.isArray(json.companies)) {
        setCompanies(json.companies);
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: "error", text: "Could not load companies for this project." });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleToggleTracking = async (company: ProjectCompany, nextTracked: boolean) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === company.id ? { ...c, isTracked: nextTracked } : c)),
    );

    try {
      const res = await fetch(`/api/projects/${projectId}/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle-tracking",
          companyId: company.id,
          name: company.name,
          isTracked: nextTracked,
        }),
      });
      if (!res.ok) throw new Error("Failed to update tracking");
      const json = await res.json();
      if (json.success && Array.isArray(json.companies)) {
        setCompanies(json.companies);
        setFeedback({
          type: "success",
          text: `Tracking updated: "${company.name}" is now ${nextTracked ? "tracked on" : "excluded from"} the bowling sheet.`,
        });
      }
    } catch (err) {
      console.error(err);
      setCompanies((prev) =>
        prev.map((c) => (c.id === company.id ? { ...c, isTracked: !nextTracked } : c)),
      );
      setFeedback({ type: "error", text: "Failed to update tracking toggle." });
    }
  };

  const handleDeleteCompany = async (company: ProjectCompany) => {
    if (!confirm(`Are you sure you want to delete "${company.name}" from this project? This will exclude it from the bowling sheet and dashboard.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          companyId: company.id,
          name: company.name,
          purgeReports: false,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete company");
      }
      setCompanies((prev) => prev.filter((c) => c.id !== company.id));
      setFeedback({
        type: "success",
        text: `Removed "${company.name}" from the project.`,
      });
    } catch (err) {
      console.error(err);
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to delete company",
      });
    }
  };

  const handleClearAllCompanies = async () => {
    if (!confirm(`Are you sure you want to remove all ${companies.length} companies from this project?`)) {
      return;
    }

    try {
      setSyncing(true);
      const res = await fetch(`/api/projects/${projectId}/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to clear companies");
      }
      setCompanies([]);
      setPage(1);
      setFeedback({
        type: "success",
        text: "Cleared all company records from this project.",
      });
    } catch (err) {
      console.error(err);
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to clear companies",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleRequestSyncPreview = async () => {
    try {
      setSyncing(true);
      setFeedback(null);
      const res = await fetch(`/api/projects/${projectId}/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preview-sync-connected" }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to check companies from ProjectSight");
      }
      const addedCount = Number(json.addedCount ?? 0);
      const candidates: SyncCandidateCompany[] = Array.isArray(json.candidates) ? json.candidates : [];
      setTrackImportedByDefault(addedCount <= 50);
      setImportFilterQuery("");
      // For small lists (<= 50), pre-select all new candidates; for large portfolio dumps (> 50), start unselected so user can cherry-pick
      if (candidates.length > 0 && addedCount <= 50) {
        setSelectedImportIds(new Set(candidates.map((c) => c.id)));
      } else {
        setSelectedImportIds(new Set());
      }
      setSyncPreview({
        remoteCount: Number(json.remoteCount ?? 0),
        addedCount,
        existingMatchCount: Number(json.existingMatchCount ?? 0),
        currentCount: Number(json.currentCount ?? companies.length),
        totalAfterSync: Number(json.totalAfterSync ?? companies.length + addedCount),
        sampleNames: Array.isArray(json.sampleNames) ? json.sampleNames : [],
        candidates,
        message: json.message || `Found ${json.remoteCount ?? 0} companies in ProjectSight.`,
      });
    } catch (err) {
      console.error(err);
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Sync check from ProjectSight failed.",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleConfirmSyncConnected = async () => {
    try {
      setSyncing(true);
      setFeedback(null);
      const res = await fetch(`/api/projects/${projectId}/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sync-connected",
          trackImported: trackImportedByDefault,
          selectedCompanyIds: Array.from(selectedImportIds),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to sync companies from ProjectSight");
      }
      setSyncPreview(null);
      setPage(1);
      setFeedback({
        type: "success",
        text: json.message || `Successfully synced ${json.count || 0} companies from ProjectSight.`,
      });
      if (Array.isArray(json.companies)) {
        setCompanies(json.companies);
      } else {
        await fetchCompanies();
      }
    } catch (err) {
      console.error(err);
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Sync from ProjectSight failed.",
      });
    } finally {
      setSyncing(false);
    }
  };

  const toggleExpand = (companyId: string) => {
    setExpandedCompanyIds((prev) => {
      const next = new Set(prev);
      if (next.has(companyId)) {
        next.delete(companyId);
      } else {
        next.add(companyId);
      }
      return next;
    });
  };

  const handleAddContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyForContact || !newFirstName.trim() || !newLastName.trim()) return;

    try {
      setSavingContact(true);
      const res = await fetch(
        `/api/projects/${projectId}/companies/${selectedCompanyForContact.id}/contacts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: newFirstName.trim(),
            lastName: newLastName.trim(),
            email: newEmail.trim() || undefined,
            title: newTitle.trim() || undefined,
            phone: newPhone.trim() || undefined,
          }),
        },
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save contact");
      }

      setFeedback({
        type: "success",
        text: `Added contact ${newFirstName} ${newLastName} to ${selectedCompanyForContact.name}.`,
      });
      setSelectedCompanyForContact(null);
      setNewFirstName("");
      setNewLastName("");
      setNewEmail("");
      setNewTitle("");
      setNewPhone("");
      await fetchCompanies();
    } catch (err) {
      console.error(err);
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to add contact.",
      });
    } finally {
      setSavingContact(false);
    }
  };

  const filteredCompanies = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.trade || "").toLowerCase().includes(q) ||
        c.contacts.some(
          (ct) =>
            ct.displayName.toLowerCase().includes(q) ||
            (ct.email || "").toLowerCase().includes(q),
        ),
    );
  }, [companies, search]);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedCompanies = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredCompanies.slice(start, start + pageSize);
  }, [filteredCompanies, safePage, pageSize]);

  const trackedCount = useMemo(() => companies.filter((c) => c.isTracked).length, [companies]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Top Header Banner */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/projects/${projectId}/dashboard`)}
              className="text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Project
            </Button>
            <div className="h-5 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-tc-blue rounded-lg">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                  Project Companies & Trade Partners
                </h1>
                <p className="text-xs text-slate-500">
                  Manage trade companies, contacts, and bowling sheet tracking toggles.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Badge variant="outline" className="px-3 py-1 font-medium bg-blue-50 text-tc-blue border-blue-200">
              <UserCheck className="w-3.5 h-3.5 mr-1" />
              {trackedCount} Tracked on Bowling Sheet
            </Badge>

            {companies.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllCompanies}
                disabled={syncing || loading}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Clear All ({companies.length})
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={fetchCompanies}
              disabled={loading}
              className="border-slate-300 text-slate-700"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            <Button
              size="sm"
              onClick={handleRequestSyncPreview}
              disabled={syncing}
              className="bg-tc-blue hover:bg-blue-700 text-white font-medium"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Checking..." : "Sync from ProjectSight"}
            </Button>
          </div>
        </div>

        {feedback && (
          <div
            className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span className="flex-1">{feedback.text}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-semibold underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Main Workspace */}
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-4">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by company name, trade, or contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
            <span>
              Showing{" "}
              {filteredCompanies.length === 0
                ? 0
                : (safePage - 1) * pageSize + 1}
              –{Math.min(safePage * pageSize, filteredCompanies.length)} of{" "}
              {filteredCompanies.length} companies
              {filteredCompanies.length !== companies.length ? ` (${companies.length} total)` : ""}
            </span>

            <select
              aria-label="Companies per page"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value) || 25)}
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Company Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-tc-blue" />
              <span>Loading project companies...</span>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="p-3 bg-slate-100 rounded-full text-slate-400">
                <Building2 className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-slate-800 text-lg">No companies found</h3>
              <p className="text-sm text-slate-500 max-w-md">
                {search
                  ? "No companies match your search filter."
                  : "No companies have been added or synced to this project yet."}
              </p>
              {!search && (
                <Button onClick={handleRequestSyncPreview} disabled={syncing} className="mt-2 bg-tc-blue text-white">
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                  Sync Companies from ProjectSight
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {paginatedCompanies.map((company) => {
                const isExpanded = expandedCompanyIds.has(company.id);
                return (
                  <div key={company.id} className="transition-colors hover:bg-slate-50/70">
                    <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Expand, Company Name, Trade badge */}
                      <div className="flex items-start md:items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => toggleExpand(company.id)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded mt-0.5 md:mt-0 transition-colors"
                          title="View contacts"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 text-base">
                              {company.name}
                            </span>
                            {company.psCompanyId && (
                              <Badge variant="outline" className="text-[10px] text-slate-500 py-0 h-4 border-slate-300">
                                PS #{company.psCompanyId}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-600">
                              {company.trade || "Trade Partner"}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleExpand(company.id)}
                              className="text-xs text-tc-blue hover:underline flex items-center gap-1 font-medium"
                            >
                              <Users className="w-3.5 h-3.5" />
                              {company.contacts.length} {company.contacts.length === 1 ? "Contact" : "Contacts"}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right: Bowling Sheet tracking toggle */}
                      <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pl-7 md:pl-0">
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <Label
                              htmlFor={`switch-${company.id}`}
                              className="text-xs font-semibold cursor-pointer block text-slate-800"
                            >
                              Track on Bowling Sheet
                            </Label>
                            <span className="text-[11px] text-slate-500">
                              {company.isTracked ? "Included in daily intake & bowling" : "Excluded from dropdown & grid"}
                            </span>
                          </div>
                          <Switch
                            id={`switch-${company.id}`}
                            checked={company.isTracked}
                            onCheckedChange={(checked) => handleToggleTracking(company, checked)}
                          />
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCompanyForContact(company);
                            setNewFirstName("");
                            setNewLastName("");
                            setNewEmail("");
                            setNewTitle("Foreman");
                            setNewPhone("");
                          }}
                          className="text-xs text-slate-600 hover:text-tc-blue"
                          title="Add contact for this company"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Add Contact
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCompany(company)}
                          className="text-xs text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title={`Delete ${company.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>

                    {/* Expandable Contacts section */}
                    {isExpanded && (
                      <div className="bg-slate-50 border-t border-slate-100 px-12 py-3">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                          <span>Associated Company Contacts ({company.contacts.length})</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCompanyForContact(company);
                              setNewFirstName("");
                              setNewLastName("");
                              setNewEmail("");
                              setNewTitle("Foreman");
                              setNewPhone("");
                            }}
                            className="text-xs font-medium text-tc-blue hover:underline flex items-center gap-1 normal-case"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Contact
                          </button>
                        </div>

                        {company.contacts.length === 0 ? (
                          <div className="text-xs text-slate-400 italic py-2">
                            No individual contacts registered for this company yet. Click &quot;Add Contact&quot; to register a foreman or manager.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 py-1">
                            {company.contacts.map((contact) => (
                              <div
                                key={contact.id}
                                className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs text-xs space-y-1"
                              >
                                <div className="font-semibold text-slate-800 flex items-center justify-between">
                                  <span>{contact.displayName || `${contact.firstName} ${contact.lastName}`}</span>
                                  {contact.title && (
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-normal">
                                      {contact.title}
                                    </span>
                                  )}
                                </div>
                                {contact.email && (
                                  <div className="text-slate-500 flex items-center gap-1.5 truncate">
                                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate">{contact.email}</span>
                                  </div>
                                )}
                                {contact.phone && (
                                  <div className="text-slate-500 flex items-center gap-1.5">
                                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>{contact.phone}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Footer */}
          {!loading && totalPages > 1 && (
            <div className="border-t border-slate-200 bg-slate-50/70 px-4 py-3 flex items-center justify-between text-xs text-slate-600">
              <span>
                Page <strong>{safePage}</strong> of <strong>{totalPages}</strong> ({filteredCompanies.length} companies)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-2.5 text-xs gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 px-2.5 text-xs gap-1"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sync Confirmation Dialog */}
      <Dialog
        open={Boolean(syncPreview)}
        onOpenChange={(open) => {
          if (!open) setSyncPreview(null);
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-tc-blue" />
              Select ProjectSight Companies to Import
            </DialogTitle>
            <DialogDescription>
              Search and select only the specific trade companies you want to import into this project, or select all.
            </DialogDescription>
          </DialogHeader>

          {syncPreview && (() => {
            const q = importFilterQuery.trim().toLowerCase();
            const filteredCandidates = syncPreview.candidates.filter(
              (c) =>
                !q ||
                c.name.toLowerCase().includes(q) ||
                c.trade.toLowerCase().includes(q) ||
                (c.psCompanyId != null && String(c.psCompanyId).includes(q)),
            );

            return (
              <div className="space-y-3.5 py-1 text-xs">
                <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">Found in PS</span>
                    <span className="text-base font-bold text-slate-900">{syncPreview.remoteCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">Selected</span>
                    <span className="text-base font-bold text-tc-blue">{selectedImportIds.size}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">Currently in App</span>
                    <span className="text-base font-bold text-slate-900">{syncPreview.currentCount}</span>
                  </div>
                </div>

                {syncPreview.remoteCount > 50 && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-[11px] leading-snug">
                      <span className="font-semibold">Portfolio Directory Detected ({syncPreview.remoteCount} companies):</span>{" "}
                      To avoid importing the entire portfolio, we started with <strong>0 selected</strong>. Search below and check only the trade partners active on your jobsite.
                    </div>
                  </div>
                )}

                {/* Search & Select All / None Toolbar */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <Input
                        type="search"
                        value={importFilterQuery}
                        onChange={(e) => setImportFilterQuery(e.target.value)}
                        placeholder="Search ProjectSight companies by name or trade…"
                        className="pl-8 h-8 text-xs"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-xs shrink-0"
                      onClick={() => {
                        setSelectedImportIds((prev) => {
                          const next = new Set(prev);
                          for (const c of filteredCandidates) next.add(c.id);
                          return next;
                        });
                      }}
                    >
                      Select {q ? `Matching (${filteredCandidates.length})` : "All"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-xs shrink-0"
                      onClick={() => setSelectedImportIds(new Set())}
                    >
                      Clear
                    </Button>
                  </div>

                  {/* Scrollable Checklist */}
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                    {filteredCandidates.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 italic">
                        No ProjectSight companies match &ldquo;{importFilterQuery}&rdquo;.
                      </div>
                    ) : (
                      filteredCandidates.slice(0, 150).map((cand) => {
                        const checked = selectedImportIds.has(cand.id);
                        return (
                          <label
                            key={cand.id}
                            className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const isChecked = e.target.checked;
                                  setSelectedImportIds((prev) => {
                                    const next = new Set(prev);
                                    if (isChecked) next.add(cand.id);
                                    else next.delete(cand.id);
                                    return next;
                                  });
                                }}
                                className="rounded border-slate-300"
                              />
                              <div className="min-w-0">
                                <span className="font-semibold text-slate-800 block truncate">
                                  {cand.name}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {cand.trade} · {cand.contactsCount} contact(s)
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {cand.psCompanyId && (
                                <Badge variant="outline" className="text-[10px] py-0 h-4 text-slate-500">
                                  PS #{cand.psCompanyId}
                                </Badge>
                              )}
                              {cand.alreadyExists && (
                                <Badge variant="secondary" className="text-[10px] py-0 h-4">
                                  In App
                                </Badge>
                              )}
                            </div>
                          </label>
                        );
                      })
                    )}
                    {filteredCandidates.length > 150 && (
                      <div className="p-2 text-center text-[11px] text-slate-500 bg-slate-50">
                        Showing first 150 of {filteredCandidates.length} matches — use the search box above to narrow further.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="pr-3">
                    <Label htmlFor="track-imported-switch" className="text-xs font-semibold text-slate-800 block cursor-pointer">
                      Track selected companies on Bowling Sheet immediately
                    </Label>
                    <span className="text-[11px] text-slate-500">
                      {trackImportedByDefault
                        ? `Selected companies (${selectedImportIds.size}) will appear as active rows on the Bowling Sheet`
                        : "Selected companies will be saved to directory as untracked until toggled on"}
                    </span>
                  </div>
                  <Switch
                    id="track-imported-switch"
                    checked={trackImportedByDefault}
                    onCheckedChange={setTrackImportedByDefault}
                  />
                </div>
              </div>
            );
          })()}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSyncPreview(null)}
              disabled={syncing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmSyncConnected}
              disabled={syncing || selectedImportIds.size === 0}
              className="bg-tc-blue hover:bg-blue-700 text-white"
            >
              {syncing
                ? "Importing..."
                : `Import ${selectedImportIds.size} Selected ${selectedImportIds.size === 1 ? "Company" : "Companies"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Contact Dialog */}
      <Dialog
        open={Boolean(selectedCompanyForContact)}
        onOpenChange={(open) => {
          if (!open) setSelectedCompanyForContact(null);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleAddContactSubmit}>
            <DialogHeader>
              <DialogTitle>Add Company Contact</DialogTitle>
              <DialogDescription>
                Add a new foreman, manager, or contact for{" "}
                <span className="font-semibold text-slate-900">
                  {selectedCompanyForContact?.name}
                </span>
                . If connected to ProjectSight, it will be saved directly to the company.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="contactFirstName" className="text-xs">
                    First Name *
                  </Label>
                  <Input
                    id="contactFirstName"
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="John"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="contactLastName" className="text-xs">
                    Last Name *
                  </Label>
                  <Input
                    id="contactLastName"
                    required
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="Doe"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="contactEmail" className="text-xs">
                  Email
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="john.doe@company.com"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="contactTitle" className="text-xs">
                    Title / Role
                  </Label>
                  <Input
                    id="contactTitle"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Foreman"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="contactPhone" className="text-xs">
                    Phone
                  </Label>
                  <Input
                    id="contactPhone"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedCompanyForContact(null)}
                disabled={savingContact}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={savingContact} className="bg-tc-blue text-white">
                {savingContact ? "Saving..." : "Save Contact"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
