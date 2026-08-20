"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Building2,
  User,
  UserCircle,
  Trophy,
  Database,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  ArrowUpDown,
  X,
  Globe,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type IssueSeverity = "critical" | "high" | "medium" | "low";
type ContributorType = "company" | "individual" | "anonymous";

interface PublicIssue {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: IssueSeverity;
  specSection: string;
  csiCode: string;
  rootCause: string;
  resolution: string;
  costImpact: string;
  scheduleImpactDays: number;
  projectType: string;
  contributorType: ContributorType;
  contributorName: string;
  dateSubmitted: string;
  upvotes: number;
  verified: boolean;
}

interface TopContributor {
  name: string;
  type: ContributorType;
  issueCount: number;
  avatar?: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const topContributors: TopContributor[] = [
  { name: "Turner Construction", type: "company", issueCount: 47 },
  { name: "Skanska USA", type: "company", issueCount: 38 },
  { name: "Sarah Chen, PE", type: "individual", issueCount: 31 },
  { name: "Hensel Phelps", type: "company", issueCount: 28 },
  { name: "Marcus Rivera, AIA", type: "individual", issueCount: 24 },
  { name: "DPR Construction", type: "company", issueCount: 22 },
];

const mockPublicIssues: PublicIssue[] = [
  {
    id: "pub-001",
    title: "HVAC Supply Duct Routing Conflicts with Structural Beams",
    description: "HVAC supply ducts designed at the same elevation as steel beams cause clashes discovered during rough-in. Typically occurs when 3D coordination is skipped or when architectural ceiling heights are modified after MEP design.",
    category: "MEP Coordination",
    severity: "critical",
    specSection: "23 31 13",
    csiCode: "23 00 00",
    rootCause: "Lack of 3D clash detection before construction. MEP and structural models designed in isolation without interdisciplinary review.",
    resolution: "Implement mandatory BIM coordination meetings bi-weekly. Route supply ducts with minimum 8\" vertical offset below beams. Run automated clash detection before each phase milestone.",
    costImpact: "$35,000 - $75,000",
    scheduleImpactDays: 15,
    projectType: "Commercial Office",
    contributorType: "company",
    contributorName: "Turner Construction",
    dateSubmitted: "2025-11-15",
    upvotes: 142,
    verified: true,
  },
  {
    id: "pub-002",
    title: "Below-Grade Waterproofing Specification vs Drawing Conflict",
    description: "Specifications call for sheet membrane waterproofing while architectural details show fluid-applied system. Contractors follow whichever document they read first, leading to incorrect material installation.",
    category: "Envelope",
    severity: "high",
    specSection: "07 11 13",
    csiCode: "07 00 00",
    rootCause: "Specifications and architectural details developed by different teams without reconciliation. No cross-reference check between spec book and detail sheets.",
    resolution: "Require spec-to-drawing cross-reference matrix at 90% CD milestone. Issue RFI immediately when any discrepancy is found. Default to specification when conflicts exist per AIA A201 §1.2.1.",
    costImpact: "$20,000 - $45,000",
    scheduleImpactDays: 10,
    projectType: "Multi-Family Residential",
    contributorType: "individual",
    contributorName: "Sarah Chen, PE",
    dateSubmitted: "2025-10-28",
    upvotes: 98,
    verified: true,
  },
  {
    id: "pub-003",
    title: "Fire Sprinkler Head Clearance Insufficient in Tight Plenums",
    description: "Ceiling height reductions during value engineering leave insufficient clearance between T-bar grid and deck for proper pendant sprinkler head spray patterns per NFPA 13.",
    category: "Fire Protection",
    severity: "high",
    specSection: "21 13 13",
    csiCode: "21 00 00",
    rootCause: "Ceiling heights reduced during VE without updating fire protection drawings. Plenum depth not reverified against NFPA clearance tables.",
    resolution: "Add fire protection clearance check to VE review checklist. Verify plenum depth against NFPA 13 Table 8.6.4.1.1.1 after any ceiling height change. Consider sidewall or recessed heads for tight plenums.",
    costImpact: "$15,000 - $40,000",
    scheduleImpactDays: 12,
    projectType: "Healthcare",
    contributorType: "company",
    contributorName: "Skanska USA",
    dateSubmitted: "2025-12-03",
    upvotes: 87,
    verified: true,
  },
  {
    id: "pub-004",
    title: "Missing Structural Steel Connection Details at Moment Frames",
    description: "Structural drawings show moment connections without referencing a detail sheet. Steel fabricators hold production while awaiting engineer clarification, causing downstream schedule delays.",
    category: "Structural",
    severity: "medium",
    specSection: "05 12 23",
    csiCode: "05 00 00",
    rootCause: "Structural detail set issued incomplete. Connection at key grid intersections flagged for future addendum that was never issued before bid.",
    resolution: "Include connection detail completeness check in pre-bid document review. Submit RFI at project kickoff for any missing connection details. Exclude incomplete connections from first shop drawing submission.",
    costImpact: "$10,000 - $25,000",
    scheduleImpactDays: 20,
    projectType: "Commercial Office",
    contributorType: "company",
    contributorName: "Hensel Phelps",
    dateSubmitted: "2025-09-17",
    upvotes: 76,
    verified: true,
  },
  {
    id: "pub-005",
    title: "Electrical Panel Working Clearance Violated by Corridor Narrowing",
    description: "Electrical panels located in corridors lose NEC 110.26 required 36\" working clearance when wall furring or finish revisions reduce corridor width.",
    category: "Electrical",
    severity: "medium",
    specSection: "26 24 16",
    csiCode: "26 00 00",
    rootCause: "Panel locations coordinated with original architectural plan. Subsequent wall furring revision reduced corridor width below NEC clearance minimums.",
    resolution: "Flag all panel locations for clearance recheck after any architectural revision. Add NEC clearance verification to electrical rough-in inspection checklist. Relocate panel or revise wall before rough-in.",
    costImpact: "$5,000 - $12,000",
    scheduleImpactDays: 5,
    projectType: "Retail",
    contributorType: "individual",
    contributorName: "Marcus Rivera, AIA",
    dateSubmitted: "2025-08-22",
    upvotes: 64,
    verified: true,
  },
  {
    id: "pub-006",
    title: "Air Barrier Discontinuity at Curtain Wall-to-Concrete Transitions",
    description: "Transition details between curtain wall systems and cast-in-place concrete spandrels fail to show air barrier membrane termination, leading to infiltration failures during commissioning.",
    category: "Envelope",
    severity: "medium",
    specSection: "07 27 00",
    csiCode: "07 00 00",
    rootCause: "Curtain wall subcontractor and envelope consultant each assumed the other party's system would provide air barrier continuity at the transition.",
    resolution: "Require joint detail review between curtain wall sub and envelope consultant. Mandate a transition mock-up before full production. Add air barrier continuity check to building enclosure commissioning scope.",
    costImpact: "$15,000 - $30,000",
    scheduleImpactDays: 8,
    projectType: "Commercial Office",
    contributorType: "company",
    contributorName: "DPR Construction",
    dateSubmitted: "2025-11-05",
    upvotes: 59,
    verified: true,
  },
  {
    id: "pub-007",
    title: "Roof Drain Undersizing Due to Incorrect Rainfall Rate",
    description: "Plumbing engineer uses a generic rainfall intensity instead of the local jurisdiction's 100-year/1-hour rate, resulting in undersized roof drains that cause ponding and warranty claims.",
    category: "Plumbing",
    severity: "medium",
    specSection: "22 14 23",
    csiCode: "22 00 00",
    rootCause: "Design engineer used national average rainfall rate instead of local code-required value. No peer review of hydraulic calculations.",
    resolution: "Verify local rainfall intensity per IPC 1106.2 at project start. Require independent peer review of roof drain sizing calculations. Upsize drains by one size as safety factor in high-rainfall zones.",
    costImpact: "$8,000 - $18,000",
    scheduleImpactDays: 6,
    projectType: "Industrial",
    contributorType: "anonymous",
    contributorName: "Anonymous",
    dateSubmitted: "2025-10-12",
    upvotes: 52,
    verified: false,
  },
  {
    id: "pub-008",
    title: "Elevator Pit Depth Insufficient for Seismic Requirements",
    description: "Elevator pit designed to standard depth without accounting for seismic buffer requirements in Seismic Design Category D or higher. Discovered during elevator subcontractor shop drawing review.",
    category: "Structural",
    severity: "high",
    specSection: "14 21 00",
    csiCode: "14 00 00",
    rootCause: "Structural foundation design used standard elevator pit depth. Seismic buffer requirements from elevator manufacturer not communicated during design phase.",
    resolution: "Request elevator manufacturer's seismic requirements at schematic design. Include pit depth verification in foundation design checklist for SDC C and above. Coordinate pit depth with elevator sub before foundation pour.",
    costImpact: "$25,000 - $60,000",
    scheduleImpactDays: 18,
    projectType: "Multi-Family Residential",
    contributorType: "individual",
    contributorName: "Sarah Chen, PE",
    dateSubmitted: "2026-01-08",
    upvotes: 91,
    verified: true,
  },
  {
    id: "pub-009",
    title: "Concrete Mix Design Incompatible with Exposed Finish Requirements",
    description: "Standard structural concrete mix specified for elements requiring architectural exposed finish. Resulting surface quality fails to meet aesthetic standards, requiring costly remediation.",
    category: "Concrete",
    severity: "low",
    specSection: "03 31 00",
    csiCode: "03 00 00",
    rootCause: "Architectural finish requirements not communicated to structural engineer. Concrete spec written for structural performance only without considering surface aesthetics.",
    resolution: "Cross-reference structural concrete specs with architectural finish schedules. Specify architectural concrete mix separately for exposed elements. Require mock-up panel approval before production pours.",
    costImpact: "$12,000 - $35,000",
    scheduleImpactDays: 10,
    projectType: "Cultural / Institutional",
    contributorType: "anonymous",
    contributorName: "Anonymous",
    dateSubmitted: "2025-07-30",
    upvotes: 41,
    verified: false,
  },
  {
    id: "pub-010",
    title: "Stormwater Detention Vault Conflicts with Underground Utilities",
    description: "Site-designed stormwater detention vault location conflicts with existing underground utilities not shown on civil drawings. Discovered during excavation, requiring vault redesign and relocation.",
    category: "Civil / Site",
    severity: "critical",
    specSection: "33 44 00",
    csiCode: "33 00 00",
    rootCause: "Civil engineer relied on outdated utility survey. No potholing or ground-penetrating radar verification performed before design finalization.",
    resolution: "Require SUE (Subsurface Utility Engineering) Level A verification for all underground vault locations. Include utility conflict check in 60% design review. Budget contingency for utility relocations.",
    costImpact: "$50,000 - $120,000",
    scheduleImpactDays: 25,
    projectType: "Commercial Office",
    contributorType: "company",
    contributorName: "Turner Construction",
    dateSubmitted: "2026-02-14",
    upvotes: 118,
    verified: true,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const severityConfig: Record<IssueSeverity, { label: string; bg: string; text: string }> = {
  critical: { label: "Critical", bg: "bg-red-100", text: "text-red-700" },
  high: { label: "High", bg: "bg-orange-100", text: "text-orange-700" },
  medium: { label: "Medium", bg: "bg-yellow-100", text: "text-yellow-700" },
  low: { label: "Low", bg: "bg-blue-100", text: "text-blue-700" },
};

const categories = Array.from(new Set(mockPublicIssues.map((i) => i.category))).sort();
const projectTypes = Array.from(new Set(mockPublicIssues.map((i) => i.projectType))).sort();

// ─── Component ───────────────────────────────────────────────────────────────

export default function PublicIssuesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("");
  const [selectedProjectType, setSelectedProjectType] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"upvotes" | "date" | "severity">("upvotes");
  const [showFilters, setShowFilters] = useState(false);

  const severityOrder: Record<IssueSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

  const filteredIssues = useMemo(() => {
    let issues = [...mockPublicIssues];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      issues = issues.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.specSection.includes(q) ||
          i.csiCode.includes(q) ||
          i.category.toLowerCase().includes(q)
      );
    }
    if (selectedCategory) issues = issues.filter((i) => i.category === selectedCategory);
    if (selectedSeverity) issues = issues.filter((i) => i.severity === selectedSeverity);
    if (selectedProjectType) issues = issues.filter((i) => i.projectType === selectedProjectType);

    issues.sort((a, b) => {
      if (sortBy === "upvotes") return b.upvotes - a.upvotes;
      if (sortBy === "date") return new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime();
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    return issues;
  }, [searchQuery, selectedCategory, selectedSeverity, selectedProjectType, sortBy]);

  const activeFilterCount = [selectedCategory, selectedSeverity, selectedProjectType].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedSeverity("");
    setSelectedProjectType("");
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily: "'Open Sans', sans-serif" }}>
      {/* ── CPC Top Bar ── */}
      <div className="bg-[#006091] text-white">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between text-sm">
          <span className="font-medium">Become a Member!</span>
          <div className="flex items-center gap-4">
            <Globe className="h-4 w-4 opacity-80" />
            <span className="opacity-80">constructionprogress.org</span>
          </div>
        </div>
      </div>

      {/* ── CPC Header ── */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/cpc-logo.png"
              alt="Construction Progress Coalition"
              className="h-10 w-auto"
            />
            <div className="text-xs text-gray-500 border-l border-gray-300 pl-3">
              Public Insight Protocol
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#" className="hover:text-[#0078b4] transition-colors border-b-2 border-[#7cb342] pb-0.5 text-[#006091]">Database</a>
            <a href="#" className="hover:text-[#0078b4] transition-colors">About</a>
            <a href="#" className="hover:text-[#0078b4] transition-colors">Initiatives</a>
            <a href="#" className="hover:text-[#0078b4] transition-colors">Membership</a>
            <a href="#" className="hover:text-[#0078b4] transition-colors">Contact</a>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-[#006091] to-[#0078b4] text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Public Insight Protocol
              </h1>
              <p className="text-white/80 mt-2 max-w-2xl text-base leading-relaxed">
                A shared, industry-wide repository of construction issues and resolutions.
                Software solutions contribute anonymized data so the entire AEC community
                can learn from past mistakes and prevent recurring problems.
              </p>
              <p className="text-white/60 mt-1 text-sm italic">
                From Shared Pains... to Shared Gains!
              </p>
            </div>
            <div className="flex gap-4 shrink-0">
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl px-5 py-3 text-center">
                <div className="text-2xl font-bold">{mockPublicIssues.length}</div>
                <div className="text-xs text-white/70 mt-0.5">Total Issues</div>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl px-5 py-3 text-center">
                <div className="text-2xl font-bold">{topContributors.length}</div>
                <div className="text-xs text-white/70 mt-0.5">Contributors</div>
              </div>
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl px-5 py-3 text-center">
                <div className="text-2xl font-bold">{mockPublicIssues.filter((i) => i.verified).length}</div>
                <div className="text-xs text-white/70 mt-0.5">Verified</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Main Column ── */}
          <div className="flex-1 min-w-0">
            {/* Search + Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search issues by title, spec section, CSI code, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0078b4]/30 focus:border-[#0078b4] bg-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
                  showFilters || activeFilterCount > 0
                    ? "bg-[#0078b4] text-white border-[#0078b4]"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="bg-white/20 rounded-full px-1.5 py-0.5 text-xs">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                {(["upvotes", "date", "severity"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={`px-3 py-2.5 text-xs font-medium capitalize transition-colors ${
                      sortBy === s
                        ? "bg-[#006091] text-white"
                        : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {s === "upvotes" ? "Most Cited" : s === "date" ? "Newest" : "Severity"}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter dropdowns */}
            {showFilters && (
              <div className="flex flex-wrap gap-3 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0078b4]/30"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0078b4]/30"
                >
                  <option value="">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select
                  value={selectedProjectType}
                  onChange={(e) => setSelectedProjectType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0078b4]/30"
                >
                  <option value="">All Project Types</option>
                  {projectTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 text-sm text-[#0078b4] hover:text-[#006091] font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}

            {/* Results count */}
            <div className="text-sm text-gray-500 mb-4">
              Showing {filteredIssues.length} of {mockPublicIssues.length} issues
              {activeFilterCount > 0 && " (filtered)"}
            </div>

            {/* Issue list */}
            <div className="space-y-3">
              {filteredIssues.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <div className="font-medium text-gray-600">No issues match your filters</div>
                  <div className="text-sm mt-1">Try adjusting your search or filter criteria</div>
                  <button onClick={clearFilters} className="mt-3 text-sm text-[#0078b4] hover:underline font-medium">
                    Clear all filters
                  </button>
                </div>
              ) : (
                filteredIssues.map((issue) => {
                  const sev = severityConfig[issue.severity];
                  const isExpanded = expandedId === issue.id;

                  return (
                    <div
                      key={issue.id}
                      className={`border rounded-xl transition-all duration-200 ${
                        isExpanded ? "shadow-md border-[#0078b4]/30" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {/* Compact row */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : issue.id)}
                        className="w-full text-left p-4 cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          {/* Upvote count */}
                          <div className="flex flex-col items-center shrink-0 pt-0.5">
                            <div className="text-lg font-bold text-[#006091]">{issue.upvotes}</div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-wide">cited</div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-semibold text-sm text-gray-900 leading-snug">
                                {issue.title}
                              </h3>
                              {issue.verified && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                                  <CheckCircle2 className="h-2.5 w-2.5" />
                                  Verified
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${sev.bg} ${sev.text}`}>
                                {sev.label}
                              </span>
                              <span className="inline-flex items-center rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-mono text-gray-600">
                                Spec {issue.specSection}
                              </span>
                              <span className="inline-flex items-center rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-600">
                                {issue.category}
                              </span>
                              <span className="inline-flex items-center rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-600">
                                {issue.projectType}
                              </span>
                              <span className="text-[10px] text-gray-400 ml-auto shrink-0">
                                {issue.contributorType === "anonymous" ? (
                                  "Anonymous"
                                ) : (
                                  <span className="flex items-center gap-1">
                                    {issue.contributorType === "company" ? (
                                      <Building2 className="h-2.5 w-2.5" />
                                    ) : (
                                      <User className="h-2.5 w-2.5" />
                                    )}
                                    {issue.contributorName}
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 pt-1">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-0 space-y-4 border-t border-gray-100">
                          <div className="pt-4">
                            <p className="text-sm text-gray-700 leading-relaxed">{issue.description}</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="rounded-lg bg-red-50/50 border border-red-100 p-3 space-y-1.5">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-red-700 uppercase tracking-wide">
                                <AlertTriangle className="h-3 w-3" />
                                Root Cause
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed">{issue.rootCause}</p>
                            </div>
                            <div className="rounded-lg bg-emerald-50/50 border border-emerald-100 p-3 space-y-1.5">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                                <CheckCircle2 className="h-3 w-3" />
                                Resolution
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed">{issue.resolution}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm pt-1">
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                              <span className="text-gray-500">Cost impact:</span>
                              <span className="font-semibold">{issue.costImpact}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Clock className="h-3.5 w-3.5 text-gray-400" />
                              <span className="text-gray-500">Schedule:</span>
                              <span className="font-semibold">{issue.scheduleImpactDays} days</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <span className="text-gray-500">CSI:</span>
                              <span className="font-mono font-semibold">{issue.csiCode}</span>
                            </div>
                            <div className="text-gray-400 text-xs ml-auto">
                              Submitted {new Date(issue.dateSubmitted).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <aside className="w-full lg:w-80 shrink-0 space-y-6">
            {/* Top Contributors */}
            <div className="border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-4 w-4 text-[#7cb342]" />
                <h2 className="font-bold text-sm text-[#006091]">Top Contributors</h2>
              </div>
              <div className="space-y-3">
                {topContributors.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-3">
                    <div className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold shrink-0 ${
                      i === 0
                        ? "bg-amber-100 text-amber-700"
                        : i === 1
                          ? "bg-gray-100 text-gray-600"
                          : i === 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-50 text-gray-500"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {c.name}
                      </div>
                      <div className="text-[10px] text-gray-400 flex items-center gap-1">
                        {c.type === "company" ? (
                          <Building2 className="h-2.5 w-2.5" />
                        ) : (
                          <User className="h-2.5 w-2.5" />
                        )}
                        {c.type === "company" ? "Organization" : "Individual"}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-[#006091]">{c.issueCount}</div>
                      <div className="text-[10px] text-gray-400">issues</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories breakdown */}
            <div className="border border-gray-200 rounded-xl p-5">
              <h2 className="font-bold text-sm text-[#006091] mb-4">Issues by Category</h2>
              <div className="space-y-2">
                {categories.map((cat) => {
                  const count = mockPublicIssues.filter((i) => i.category === cat).length;
                  const pct = (count / mockPublicIssues.length) * 100;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        setSelectedCategory(selectedCategory === cat ? "" : cat);
                        setShowFilters(true);
                      }}
                      className={`w-full text-left group ${selectedCategory === cat ? "opacity-100" : "opacity-80 hover:opacity-100"}`}
                    >
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className={`font-medium ${selectedCategory === cat ? "text-[#0078b4]" : "text-gray-700"}`}>
                          {cat}
                        </span>
                        <span className="text-xs text-gray-400">{count}</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: selectedCategory === cat ? "#0078b4" : "#7cb342",
                          }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contribute CTA */}
            <div className="bg-gradient-to-br from-[#006091] to-[#0078b4] rounded-xl p-5 text-white">
              <h2 className="font-bold text-sm mb-2">Contribute Issues</h2>
              <p className="text-xs text-white/70 leading-relaxed mb-4">
                Help the AEC community learn from shared experiences.
                Submit manually, import from a file, or connect your PM system.
              </p>
              <button className="w-full bg-[#7cb342] hover:bg-[#689f38] text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
                Submit an Issue
              </button>
              <button className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors mt-2">
                Import from File
              </button>

              <div className="mt-4 pt-4 border-t border-white/15">
                <div className="text-[10px] uppercase tracking-wider text-white/50 font-semibold mb-3">
                  Connect a PM System
                </div>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2.5 transition-colors text-left group">
                    <div className="flex items-center justify-center h-8 w-8 rounded-md bg-white p-1 shrink-0">
                      <img src="/logos/procore.png" alt="Procore" className="h-full w-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">Procore</div>
                      <div className="text-[10px] text-white/50">Sync issues &amp; observations</div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-white/40 group-hover:text-white/70 shrink-0" />
                  </button>

                  <button className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2.5 transition-colors text-left group">
                    <div className="flex items-center justify-center h-8 w-8 rounded-md bg-white p-1 shrink-0">
                      <img src="/logos/autodesk.ico" alt="Autodesk" className="h-full w-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">Autodesk Forma</div>
                      <div className="text-[10px] text-white/50">Import design issues</div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-white/40 group-hover:text-white/70 shrink-0" />
                  </button>

                  <button className="w-full flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2.5 transition-colors text-left group">
                    <div className="flex items-center justify-center h-8 w-8 rounded-md bg-white p-1 shrink-0">
                      <img src="/logos/trimble.png" alt="Trimble" className="h-full w-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">Trimble ProjectSight</div>
                      <div className="text-[10px] text-white/50">Sync RFIs &amp; field issues</div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-white/40 group-hover:text-white/70 shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="bg-[#006091] text-white mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/cpc-logo.png"
                alt="Construction Progress Coalition"
                className="h-8 w-auto brightness-0 invert"
              />
              <div className="text-xs text-white/60 border-l border-white/20 pl-3">
                Public Insight Protocol
              </div>
            </div>
            <div className="text-xs text-white/50">
              &copy; {new Date().getFullYear()} Construction Progress Coalition. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
