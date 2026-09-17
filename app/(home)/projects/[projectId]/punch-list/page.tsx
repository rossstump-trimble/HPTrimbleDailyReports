"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ListTodo,
  Camera,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Building2,
  MapPin,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PunchScanModal } from "@/components/punch/PunchScanModal";
import type { PunchItem, PunchStatus, PunchImportance } from "@/types/punch";

export default function PunchListPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const [items, setItems] = useState<PunchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [importanceFilter, setImportanceFilter] = useState<string>("all");
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/punch/${projectId}/items`);
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setItems(data.items);
      }
    } catch (err) {
      console.error("Failed to load punch items:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleToggleResolve = async (item: PunchItem) => {
    const nextStatus: PunchStatus = item.status === "resolved" ? "open" : "resolved";
    try {
      const res = await fetch(`/api/punch/${projectId}/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              action: nextStatus === "resolved" ? "resolve" : "reinspect",
              targetItemId: item.id,
              notes: `Status toggled to ${nextStatus} via dashboard`,
            },
          ],
        }),
      });
      if (res.ok) {
        fetchItems();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tradeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.locationDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.itemNumber && item.itemNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || item.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesImportance =
      importanceFilter === "all" ||
      item.importance.toLowerCase() === importanceFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesImportance;
  });

  const totalCount = items.length;
  const openCount = items.filter((i) => i.status === "open" || i.status === "reopened").length;
  const resolvedCount = items.filter((i) => i.status === "resolved" || i.status === "closed").length;
  const highPriorityCount = items.filter((i) => i.importance === "high" || i.importance === "urgent").length;

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <ListTodo className="w-6 h-6 text-primary" />
            Punch List & Back-Punch
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Digitize handwritten jobsite inspection sheets and sync directly with ProjectSight.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchItems}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setIsScanModalOpen(true)}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm"
          >
            <Camera className="w-4 h-4" />
            Scan Punch Sheet
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="text-xs font-medium text-muted-foreground">Total Punch Items</div>
          <div className="text-2xl font-bold text-foreground mt-1">{totalCount}</div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Open Defects
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {openCount}
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Resolved / Signed Off
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {resolvedCount}
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <div className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            High / Urgent Priority
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {highPriorityCount}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card border border-border p-3 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search items, locations, trades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 text-xs w-32">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="reopened">Reopened</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Priority:</span>
            <Select value={importanceFilter} onValueChange={setImportanceFilter}>
              <SelectTrigger className="h-9 text-xs w-32">
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Punch Items Table */}
      <div className="border border-border rounded-xl overflow-hidden bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                <th className="py-3 px-4 w-12 text-center">Sign Off</th>
                <th className="py-3 px-4 w-24">Item #</th>
                <th className="py-3 px-4 w-28">Status</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 w-44">Trade Partner</th>
                <th className="py-3 px-4 w-40">Location</th>
                <th className="py-3 px-4 w-24">Priority</th>
                <th className="py-3 px-4 w-28">Reported</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ListTodo className="w-8 h-8 opacity-40" />
                      <p className="font-medium">No punch items found</p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Upload or photograph a handwritten punch sheet from the trailer to extract items with vision OCR.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsScanModalOpen(true)}
                        className="mt-2 gap-1.5"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Scan First Sheet
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isResolved = item.status === "resolved" || item.status === "closed";
                  const isHighPriority = item.importance === "high" || item.importance === "urgent";

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 transition-colors group cursor-pointer"
                    >
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleResolve(item)}
                          className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                            isResolved
                              ? "bg-green-600 border-green-600 text-white"
                              : "border-border hover:border-primary text-transparent"
                          }`}
                          title={isResolved ? "Mark Open" : "Mark Resolved"}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </td>

                      <td className="py-3 px-4 font-mono font-medium text-foreground">
                        {item.itemNumber || item.id.slice(0, 8)}
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={`capitalize text-[11px] font-medium ${
                            isResolved
                              ? "border-green-300 text-green-700 bg-green-50 dark:bg-green-950/40 dark:text-green-300"
                              : "border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300"
                          }`}
                        >
                          {item.status}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 font-medium text-foreground">
                        <div className={isResolved ? "line-through text-muted-foreground" : ""}>
                          {item.description}
                        </div>
                        {item.resolutionNotes && (
                          <div className="text-[10px] text-green-600 dark:text-green-400 mt-0.5">
                            Signed off: {item.resolutionNotes}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
                          <span className="truncate">{item.tradeName}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-muted-foreground">
                        {item.locationDescription && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
                            <span className="truncate">{item.locationDescription}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            isHighPriority
                              ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {item.importance}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                        {item.reportedDate || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Punch Scan Modal */}
      <PunchScanModal
        projectId={projectId}
        open={isScanModalOpen}
        onOpenChange={setIsScanModalOpen}
        onCommitted={fetchItems}
      />
    </div>
  );
}
