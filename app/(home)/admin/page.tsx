"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Building2,
  Trash2,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Lock,
  Mail,
  Globe,
  Database,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { AccessControlConfig } from "@/types/hpproto";

interface AdminProjectSummary {
  id: string;
  code: string;
  name: string;
  psPortfolioId?: string;
  psProjectId?: string;
  trackedCompaniesCount: number;
  totalCompaniesCount: number;
}

interface AdminDashboardResponse {
  success: boolean;
  accessControl: AccessControlConfig;
  capacity: { total: number; max: number; isLocked: boolean };
  summary: {
    projectsCount: number;
    dailyReportsCount: number;
    punchItemsCount: number;
    inspectionsCount: number;
    projects: AdminProjectSummary[];
  };
}

export default function AdminControlsPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [newDomain, setNewDomain] = useState("");
  const [newAllowedEmail, setNewAllowedEmail] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load admin settings");
      }
      setData(json);
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Could not load admin controls.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAdminData();
  }, [fetchAdminData]);

  const saveAccessControl = async (nextConfig: Partial<AccessControlConfig>) => {
    if (!data) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data.accessControl,
          ...nextConfig,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save settings");
      }
      setData((prev) => (prev ? { ...prev, accessControl: json.accessControl } : prev));
      setFeedback({ type: "success", text: "Access control policy updated." });
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save access control policy.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !newDomain.trim()) return;
    const clean = newDomain.trim().toLowerCase().replace(/^@+/, "");
    if (!clean) return;
    const nextDomains = Array.from(new Set([...data.accessControl.allowedDomains, clean]));
    setNewDomain("");
    void saveAccessControl({ allowedDomains: nextDomains });
  };

  const handleRemoveDomain = (domain: string) => {
    if (!data) return;
    if (data.accessControl.allowedDomains.length <= 1) {
      setFeedback({ type: "error", text: "At least one allowed email domain must remain active." });
      return;
    }
    const nextDomains = data.accessControl.allowedDomains.filter((d) => d !== domain);
    void saveAccessControl({ allowedDomains: nextDomains });
  };

  const handleAddAllowedEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !newAllowedEmail.trim()) return;
    const clean = newAllowedEmail.trim().toLowerCase();
    if (!clean.includes("@")) return;
    const nextEmails = Array.from(new Set([...data.accessControl.allowedEmails, clean]));
    setNewAllowedEmail("");
    void saveAccessControl({ allowedEmails: nextEmails });
  };

  const handleRemoveAllowedEmail = (email: string) => {
    if (!data) return;
    const nextEmails = data.accessControl.allowedEmails.filter((e) => e !== email);
    void saveAccessControl({ allowedEmails: nextEmails });
  };

  const handleAddAdminEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !newAdminEmail.trim()) return;
    const clean = newAdminEmail.trim().toLowerCase();
    if (!clean.includes("@")) return;
    const nextAdmins = Array.from(new Set([...data.accessControl.adminEmails, clean]));
    setNewAdminEmail("");
    void saveAccessControl({ adminEmails: nextAdmins });
  };

  const handleRemoveAdminEmail = (email: string) => {
    if (!data) return;
    if (data.accessControl.adminEmails.length <= 1) {
      setFeedback({ type: "error", text: "At least one administrator email must remain configured." });
      return;
    }
    const nextAdmins = data.accessControl.adminEmails.filter((e) => e !== email);
    void saveAccessControl({ adminEmails: nextAdmins });
  };

  const handleClearProjectCompanies = async (proj: AdminProjectSummary) => {
    if (
      !confirm(
        `Are you sure you want to remove all ${proj.totalCompaniesCount || proj.trackedCompaniesCount} company records from "${proj.name}"?`,
      )
    ) {
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/projects/${proj.id}/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to clear project companies");
      }
      setFeedback({
        type: "success",
        text: `Cleared all company records from project "${proj.name}".`,
      });
      await fetchAdminData();
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to clear project companies",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/projects")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Projects
          </Button>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#0063a3]/10 text-[#0063a3]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">System Admin &amp; Security Controls</h1>
              <p className="text-xs text-muted-foreground">
                Manage authorized email domains (@henselphelps.com, @trimble.com), user allowlists, and project data hygiene.
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void fetchAdminData()}
          disabled={loading || saving}
          className="gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200"
              : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading || !data ? (
        <div className="flex items-center justify-center h-48 text-sm text-muted-foreground gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading system controls…
        </div>
      ) : (
        <div className="space-y-6">
          {/* System Telemetry Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <span className="text-xs text-muted-foreground font-medium">Allowed Login Domains</span>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {data.accessControl.allowedDomains.length}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {data.accessControl.allowedDomains.map((d) => `@${d}`).join(", ")}
                </span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <span className="text-xs text-muted-foreground font-medium">Active Projects</span>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {data.summary.projectsCount}
                </div>
                <span className="text-[11px] text-muted-foreground">configured in workspace</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <span className="text-xs text-muted-foreground font-medium">Daily Report Capacity</span>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {data.capacity.total} / {data.capacity.max}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {data.capacity.isLocked ? "Submissions Locked" : "Accepting Field Reports"}
                </span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <span className="text-xs text-muted-foreground font-medium">Checklists &amp; Punch</span>
                <div className="text-2xl font-bold text-foreground mt-1">
                  {data.summary.inspectionsCount + data.summary.punchItemsCount}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {data.summary.inspectionsCount} checklists · {data.summary.punchItemsCount} punch items
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Domain & Login Policy */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[#0063a3]" />
                  Authorized Login Email Domains
                </CardTitle>
                <CardDescription className="text-xs">
                  Only users with Trimble Identity accounts matching these email domains can sign in to the portal.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {data.accessControl.allowedDomains.map((domain) => (
                    <Badge
                      key={domain}
                      variant="secondary"
                      className="px-3 py-1.5 text-xs font-mono flex items-center gap-2 bg-blue-50 text-[#0063a3] border border-blue-200 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-800"
                    >
                      <span>@{domain}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDomain(domain)}
                        disabled={saving || data.accessControl.allowedDomains.length <= 1}
                        className="text-slate-400 hover:text-red-600 disabled:opacity-30"
                        title={`Remove @${domain}`}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>

                <form onSubmit={handleAddDomain} className="flex gap-2">
                  <Input
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="e.g. henselphelps.com"
                    className="h-9 text-xs"
                  />
                  <Button type="submit" size="sm" disabled={saving || !newDomain.trim()} className="h-9 text-xs gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    Add Domain
                  </Button>
                </form>

                <div className="pt-3 border-t border-border flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="passkey-toggle" className="text-xs font-semibold block">
                      Allow Prototype Passkey Fallback
                    </Label>
                    <span className="text-[11px] text-muted-foreground">
                      When disabled, all users must authenticate via Trimble Identity SSO with a verified @henselphelps.com or @trimble.com email.
                    </span>
                  </div>
                  <Switch
                    id="passkey-toggle"
                    checked={data.accessControl.allowPasskeyLogin}
                    onCheckedChange={(checked) => void saveAccessControl({ allowPasskeyLogin: checked })}
                    disabled={saving}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Individual Email Allowlist & Admins */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#0063a3]" />
                  Specific Allowed Emails &amp; Administrators
                </CardTitle>
                <CardDescription className="text-xs">
                  Grant explicit login access to individual email addresses or manage system administrators.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Explicitly Allowed Emails</Label>
                  {data.accessControl.allowedEmails.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      No individual email exceptions configured (domain rules apply).
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {data.accessControl.allowedEmails.map((email) => (
                        <Badge key={email} variant="outline" className="text-xs font-mono gap-1.5 py-1">
                          <span>{email}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAllowedEmail(email)}
                            className="text-muted-foreground hover:text-red-600"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <form onSubmit={handleAddAllowedEmail} className="flex gap-2">
                    <Input
                      type="email"
                      value={newAllowedEmail}
                      onChange={(e) => setNewAllowedEmail(e.target.value)}
                      placeholder="user@henselphelps.com"
                      className="h-8 text-xs"
                    />
                    <Button type="submit" variant="outline" size="sm" disabled={saving || !newAllowedEmail.trim()} className="h-8 text-xs">
                      Add Email
                    </Button>
                  </form>
                </div>

                <div className="space-y-2 pt-3 border-t border-border">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-amber-600" />
                    Administrator Emails
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {data.accessControl.adminEmails.map((email) => (
                      <Badge key={email} variant="secondary" className="text-xs font-mono gap-1.5 py-1">
                        <span>{email}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAdminEmail(email)}
                          disabled={saving || data.accessControl.adminEmails.length <= 1}
                          className="text-muted-foreground hover:text-red-600 disabled:opacity-30"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <form onSubmit={handleAddAdminEmail} className="flex gap-2">
                    <Input
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="admin@trimble.com"
                      className="h-8 text-xs"
                    />
                    <Button type="submit" variant="outline" size="sm" disabled={saving || !newAdminEmail.trim()} className="h-8 text-xs">
                      Add Admin
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Project Company Directory Hygiene */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4 text-[#0063a3]" />
                Project Company Directories &amp; Bulk Cleanup
              </CardTitle>
              <CardDescription className="text-xs">
                Inspect imported ProjectSight company counts per project and reset/remove unintended bulk portfolio imports.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                {data.summary.projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card hover:bg-muted/20 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {proj.code}
                        </Badge>
                        <span className="font-semibold text-sm text-foreground">{proj.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        ID: {proj.id} · PS Project: {proj.psProjectId || "—"} · Tracked:{" "}
                        <strong className="text-foreground">{proj.trackedCompaniesCount}</strong> · Total Stored:{" "}
                        <strong className="text-foreground">{proj.totalCompaniesCount}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/projects/${proj.id}/companies`)}
                        className="h-8 text-xs gap-1.5"
                      >
                        <Building2 className="h-3.5 w-3.5" />
                        Manage Companies ({proj.totalCompaniesCount})
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={saving || (proj.totalCompaniesCount === 0 && proj.trackedCompaniesCount === 0)}
                        onClick={() => void handleClearProjectCompanies(proj)}
                        className="h-8 text-xs gap-1.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Clear Companies
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
