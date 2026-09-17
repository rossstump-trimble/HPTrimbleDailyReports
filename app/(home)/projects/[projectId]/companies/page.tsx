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
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowLeft,
  Mail,
  Phone,
  UserCheck,
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
import type { ProjectCompany, CompanyContact } from "@/types/hpproto";

export default function CompaniesPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const projectId = params.projectId;

  const [companies, setCompanies] = useState<ProjectCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedCompanyIds, setExpandedCompanyIds] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  const handleToggleTracking = async (companyId: string, currentTracked: boolean) => {
    const nextTracked = !currentTracked;

    // Optimistic UI update
    setCompanies((prev) =>
      prev.map((c) => (c.id === companyId ? { ...c, isTracked: nextTracked } : c)),
    );

    try {
      const res = await fetch(`/api/projects/${projectId}/companies/${companyId}/tracking`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTracked: nextTracked }),
      });
      if (!res.ok) throw new Error("Failed to update tracking");
      const json = await res.json();
      if (json.success && Array.isArray(json.companies)) {
        setCompanies(json.companies);
      }
    } catch (err) {
      console.error(err);
      // Revert optimistic update
      setCompanies((prev) =>
        prev.map((c) => (c.id === companyId ? { ...c, isTracked: currentTracked } : c)),
      );
      setFeedback({ type: "error", text: "Failed to update tracking toggle." });
    }
  };

  const handleSyncConnected = async () => {
    try {
      setSyncing(true);
      setFeedback(null);
      const res = await fetch(`/api/projects/${projectId}/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync-connected" }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to sync companies from ProjectSight");
      }
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

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1 font-medium bg-blue-50 text-tc-blue border-blue-200">
              <UserCheck className="w-3.5 h-3.5 mr-1" />
              {trackedCount} Tracked on Bowling Sheet
            </Badge>

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
              onClick={handleSyncConnected}
              disabled={syncing}
              className="bg-tc-blue hover:bg-blue-700 text-white font-medium"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync from ProjectSight"}
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

          <div className="text-xs text-slate-500 font-medium">
            Showing {filteredCompanies.length} of {companies.length} companies
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
                <Button onClick={handleSyncConnected} disabled={syncing} className="mt-2 bg-tc-blue text-white">
                  <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                  Sync Companies from ProjectSight
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredCompanies.map((company) => {
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
                            onCheckedChange={() => handleToggleTracking(company.id, company.isTracked)}
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
        </div>
      </div>

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
