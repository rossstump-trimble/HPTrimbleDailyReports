"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowLeft, Info, Plus, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import ProjectSearchDialog, { type ProjectMode } from "./ProjectSearchDialog";

const subSidebarItems = [
  { id: "general", name: "General" },
  { id: "contract-types", name: "Contract types" },
  { id: "custom-fields", name: "Custom fields" },
  { id: "field-attributes", name: "Field attributes" },
  { id: "nomenclature", name: "Nomenclature" },
  { id: "notifications", name: "Notifications" },
  { id: "reports", name: "Reports" },
  { id: "workflow", name: "Workflow" },
  { id: "default-assignees", name: "Default assignees" },
];

interface CustomField {
  id: string;
  fieldName: string;
  type: string;
  length: number;
  label: string;
  projectIds: string[];
}

const mockCustomFields: CustomField[] = [
  { id: "cf1", fieldName: "ClientReference", type: "Text", length: 50, label: "Client Reference #", projectIds: ["p1", "p4"] },
  { id: "cf2", fieldName: "InsuranceExpiry", type: "Date", length: 0, label: "Insurance Expiry", projectIds: ["p1", "p4", "p9"] },
  { id: "cf3", fieldName: "BondingLimit", type: "Number", length: 12, label: "Bonding Limit", projectIds: [] },
  { id: "cf4", fieldName: "PaymentTerms", type: "List", length: 30, label: "Payment Terms", projectIds: ["p1", "p3", "p5", "p9"] },
  { id: "cf5", fieldName: "ScopeNotes", type: "Multi-line Text", length: 500, label: "Scope Notes", projectIds: [] },
  { id: "cf6", fieldName: "PriorityLevel", type: "List", length: 20, label: "Priority Level", projectIds: ["p4"] },
  { id: "cf7", fieldName: "ExecutedDate", type: "Date", length: 0, label: "Executed Date", projectIds: [] },
  { id: "cf8", fieldName: "RetainagePct", type: "Number", length: 8, label: "Retainage %", projectIds: ["p1", "p9"] },
];

export default function PSSettingsContracts() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("general");

  const [approvedForBudget, setApprovedForBudget] = useState(true);
  const [defaultRules, setDefaultRules] = useState("controlled-total");
  const [storedMaterialRetainage, setStoredMaterialRetainage] = useState("10.00%");
  const [generalWorkRetainage, setGeneralWorkRetainage] = useState("10.00%");

  const [autoIncrement, setAutoIncrement] = useState(true);
  const [numCharacters, setNumCharacters] = useState("3");

  const [sharingAccess, setSharingAccess] = useState("companies-participating");
  const [projectCompanyAccess, setProjectCompanyAccess] = useState(true);

  const [folderPath, setFolderPath] = useState("[[Record_Nomenclature]]Documents");

  return (
    <div className="flex flex-col h-full">
      {/* Page title */}
      <div className="px-6 py-4 border-b border-border bg-background flex-none">
        <h1 className="text-lg font-light text-foreground">
          Portfolio settings - Contracts
        </h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sub-sidebar */}
        <nav className="w-44 border-r border-border bg-background flex-none flex flex-col">
          <ScrollArea className="flex-1">
            <div className="py-2 space-y-0.5">
              {subSidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "block w-full text-left px-4 py-2 text-sm transition-colors",
                    activeTab === item.id
                      ? "text-primary font-medium bg-primary/5 border-l-2 border-primary"
                      : "text-foreground hover:bg-accent/50"
                  )}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </ScrollArea>
          <div className="border-t p-2">
            <Link
              href="/settings/records"
              className="flex items-center px-3 py-2 text-sm text-foreground hover:bg-accent/50 rounded"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span>Back</span>
            </Link>
          </div>
        </nav>

        {/* Main content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "general" ? (
            <ScrollArea className="h-full">
              <div className="max-w-2xl px-8 py-6 space-y-8">
                {/* General section */}
                <section>
                  <h2 className="text-base font-medium text-primary mb-4">General</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Default Approved for budget</Label>
                      <Switch
                        checked={approvedForBudget}
                        onCheckedChange={setApprovedForBudget}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Default Rules</Label>
                      <Select value={defaultRules} onValueChange={setDefaultRules}>
                        <SelectTrigger className="w-48 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="controlled-total">Controlled total</SelectItem>
                          <SelectItem value="uncontrolled">Uncontrolled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Default Stored material retainage amount</Label>
                      <Input
                        value={storedMaterialRetainage}
                        onChange={(e) => setStoredMaterialRetainage(e.target.value)}
                        className="w-32 h-8 text-sm text-right"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Default General work retainage amount</Label>
                      <Input
                        value={generalWorkRetainage}
                        onChange={(e) => setGeneralWorkRetainage(e.target.value)}
                        className="w-32 h-8 text-sm text-right"
                      />
                    </div>
                  </div>
                </section>

                {/* Numbering section */}
                <section>
                  <h2 className="text-base font-medium text-primary mb-4">Numbering</h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="auto-increment"
                        checked={autoIncrement}
                        onCheckedChange={(v) => setAutoIncrement(!!v)}
                      />
                      <Label htmlFor="auto-increment" className="text-sm">
                        Auto Increment Number
                      </Label>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Number of characters</Label>
                      <Input
                        value={numCharacters}
                        onChange={(e) => setNumCharacters(e.target.value)}
                        className="w-20 h-8 text-sm text-center"
                      />
                    </div>
                  </div>
                </section>

                {/* Default record sharing access */}
                <section>
                  <h2 className="text-base font-medium text-primary mb-3">
                    Default record sharing access
                  </h2>
                  <p className="text-xs text-muted-foreground mb-4 max-w-lg leading-relaxed">
                    Sharing with the &apos;entire project&apos; provides all users access to those
                    records, regardless of their involvement. Sharing with &apos;participating
                    companies&apos; grants record access only to those specific companies.
                    Security role permissions will still apply.
                  </p>
                  <RadioGroup
                    value={sharingAccess}
                    onValueChange={setSharingAccess}
                    className="space-y-2 mb-4"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="entire-project" id="entire-project" />
                      <Label htmlFor="entire-project" className="text-sm font-normal">
                        Entire project
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="companies-participating" id="companies-participating" />
                      <Label htmlFor="companies-participating" className="text-sm font-normal">
                        Companies participating on the record
                      </Label>
                    </div>
                  </RadioGroup>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="project-company-access"
                      checked={projectCompanyAccess}
                      onCheckedChange={(v) => setProjectCompanyAccess(!!v)}
                    />
                    <Label htmlFor="project-company-access" className="text-sm font-normal">
                      Project company may always access all Contracts
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-primary cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          When enabled, the project company will have access to all
                          contracts regardless of sharing settings.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </section>

                {/* Quick upload */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-base font-medium text-primary">Quick upload</h2>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-primary cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Configure the default folder path for quick document uploads.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <Label className="text-sm w-24 flex-none">Folder path</Label>
                      <Input
                        value={folderPath}
                        onChange={(e) => setFolderPath(e.target.value)}
                        className="h-8 text-sm flex-1 max-w-xs"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <Label className="text-sm w-24 flex-none text-muted-foreground">
                        Sample
                      </Label>
                      <span className="text-sm text-muted-foreground">
                        Contract Documents
                      </span>
                    </div>
                  </div>
                </section>
              </div>
            </ScrollArea>
          ) : activeTab === "custom-fields" ? (
            <CustomFieldsTab />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              {subSidebarItems.find((i) => i.id === activeTab)?.name} content
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CustomFieldsTab() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [fieldModes, setFieldModes] = useState<Record<string, ProjectMode>>(() => {
    const initial: Record<string, ProjectMode> = {};
    mockCustomFields.forEach((f) => { initial[f.id] = "all"; });
    return initial;
  });

  const [fieldProjects, setFieldProjects] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    mockCustomFields.forEach((f) => { initial[f.id] = []; });
    return initial;
  });

  const [dialogFieldId, setDialogFieldId] = useState<string | null>(null);

  const allSelected =
    mockCustomFields.length > 0 &&
    mockCustomFields.every((f) => selectedIds.has(f.id));

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(mockCustomFields.map((f) => f.id)));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDialogConfirm = (mode: ProjectMode, projectIds: string[]) => {
    if (!dialogFieldId) return;
    setFieldModes((prev) => ({ ...prev, [dialogFieldId]: mode }));
    setFieldProjects((prev) => ({
      ...prev,
      [dialogFieldId]: mode === "specific" ? projectIds : [],
    }));
  };

  const getDisplayText = (fieldId: string): string => {
    const mode = fieldModes[fieldId];
    if (mode === "all") return "All Projects";
    if (mode === "specific") {
      const count = (fieldProjects[fieldId] || []).length;
      return count > 0 ? `${count} selected` : "None";
    }
    return "None";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
        <span className="text-sm font-medium">Custom Fields</span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 text-xs text-primary gap-1">
            <Plus className="h-3.5 w-3.5" />
            ADD
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-primary gap-1">
            <Trash2 className="h-3.5 w-3.5" />
            REMOVE
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4">
        <table className="w-full text-xs [&_th]:border-border/40 [&_td]:border-border/40 dark:[&_th]:border-border dark:[&_td]:border-border">
          <thead className="sticky top-0 bg-background border-b">
            <tr>
              <th className="w-8 px-2 py-2">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              </th>
              <th className="text-left px-3 py-2 font-medium">Field Name</th>
              <th className="text-left px-3 py-2 font-medium">Type</th>
              <th className="text-right px-3 py-2 font-medium">Length</th>
              <th className="text-left px-3 py-2 font-medium">Label</th>
              <th className="text-left px-3 py-2 font-medium">Projects</th>
            </tr>
          </thead>
          <tbody>
            {mockCustomFields.map((field) => {
              const displayText = getDisplayText(field.id);
              return (
                <tr
                  key={field.id}
                  className="border-b hover:bg-accent/50 transition-colors"
                >
                  <td className="px-2 py-1.5">
                    <Checkbox
                      checked={selectedIds.has(field.id)}
                      onCheckedChange={() => toggleOne(field.id)}
                    />
                  </td>
                  <td className="px-3 py-1.5 text-foreground font-medium">
                    {field.fieldName}
                  </td>
                  <td className="px-3 py-1.5 text-foreground">{field.type}</td>
                  <td className="px-3 py-1.5 text-right text-foreground">
                    {field.length > 0 ? field.length : ""}
                  </td>
                  <td className="px-3 py-1.5 text-foreground">
                    {field.label}
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "text-xs",
                        displayText === "None" ? "text-muted-foreground" : "text-foreground"
                      )}>
                        {displayText}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6 flex-none"
                        onClick={() => setDialogFieldId(field.id)}
                      >
                        <Search className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ProjectSearchDialog
        open={dialogFieldId !== null}
        onOpenChange={(open) => { if (!open) setDialogFieldId(null); }}
        mode={dialogFieldId ? (fieldModes[dialogFieldId] || "all") : "all"}
        selectedIds={dialogFieldId ? (fieldProjects[dialogFieldId] || []) : []}
        onConfirm={handleDialogConfirm}
      />
    </div>
  );
}
