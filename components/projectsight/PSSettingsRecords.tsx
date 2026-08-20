"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RecordItem {
  id: string;
  name: string;
  enabled?: boolean;
  path?: string;
}

interface RecordSection {
  id: string;
  title: string;
  items: RecordItem[];
}

const recordSections: RecordSection[] = [
  {
    id: "administration",
    title: "Administration",
    items: [
      { id: "companies", name: "Companies" },
      { id: "projects", name: "Projects" },
      { id: "users", name: "Users" },
    ],
  },
  {
    id: "financials",
    title: "Financials",
    items: [
      { id: "applications-for-payment", name: "Applications for payment" },
      { id: "budget", name: "Budget" },
      { id: "change-order-requests", name: "Change order requests" },
      { id: "contract-invoices", name: "Contract invoices" },
      { id: "contracts", name: "Contracts", enabled: true, path: "/settings/records/contracts" },
      { id: "cost-forecasts", name: "Cost forecasts" },
      { id: "general-invoices", name: "General invoices" },
      { id: "job-costs", name: "Job costs" },
      { id: "potential-change-orders", name: "Potential change orders" },
      { id: "prime-contract-change-orders", name: "Prime contract change orders" },
      { id: "purchase-orders", name: "Purchase orders" },
      { id: "subcontract-change-orders", name: "Subcontract change orders" },
    ],
  },
  {
    id: "records",
    title: "Records",
    items: [
      { id: "action-items", name: "Action items" },
      { id: "checklists", name: "Checklists" },
      { id: "daily-reports", name: "Daily reports" },
      { id: "drawing-sets", name: "Drawing sets" },
      { id: "drawings", name: "Drawings" },
      { id: "field-work-directives", name: "Field work directives" },
      { id: "issues", name: "Issues" },
      { id: "meeting-minutes", name: "Meeting minutes" },
      { id: "notices-to-comply", name: "Notices to comply" },
      { id: "punch-items", name: "Punch items" },
      { id: "rfis", name: "RFIs" },
      { id: "safety-notices", name: "Safety notices" },
      { id: "specification-sets", name: "Specification sets" },
      { id: "specifications", name: "Specifications" },
      { id: "submittal-packages", name: "Submittal packages" },
      { id: "submittals", name: "Submittals" },
      { id: "transmittals", name: "Transmittals" },
    ],
  },
];

export default function PSSettingsRecords() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border bg-background flex-none">
        <h1 className="text-lg font-light text-foreground">
          Portfolio settings - Records
        </h1>
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto px-6 py-4">
          {recordSections.map((section) => (
            <div key={section.id} className="mb-6">
              <div className="bg-muted/50 px-4 py-2 rounded-t">
                <h2 className="text-sm font-semibold text-foreground">
                  {section.title}
                </h2>
              </div>
              <div className="border border-border rounded-b divide-y divide-border">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    disabled={!item.enabled}
                    onClick={() => item.path && router.push(item.path)}
                    className={cn(
                      "flex items-center justify-between w-full px-4 py-2.5 text-sm transition-colors text-left",
                      item.enabled
                        ? "text-primary hover:bg-accent/50 cursor-pointer"
                        : "text-muted-foreground cursor-default"
                    )}
                  >
                    <span>{item.name}</span>
                    <ChevronRight className={cn(
                      "h-4 w-4 flex-none",
                      item.enabled ? "text-muted-foreground" : "text-border"
                    )} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
