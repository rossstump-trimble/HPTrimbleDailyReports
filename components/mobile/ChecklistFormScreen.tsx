"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Plus,
  Save,
  Search,
  Trash2,
  UserPlus,
  X,
  XCircle,
} from "lucide-react";
import { getMockRecords, getMockFormExtras, getAssigneesForRecord } from "@/lib/mobile/mockData";
import { getStatusColor, getRecordTypeConfig } from "@/lib/mobile/recordTypes";
import FieldPickerScreen from "./subforms/FieldPickerScreen";
import LocationPickerScreen from "./subforms/LocationPickerScreen";
import DatePickerScreen from "./subforms/DatePickerScreen";
import AttachmentsSheet from "./subforms/AttachmentsSheet";

// ─── Mock template data ──────────────────────────────────────────────────────

interface TemplateItem {
  id: string;
  type: "yesno" | "text" | "section";
  label: string;
}

interface ChecklistTemplate {
  id: string;
  name: string;
  category: string;
  items: TemplateItem[];
}

const TEMPLATES: ChecklistTemplate[] = [
  // Commissioning
  {
    id: "agitator",    name: "Agitator Inspection",          category: "Commissioning",
    items: [
      { id: "1", type: "text",    label: "Reference Drawings" },
      { id: "2", type: "section", label: "GENERAL" },
      { id: "3", type: "yesno",   label: "Lubrication ports accessible and filled?" },
      { id: "4", type: "yesno",   label: "Drive alignment within tolerance?" },
      { id: "5", type: "yesno",   label: "Seals and packing inspected?" },
      { id: "6", type: "section", label: "INSPECTION" },
      { id: "7", type: "yesno",   label: "No visible cracks or corrosion on shaft?" },
      { id: "8", type: "yesno",   label: "Impeller blades free of damage?" },
    ],
  },
  {
    id: "air-fan",     name: "Air Cooled Fan Inspection",    category: "Commissioning",
    items: [
      { id: "1", type: "text",    label: "Reference Drawings" },
      { id: "2", type: "section", label: "PRE-START" },
      { id: "3", type: "yesno",   label: "Fan blades free of damage?" },
      { id: "4", type: "yesno",   label: "Belt tension correct?" },
      { id: "5", type: "section", label: "INSPECTION" },
      { id: "6", type: "yesno",   label: "Motor nameplate matches spec?" },
      { id: "7", type: "yesno",   label: "Guards installed and secure?" },
    ],
  },
  {
    id: "blower",      name: "Blower Inspection",            category: "Commissioning",
    items: [
      { id: "1", type: "text",    label: "Reference Drawings" },
      { id: "2", type: "section", label: "INSPECTION" },
      { id: "3", type: "yesno",   label: "Inlet filter clean and seated?" },
      { id: "4", type: "yesno",   label: "Discharge piping free of obstructions?" },
      { id: "5", type: "yesno",   label: "Vibration within spec at startup?" },
    ],
  },
  {
    id: "centrifugal", name: "Centrifugal Pump Inspection",  category: "Commissioning",
    items: [
      { id: "1", type: "text",    label: "Reference Drawings" },
      { id: "2", type: "section", label: "PRE-START" },
      { id: "3", type: "yesno",   label: "Alignment verified per coupling spec?" },
      { id: "4", type: "yesno",   label: "Bearing housing lubricated?" },
      { id: "5", type: "yesno",   label: "Mechanical seal installed correctly?" },
      { id: "6", type: "section", label: "INSPECTION" },
      { id: "7", type: "yesno",   label: "No visible leaks on initial startup?" },
      { id: "8", type: "yesno",   label: "Flow and pressure at design point?" },
    ],
  },
  {
    id: "column",      name: "Column Inspection",            category: "Commissioning",
    items: [
      { id: "1", type: "text",    label: "Reference Drawings" },
      { id: "2", type: "section", label: "INSPECTION" },
      { id: "3", type: "yesno",   label: "Check column for safe entry" },
      { id: "4", type: "yesno",   label: "Check per vendor's drawing, specification and instructions:" },
      { id: "5", type: "yesno",   label: "Verify internals (trays/packing) installed per design" },
      { id: "6", type: "yesno",   label: "All manways sealed and bolted correctly?" },
      { id: "7", type: "yesno",   label: "Nozzles clear and per P&ID?" },
    ],
  },
  {
    id: "drum",        name: "Drum Inspection",              category: "Commissioning",
    items: [
      { id: "1", type: "text",    label: "Reference Drawings" },
      { id: "2", type: "section", label: "INSPECTION" },
      { id: "3", type: "yesno",   label: "Internal surfaces free of scale/debris?" },
      { id: "4", type: "yesno",   label: "Demister pad installed and seated?" },
      { id: "5", type: "yesno",   label: "Level gauges functional?" },
    ],
  },
  {
    id: "fired-heater",name: "Fired Heater Inspection",     category: "Commissioning",
    items: [
      { id: "1", type: "text",    label: "Reference Drawings" },
      { id: "2", type: "section", label: "PRE-LIGHT-OFF" },
      { id: "3", type: "yesno",   label: "Burner management system tested?" },
      { id: "4", type: "yesno",   label: "All thermocouples calibrated?" },
      { id: "5", type: "yesno",   label: "Refractory dried per schedule?" },
    ],
  },
  {
    id: "packed-col",  name: "Packed Column Inspection",    category: "Commissioning",
    items: [
      { id: "1", type: "text",    label: "Reference Drawings" },
      { id: "2", type: "section", label: "INSPECTION" },
      { id: "3", type: "yesno",   label: "Packing type and quantity verified?" },
      { id: "4", type: "yesno",   label: "Liquid distributors level and free of blockage?" },
    ],
  },
  {
    id: "reactor",     name: "Reactor Inspection",          category: "Commissioning",
    items: [
      { id: "1", type: "text",    label: "Reference Drawings" },
      { id: "2", type: "section", label: "INSPECTION" },
      { id: "3", type: "yesno",   label: "Catalyst loaded per procedure?" },
      { id: "4", type: "yesno",   label: "Inlet/outlet screens installed?" },
      { id: "5", type: "yesno",   label: "Shell and tube hydrotested?" },
    ],
  },
  {
    id: "steam-turb",  name: "Steam Turbine Inspection",    category: "Commissioning",
    items: [
      { id: "1", type: "text",    label: "Reference Drawings" },
      { id: "2", type: "section", label: "PRE-START" },
      { id: "3", type: "yesno",   label: "Oil flush completed to spec?" },
      { id: "4", type: "yesno",   label: "Governor calibrated and tested?" },
      { id: "5", type: "yesno",   label: "Overspeed trip verified?" },
    ],
  },
  // Other
  {
    id: "other-1",     name: "General Walkthrough",         category: "Other",
    items: [
      { id: "1", type: "section", label: "GENERAL" },
      { id: "2", type: "yesno",   label: "Area is clean and organized?" },
      { id: "3", type: "yesno",   label: "No visible hazards present?" },
    ],
  },
  {
    id: "other-2",     name: "Closeout Checklist",          category: "Other",
    items: [
      { id: "1", type: "section", label: "CLOSEOUT" },
      { id: "2", type: "yesno",   label: "All punch items resolved?" },
      { id: "3", type: "yesno",   label: "As-builts submitted?" },
      { id: "4", type: "yesno",   label: "O&M manuals delivered?" },
    ],
  },
  // QA/QC
  { id: "qa-1", name: "Concrete Pour Inspection",   category: "QA/QC", items: [
    { id: "1", type: "section", label: "PRE-POUR" },
    { id: "2", type: "yesno",  label: "Formwork inspected and approved?" },
    { id: "3", type: "yesno",  label: "Rebar per structural drawings?" },
    { id: "4", type: "yesno",  label: "Embedments positioned correctly?" },
    { id: "5", type: "section", label: "POUR" },
    { id: "6", type: "yesno",  label: "Slump test within spec?" },
    { id: "7", type: "yesno",  label: "Air entrainment acceptable?" },
  ]},
  { id: "qa-2", name: "Weld Visual Inspection",     category: "QA/QC", items: [
    { id: "1", type: "section", label: "INSPECTION" },
    { id: "2", type: "yesno",  label: "Welder qualified per WPS?" },
    { id: "3", type: "yesno",  label: "No visible porosity or cracks?" },
    { id: "4", type: "yesno",  label: "Dimensions match drawing?" },
  ]},
  { id: "qa-3", name: "Fireproofing Inspection",    category: "QA/QC", items: [
    { id: "1", type: "text",   label: "Reference Document" },
    { id: "2", type: "section", label: "INSPECTION" },
    { id: "3", type: "yesno",  label: "Thickness meets minimum spec?" },
    { id: "4", type: "yesno",  label: "Adhesion satisfactory?" },
  ]},
  { id: "qa-4", name: "Coating Inspection",         category: "QA/QC", items: [
    { id: "1", type: "section", label: "INSPECTION" },
    { id: "2", type: "yesno",  label: "Surface preparation meets SSPC standard?" },
    { id: "3", type: "yesno",  label: "DFT readings within spec?" },
    { id: "4", type: "yesno",  label: "Holiday test passed?" },
  ]},
  { id: "qa-5", name: "Hydrostatic Test",           category: "QA/QC", items: [
    { id: "1", type: "section", label: "PRE-TEST" },
    { id: "2", type: "yesno",  label: "Test pressure verified?" },
    { id: "3", type: "yesno",  label: "Gauges calibrated?" },
    { id: "4", type: "section", label: "TEST" },
    { id: "5", type: "yesno",  label: "Held pressure for specified duration?" },
    { id: "6", type: "yesno",  label: "No leaks observed?" },
  ]},
  { id: "qa-6", name: "Pre-pour Reinforcing Steel", category: "QA/QC", items: [
    { id: "1", type: "section", label: "INSPECTION" },
    { id: "2", type: "yesno",  label: "Bar size and spacing match drawings?" },
    { id: "3", type: "yesno",  label: "Lap splices per structural schedule?" },
    { id: "4", type: "yesno",  label: "Concrete cover maintained with chairs?" },
  ]},
  // Safety
  { id: "safety-1", name: "Daily Safety Walkthrough", category: "Safety", items: [
    { id: "1", type: "section", label: "HOUSEKEEPING" },
    { id: "2", type: "yesno",  label: "Walkways and aisles clear?" },
    { id: "3", type: "yesno",  label: "Waste properly disposed?" },
    { id: "4", type: "section", label: "PPE" },
    { id: "5", type: "yesno",  label: "All workers in hard hats and vests?" },
    { id: "6", type: "yesno",  label: "Safety glasses worn in designated areas?" },
  ]},
  { id: "safety-2", name: "Fall Protection Inspection", category: "Safety", items: [
    { id: "1", type: "section", label: "INSPECTION" },
    { id: "2", type: "yesno",  label: "Guardrails at all open edges above 6 ft?" },
    { id: "3", type: "yesno",  label: "Harness inspections current?" },
    { id: "4", type: "yesno",  label: "Anchorage points certified?" },
  ]},
  { id: "safety-3", name: "Scaffold Inspection",     category: "Safety", items: [
    { id: "1", type: "section", label: "INSPECTION" },
    { id: "2", type: "yesno",  label: "Base plates and mudsills in place?" },
    { id: "3", type: "yesno",  label: "All bracing secure?" },
    { id: "4", type: "yesno",  label: "Planking fully decked?" },
    { id: "5", type: "yesno",  label: "Access ladder in good condition?" },
  ]},
];

// Group templates by category
const TEMPLATE_GROUPS = TEMPLATES.reduce<Record<string, ChecklistTemplate[]>>((acc, t) => {
  if (!acc[t.category]) acc[t.category] = [];
  acc[t.category].push(t);
  return acc;
}, {});

// ─── Item response state ─────────────────────────────────────────────────────

type YesNoNA = "yes" | "no" | "na" | null;

interface ItemState {
  response: YesNoNA;
  textValue: string;
  assigneeCount: number;
  commentCount: number;
  attachmentCount: number;
  photos?: string[];
}

// Construction jobsite photo pool
const JOBSITE_PHOTOS = [
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&h=150&fit=crop", // workers on scaffold
  "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=200&h=150&fit=crop", // building under construction
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=150&fit=crop",   // steel framing
  "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=200&h=150&fit=crop", // concrete pour
  "https://images.unsplash.com/photo-1567954970774-58d6aa6c50dc?w=200&h=150&fit=crop", // worker close-up
  "https://images.unsplash.com/photo-1516937941344-00b4e0337589?w=200&h=150&fit=crop", // scaffolding
  "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=200&h=150&fit=crop", // building exterior
  "https://images.unsplash.com/photo-1573599852326-2d4da0bbe613?w=200&h=150&fit=crop", // construction detail
];

// Sample data for existing (non-new) checklists
const SAMPLE_ITEM_STATES: Record<string, ItemState> = {
  "1": { response: null, textValue: "WCO1-A2.01 Rev C", assigneeCount: 0, commentCount: 0, attachmentCount: 0 },
  "3": {
    response: "yes",
    textValue: "",
    assigneeCount: 1,
    commentCount: 1,
    attachmentCount: 1,
    photos: [JOBSITE_PHOTOS[0]],
  },
  "4": { response: "yes", textValue: "", assigneeCount: 1, commentCount: 0, attachmentCount: 0 },
  "5": {
    response: "no",
    textValue: "",
    assigneeCount: 1,
    commentCount: 2,
    attachmentCount: 2,
    photos: [JOBSITE_PHOTOS[2], JOBSITE_PHOTOS[3]],
  },
  "6": { response: "yes", textValue: "", assigneeCount: 0, commentCount: 1, attachmentCount: 0 },
  "7": { response: null,  textValue: "", assigneeCount: 0, commentCount: 0, attachmentCount: 0 },
};

// ─── Sub-screens ─────────────────────────────────────────────────────────────

type SubScreen = "status" | "location" | "due-date" | "approvals" | "approve";

// ─── Template Selector ───────────────────────────────────────────────────────

function TemplateSelector({
  onSelect,
  onCancel,
}: {
  onSelect: (template: ChecklistTemplate) => void;
  onCancel: () => void;
}) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<string | null>(null);

  const filteredGroups = Object.entries(TEMPLATE_GROUPS).map(([cat, items]) => ({
    cat,
    items: items.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase())),
  })).filter(g => g.items.length > 0);

  const selectedTemplate = TEMPLATES.find(t => t.id === selected);

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-gray-100 dark:bg-gray-950">
      <header className="flex items-center px-3 py-3 flex-none gap-3" style={{ backgroundColor: "#1b3a5c" }}>
        <button onClick={onCancel} className="text-white p-1"><X size={20} /></button>
        <h1 className="flex-1 text-white font-semibold text-base">Select Template</h1>
        <button
          className={`text-sm font-semibold px-1 ${selectedTemplate ? "text-white" : "text-white/30"}`}
          onClick={() => selectedTemplate && onSelect(selectedTemplate)}
          disabled={!selectedTemplate}
        >
          Add
        </button>
      </header>

      {/* Search */}
      <div className="px-3 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-none">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2">
          <Search size={15} className="text-gray-400 dark:text-gray-500 flex-none" />
          <input
            className="flex-1 text-sm bg-transparent focus:outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredGroups.map(({ cat, items }) => {
          const isOpen = !!expanded[cat];
          return (
            <div key={cat} className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
              {/* Group header */}
              <button
                className="w-full flex items-center gap-3 px-4 py-4 text-left"
                onClick={() => setExpanded(e => ({ ...e, [cat]: !e[cat] }))}
              >
                {isOpen
                  ? <ChevronUp size={18} className="text-gray-400 dark:text-gray-500 flex-none" />
                  : <ChevronDown size={18} className="text-gray-400 dark:text-gray-500 flex-none" />}
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {cat} ({items.length})
                </span>
              </button>

              {/* Items */}
              {isOpen && items.map(t => (
                <button
                  key={t.id}
                  className="w-full flex items-center justify-between px-6 py-3.5 border-t border-gray-100 dark:border-gray-800 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => setSelected(t.id === selected ? null : t.id)}
                >
                  <span className="text-sm text-gray-800 dark:text-gray-100">{t.name}</span>
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-none ${selected === t.id ? "bg-blue-600 border-blue-600" : "border-gray-300 dark:border-gray-600"}`}>
                    {selected === t.id && (
                      <svg viewBox="0 0 12 12" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="2 6 5 9 10 3" />
                      </svg>
                    )}
                  </span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Checklist Item ──────────────────────────────────────────────────────────

function ChecklistItemRow({
  item,
  state,
  onChange,
}: {
  item: TemplateItem;
  state: ItemState;
  onChange: (s: ItemState) => void;
}) {
  if (item.type === "section") {
    return (
      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t border-b border-gray-200 dark:border-gray-700">
        <span className="text-xs font-semibold tracking-wider text-gray-500 dark:text-gray-400 uppercase">{item.label}</span>
      </div>
    );
  }

  const setResponse = (r: YesNoNA) => onChange({ ...state, response: r });

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      {item.type === "text" && (
        <div className="px-4 pt-4 pb-2">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">{item.label}</p>
          <input
            className="w-full border border-gray-200 dark:border-gray-700 rounded px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-transparent focus:outline-none focus:border-blue-400"
            placeholder="Enter text..."
            value={state.textValue}
            onChange={e => onChange({ ...state, textValue: e.target.value })}
          />
        </div>
      )}

      {/* Yes/No/N/A row */}
      <div className="px-4 py-2">
        {item.type === "yesno" && (
          <p className="text-sm text-gray-800 dark:text-gray-100 mb-2">{item.label}</p>
        )}

        {/* Photo thumbnails */}
        {state.photos && state.photos.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {state.photos.map((src, i) => (
              <div key={i} className="w-24 h-20 rounded overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex-none">
                <img src={src} alt="Attachment" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Counts */}
        {(state.assigneeCount > 0 || state.commentCount > 0 || state.attachmentCount > 0) && (
          <div className="flex items-center gap-3 mb-2">
            {state.assigneeCount > 0 && (
              <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                {state.assigneeCount} Assignee{state.assigneeCount > 1 ? "s" : ""}
              </button>
            )}
            {state.commentCount > 0 && (
              <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                {state.commentCount} Comment{state.commentCount > 1 ? "s" : ""}
              </button>
            )}
            {state.attachmentCount > 0 && (
              <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                {state.attachmentCount} Attachment{state.attachmentCount > 1 ? "s" : ""}
              </button>
            )}
          </div>
        )}

        {/* Toggle bar */}
        <div className="flex border border-gray-300 dark:border-gray-700 rounded overflow-hidden mb-2">
          {(["yes", "no", "na"] as YesNoNA[]).map((opt) => {
            const active = state.response === opt;
            const label = opt === "yes" ? "✓ Yes" : opt === "no" ? "✕ No" : "N/A";
            return (
              <button
                key={opt}
                onClick={() => setResponse(active ? null : opt)}
                className={`flex-1 py-1.5 text-sm font-medium border-r last:border-r-0 border-gray-300 dark:border-gray-700 transition-colors ${
                  active ? "bg-gray-800 text-white" : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-4">
          <button
            className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={() => onChange({ ...state, assigneeCount: state.assigneeCount + 1 })}
          >
            <UserPlus size={14} /> Assign
          </button>
          <button
            className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={() => onChange({ ...state, commentCount: state.commentCount + 1 })}
          >
            <MessageSquare size={14} /> Comments
          </button>
          <button
            className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={() => {
              const current = state.photos ?? [];
              const next = JOBSITE_PHOTOS[current.length % JOBSITE_PHOTOS.length];
              onChange({ ...state, photos: [...current, next], attachmentCount: state.attachmentCount + 1 });
            }}
          >
            <Camera size={14} /> Photos
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Approvals screen ────────────────────────────────────────────────────────

interface Approver {
  id: string;
  name: string;
  role: string;
  status: "Pending" | "Approved" | "Rejected";
  photoUrl: string;
}

function ApprovalsScreen({
  approvers,
  onBack,
  onAdd,
  onTapApprover,
}: {
  approvers: Approver[];
  onBack: () => void;
  onAdd: () => void;
  onTapApprover: (a: Approver) => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-gray-100 dark:bg-gray-950">
      <header className="flex items-center px-3 py-3 flex-none" style={{ backgroundColor: "#1b3a5c" }}>
        <button onClick={onBack} className="text-white p-1 mr-2"><ChevronRight size={20} className="rotate-180" /></button>
        <h1 className="flex-1 text-white font-semibold text-base">Approvals</h1>
        <button onClick={onAdd} className="text-white p-1"><Plus size={20} /></button>
      </header>
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-3 pb-1">
          <span className="text-xs font-semibold tracking-wider text-gray-500 dark:text-gray-400">APPROVERS</span>
        </div>
        {["Pending", "Approved", "Rejected"].map(group => {
          const grouped = approvers.filter(a => a.status === group);
          if (!grouped.length) return null;
          return (
            <div key={group} className="bg-white dark:bg-gray-900 border-t border-b border-gray-200 dark:border-gray-800 mb-3">
              <div className="px-4 py-1.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{group.toUpperCase()}</span>
              </div>
              {grouped.map(a => (
                <button
                  key={a.id}
                  onClick={() => onTapApprover(a)}
                  className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-none">
                    <img src={a.photoUrl} alt={a.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{a.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{a.role}</p>
                  </div>
                </button>
              ))}
            </div>
          );
        })}
        {!approvers.length && (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center mt-12">No approvers added yet.</p>
        )}
      </div>
    </div>
  );
}

// ─── Approve screen ──────────────────────────────────────────────────────────

function ApproveScreen({
  approver,
  onBack,
  onDelete,
}: {
  approver: Approver;
  onBack: () => void;
  onDelete: () => void;
}) {
  const [status, setStatus] = useState(approver.status);
  const [signed, setSigned] = useState(false);
  const [comment, setComment] = useState("");

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-gray-100 dark:bg-gray-950">
      <header className="flex items-center px-3 py-3 flex-none" style={{ backgroundColor: "#1b3a5c" }}>
        <button onClick={onBack} className="text-white p-1 mr-2"><ChevronRight size={20} className="rotate-180" /></button>
        <h1 className="flex-1 text-white font-semibold text-base">Approve</h1>
        <button onClick={onDelete} className="text-white p-1 mr-2"><Trash2 size={18} /></button>
        <button onClick={onBack} className="text-white text-sm font-semibold">Done</button>
      </header>
      <div className="flex-1 overflow-y-auto">
        {/* Approver identity */}
        <div className="bg-white dark:bg-gray-900 px-4 py-4 flex items-center gap-3 border-b border-gray-200 dark:border-gray-800">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-none">
            <img src={approver.photoUrl} alt={approver.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{approver.name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{approver.role}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 mt-3 border-t border-b border-gray-200 dark:border-gray-800">
          {/* Status */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm text-gray-800 dark:text-gray-100">Status</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{status}</span>
              <span className="w-4 h-4 rounded-full flex-none" style={{ backgroundColor: status === "Approved" ? "#16a34a" : status === "Rejected" ? "#dc2626" : "#9ca3af" }} />
              <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
            </div>
          </div>
          {/* Approved on */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm text-gray-800 dark:text-gray-100">Approved on</span>
            <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
          </div>
          {/* Signature */}
          <div className="px-4 pt-3.5 pb-4">
            <div className="flex items-center gap-1 mb-2">
              <span className="text-sm text-gray-800 dark:text-gray-100">Signature</span>
              <span className="text-red-500 text-sm">*</span>
            </div>
            <div
              className="border border-gray-300 dark:border-gray-700 rounded-lg h-28 flex items-center justify-center cursor-pointer bg-white dark:bg-gray-900"
              onClick={() => setSigned(true)}
            >
              {signed ? (
                <svg viewBox="0 0 200 60" className="w-48 h-12">
                  <path d="M10,40 Q40,10 70,35 Q100,60 130,25 Q160,0 190,30" fill="none" stroke="#1b3a5c" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              ) : (
                <span className="text-sm text-blue-500 dark:text-blue-400">Tap to sign</span>
              )}
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="bg-white dark:bg-gray-900 mt-3 border-t border-b border-gray-200 dark:border-gray-800 px-4 py-4">
          <p className="text-sm text-gray-800 dark:text-gray-100 mb-2">Comments</p>
          <input
            className="w-full text-sm text-gray-700 dark:text-gray-200 bg-transparent focus:outline-none placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Type something..."
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

// ─── More menu sheet ─────────────────────────────────────────────────────────

function MoreMenuSheet({ onClose, onAddApprover }: { onClose: () => void; onAddApprover: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true))); }, []);
  const handleClose = () => { setVisible(false); setTimeout(onClose, 250); };

  const items = [
    { icon: <Copy size={20} className="text-gray-600 dark:text-gray-300 flex-none" />, label: "Copy", action: handleClose },
    { icon: <UserPlus size={20} className="text-gray-600 dark:text-gray-300 flex-none" />, label: "Add Approver", action: () => { setVisible(false); setTimeout(onAddApprover, 250); } },
    {
      icon: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600 dark:text-gray-300 flex-none">
          <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
      ),
      label: "Add Checklist item",
      action: handleClose,
    },
  ];

  return (
    <>
      <div
        className="absolute inset-0 z-40 bg-black/40 transition-opacity duration-250"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={handleClose}
      />
      <div
        className="absolute bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 rounded-t-2xl overflow-hidden transition-transform duration-250"
        style={{ transform: visible ? "translateY(0)" : "translateY(100%)" }}
      >
        <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
          {items.map(item => (
            <button
              key={item.label}
              onClick={item.action}
              className="flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-800"
            >
              {item.icon}
              <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{item.label}</span>
            </button>
          ))}
          <button onClick={handleClose} className="flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-800">
            <XCircle size={20} className="text-gray-500 dark:text-gray-400 flex-none" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Cancel</span>
          </button>
        </div>
      </div>
    </>
  );
}

// ─── ChecklistFormScreen ─────────────────────────────────────────────────────

interface Props {
  projectId: string;
  recordId: string;
}

export default function ChecklistFormScreen({ projectId, recordId }: Props) {
  const router = useRouter();
  const isNew = recordId === "new";
  const config = getRecordTypeConfig("checklists");

  const records = getMockRecords("checklists");
  const record = isNew ? null : (records.find(r => r.id === recordId) ?? records[0]);
  const extras = isNew ? null : getMockFormExtras(recordId);

  // Template selection
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(
    isNew ? null : TEMPLATES.find(t => t.id === "column") ?? null
  );

  // Top-level form state
  const [status,   setStatus]   = useState(isNew ? "IN PROGRESS" : record!.status);
  const [location, setLocation] = useState(isNew ? "" : record!.location ?? "");
  const [subject,  setSubject]  = useState("");
  const [unitNo,   setUnitNo]   = useState("001");
  const [showAttachments, setShowAttachments] = useState(false);

  // Sub-screen
  const [subScreen, setSubScreen] = useState<SubScreen | null>(null);
  const [subVisible, setSubVisible] = useState(false);

  const openSub = useCallback((s: SubScreen) => {
    setSubScreen(s); requestAnimationFrame(() => requestAnimationFrame(() => setSubVisible(true)));
  }, []);
  const closeSub = useCallback(() => {
    setSubVisible(false); setTimeout(() => setSubScreen(null), 220);
  }, []);

  // Checklist items state
  const [itemStates, setItemStates] = useState<Record<string, ItemState>>(isNew ? {} : SAMPLE_ITEM_STATES);
  const getItemState = (id: string): ItemState =>
    itemStates[id] ?? { response: null, textValue: "", assigneeCount: 0, commentCount: 0, attachmentCount: 0 };
  const setItemState = (id: string, s: ItemState) => setItemStates(prev => ({ ...prev, [id]: s }));

  // More menu & approvals
  const [showMore, setShowMore] = useState(false);
  const [approvers, setApprovers] = useState<Approver[]>([
    { id: "jl", name: "Jesse Lavine", role: "Project Manager", status: "Pending", photoUrl: "https://i.pravatar.cc/80?img=11" },
  ]);
  const [activeApprover, setActiveApprover] = useState<Approver | null>(null);

  const statusColor = getStatusColor(config, status);
  const statusOptions = config.statuses.map(s => ({ label: s, value: s, color: getStatusColor(config, s) }));

  // If new and no template selected, show template selector
  if (isNew && !selectedTemplate) {
    return (
      <TemplateSelector
        onSelect={t => setSelectedTemplate(t)}
        onCancel={() => router.back()}
      />
    );
  }

  const template = selectedTemplate ?? TEMPLATES[0];

  return (
    <div className="flex flex-col flex-1 bg-gray-100 dark:bg-gray-950 overflow-hidden relative">
      {/* Header */}
      <header className="flex items-center px-3 py-3 flex-none gap-2" style={{ backgroundColor: "#1b3a5c" }}>
        <button onClick={() => router.back()} className="text-white p-1"><X size={20} /></button>
        <h1 className="flex-1 text-white font-semibold text-base">Checklist</h1>
        <button className="text-white p-1 opacity-80"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg></button>
        <button className="text-white p-1 opacity-80"><Save size={20} /></button>
        <button className="text-white p-1 opacity-80" onClick={() => setShowMore(true)}><MoreVertical size={20} /></button>
      </header>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto min-h-0">

        {/* Template title card */}
        <div className="bg-white dark:bg-gray-900 px-4 pt-4 pb-2 mb-0 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-blue-700 dark:text-blue-400">{template.name}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{template.category}</p>
        </div>

        {/* Core fields card */}
        <div className="bg-white dark:bg-gray-900 mb-2 border-t border-gray-100 dark:border-gray-800">
          {/* Number */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm text-gray-800 dark:text-gray-100">Number</span>
            <span className="text-sm text-gray-400 dark:text-gray-500">{isNew ? "–" : record!.number}</span>
          </div>

          {/* Status */}
          <button onClick={() => openSub("status")} className="w-full flex items-center px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
            <span className="text-sm text-gray-800 dark:text-gray-100 flex-1 text-left">Status</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{status.charAt(0) + status.slice(1).toLowerCase()}</span>
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: statusColor }} />
              <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
            </div>
          </button>

          {/* Revision */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm text-gray-800 dark:text-gray-100">Revision</span>
            <span className="text-sm text-gray-400 dark:text-gray-500">01</span>
          </div>

          {/* Subject */}
          <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-800 dark:text-gray-100 mb-1">Subject</p>
            <input
              className="w-full text-sm text-gray-700 dark:text-gray-200 bg-transparent placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none"
              placeholder="Enter Subject..."
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />
          </div>

          {/* Location */}
          <button onClick={() => openSub("location")} className="w-full flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
            <span className="text-sm text-gray-800 dark:text-gray-100">Location</span>
            <div className="flex items-center gap-2">
              {location && <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[140px]">{location.split("/").pop()}</span>}
              <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
            </div>
          </button>

          {/* CC */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
            <span className="text-sm text-gray-800 dark:text-gray-100">CC</span>
            <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
          </div>

          {/* References */}
          <div className="pt-3.5 pb-3">
            <div className="flex items-center justify-between px-4 mb-2">
              <span className="text-sm text-gray-800 dark:text-gray-100">References</span>
              {extras && extras.referencesCount > 0 && (
                <div className="flex items-center gap-1">
                  <Paperclip size={13} className="text-blue-400 dark:text-blue-300" />
                  <span className="text-sm text-blue-400 dark:text-blue-300">{extras.referencesCount}</span>
                </div>
              )}
            </div>
            <div className="flex items-center pl-4">
              <div className="flex-1" />
              <button
                onClick={() => setShowAttachments(true)}
                className="w-14 h-16 rounded-l-xl text-white flex items-center justify-center shadow-sm"
                style={{ backgroundColor: "#1b3a5c" }}
              >
                <Plus size={22} />
              </button>
            </div>
          </div>

          {/* Records */}
          <div className="flex items-center justify-between px-4 py-3.5 border-t border-gray-100 dark:border-gray-800">
            <span className="text-sm text-gray-800 dark:text-gray-100">Records</span>
            <Plus size={18} className="text-gray-400 dark:text-gray-500" />
          </div>

          {/* Web links */}
          <div className="flex items-center justify-between px-4 py-3.5 border-t border-gray-100 dark:border-gray-800">
            <span className="text-sm text-gray-800 dark:text-gray-100">Web links</span>
            <Plus size={18} className="text-gray-400 dark:text-gray-500" />
          </div>
        </div>

        {/* GENERAL section with Unit/Item No. */}
        <div>
          <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800">
            <span className="text-xs font-semibold tracking-wider text-gray-500 dark:text-gray-400">GENERAL</span>
          </div>
          <div className="bg-white dark:bg-gray-900 border-t border-b border-gray-200 dark:border-gray-800 px-4 py-3.5 mb-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Unit/Item No.</p>
            <input
              className="text-sm text-gray-800 dark:text-gray-100 bg-transparent focus:outline-none w-full"
              value={unitNo}
              onChange={e => setUnitNo(e.target.value)}
            />
          </div>
        </div>

        {/* Checklist items */}
        {template.items.map((item) => (
          <ChecklistItemRow
            key={item.id}
            item={item}
            state={getItemState(item.id)}
            onChange={s => setItemState(item.id, s)}
          />
        ))}

        <div className="h-6" />
      </div>

      {/* Sub-screen overlay */}
      {subScreen && (
        <div
          className="absolute inset-0 z-10"
          style={{ transform: subVisible ? "translateX(0)" : "translateX(100%)", transition: "transform 0.22s cubic-bezier(0.4,0,0.2,1)" }}
        >
          {subScreen === "status" && (
            <FieldPickerScreen title="Status" options={statusOptions} value={status} onSelect={v => { setStatus(v); closeSub(); }} onBack={closeSub} />
          )}
          {subScreen === "location" && (
            <LocationPickerScreen value={location} onSelect={v => { setLocation(v); closeSub(); }} onBack={closeSub} />
          )}
          {subScreen === "approvals" && (
            <ApprovalsScreen
              approvers={approvers}
              onBack={closeSub}
              onAdd={() => {
                setApprovers(prev => [...prev, {
                  id: `a${prev.length + 1}`,
                  name: "Frank Ochoa",
                  role: "Superintendent",
                  status: "Pending",
                  photoUrl: "https://i.pravatar.cc/80?img=15",
                }]);
              }}
              onTapApprover={a => { setActiveApprover(a); }}
            />
          )}
        </div>
      )}

      {/* Approver detail overlay */}
      {activeApprover && subScreen === "approvals" && (
        <ApproveScreen
          approver={activeApprover}
          onBack={() => setActiveApprover(null)}
          onDelete={() => { setApprovers(prev => prev.filter(a => a.id !== activeApprover.id)); setActiveApprover(null); }}
        />
      )}

      {/* More menu */}
      {showMore && (
        <MoreMenuSheet onClose={() => setShowMore(false)} onAddApprover={() => { setShowMore(false); openSub("approvals"); }} />
      )}

      {/* Attachments sheet */}
      {showAttachments && <AttachmentsSheet onClose={() => setShowAttachments(false)} />}
    </div>
  );
}
