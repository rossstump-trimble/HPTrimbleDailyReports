"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Copy, MapPin, Paperclip, Plus, Save, Send, X } from "lucide-react";
import {
  getMockRecords,
  getMockFormExtras,
  getAssigneesForRecord,
  MOCK_COMPANIES,
  type RecordComment,
  type Assignee,
} from "@/lib/mobile/mockData";
import { getRecordTypeConfig, getStatusColor, type FormField } from "@/lib/mobile/recordTypes";
import type { PickerOption } from "./subforms/FieldPickerScreen";
import FieldPickerScreen from "./subforms/FieldPickerScreen";
import LocationPickerScreen from "./subforms/LocationPickerScreen";
import ContactListScreen from "./subforms/ContactListScreen";
import DescriptionEditorScreen from "./subforms/DescriptionEditorScreen";
import DatePickerScreen from "./subforms/DatePickerScreen";
import AttachmentsSheet from "./subforms/AttachmentsSheet";
import CommentsScreen from "./subforms/CommentsScreen";

// ─── Types ────────────────────────────────────────────────────────────────────

type SubScreenKind =
  | "status"
  | "subject"
  | "description"
  | "location"
  | "due-date"
  | "step-due"
  | "company"
  | "assigned-to"
  | "cc"
  | "type"
  | "importance"
  | "impact"
  | "discipline"
  | "response"
  | "question"
  | "comments";

const DRAWING_IMAGES = [
  "/images/drawings/drawing-a.png",
  "/images/drawings/drawing-b.png",
  "/images/drawings/drawing-c.png",
  "/images/drawings/drawing-d.png",
];

// ─── Per-type lookup options ───────────────────────────────────────────────────

const TYPE_OPTIONS: Record<string, string[]> = {
  "punch-items":           ["None", "Internal Punch", "Owner Punch", "Work Completion"],
  rfis:                    ["None", "Architecture", "Structural", "MEP", "Civil"],
  checklists:              ["None", "Quality", "Safety", "Pre-pour", "Closeout"],
  "action-items":          ["None", "Schedule Task", "Design Review", "Procurement", "Other"],
  submittals:              ["None", "Shop Drawing", "Product Data", "Sample", "Certification"],
  "field-work-directives": ["None", "Cost Control Item", "Design Change", "Owner Directive", "Other"],
  issues:                  ["None", "Design", "Construction", "Safety", "Quality", "Administrative"],
  "notices-to-comply":     ["None", "Wrong Location", "Wrong Material", "Missing Work", "Non-Conformance", "Safety Violation", "Other"],
  "safety-notices":        ["None", "Hearing Protection", "Eye Protection", "Fall Protection", "Hazard Communication", "Electrical Safety", "Near Miss", "First Aid", "Other"],
  default:                 ["None", "Standard", "Urgent", "Informational"],
};

const IMPORTANCE_OPTIONS  = ["None", "Low", "Normal", "High", "Urgent"];
const IMPACT_OPTIONS      = ["None", "Low", "Medium", "High", "Critical"];
const RESPONSE_OPTIONS    = ["None", "Draft", "Preliminary", "Final"];
const DISCIPLINE_OPTIONS  = ["None", "Architecture", "Structural", "MEP", "Civil", "Plumbing", "Fire Protection", "Landscape"];

// ─── Component ────────────────────────────────────────────────────────────────

interface RecordFormScreenProps {
  projectId: string;
  recordType: string;
  recordId: string;
}

export default function RecordFormScreen({
  projectId,
  recordType,
  recordId,
}: RecordFormScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = recordId === "new";

  const config = getRecordTypeConfig(recordType);
  const records = getMockRecords(recordType);
  const record = isNew ? null : (records.find((r) => r.id === recordId) ?? records[0]);
  const extras = isNew ? null : getMockFormExtras(recordId);

  const fromDrawingId = searchParams.get("fromDrawing");
  const returnTo      = searchParams.get("returnTo") ?? "";
  const aiSubject     = searchParams.get("aiSubject") ?? "";
  const aiDescription = searchParams.get("aiDescription") ?? "";
  const aiRefs        = searchParams.get("aiRefs") ?? ""; // comma-separated labels
  const aiCompany     = searchParams.get("aiCompany") ?? "";
  const aiDueDate     = searchParams.get("aiDueDate") ?? "";
  const aiImportance  = searchParams.get("aiImportance") ?? "";
  const aiAssigneeName = searchParams.get("aiAssignee") ?? "";
  const aiAssigneeCompany = searchParams.get("aiAssigneeCompany") ?? "";

  // ── Form state ──────────────────────────────────────────────────────────────
  const [status,     setStatus]     = useState(isNew ? config.statuses[0] : record!.status);
  const [subject,    setSubject]    = useState(isNew ? aiSubject : record!.title);
  const [description,setDescription]= useState(isNew ? aiDescription : record!.title);
  const [questionText, setQuestionText] = useState(isNew ? aiDescription : "");
  const [location,   setLocation]   = useState(isNew ? "" : (record!.location ?? ""));
  const [dueDate,    setDueDate]    = useState(isNew ? (aiDueDate || "") : record!.dueDate);
  const [company,    setCompany]    = useState(
    isNew ? (aiCompany || "") : (extras!.responsibleCompany === "None" ? "" : extras!.responsibleCompany)
  );
  const [assignees,  setAssignees]  = useState<Assignee[]>(() => {
    if (isNew) {
      if (aiAssigneeName) return [{ id: "ai-assignee", name: aiAssigneeName, company: aiAssigneeCompany, initials: aiAssigneeName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(), dueDate: "", isDone: false }];
      return [];
    }
    return getAssigneesForRecord(record!.id, record!.assigneeCount);
  });
  const [ccList,     setCcList]     = useState<Assignee[]>([]);
  const [type,             setType]            = useState(isNew ? "" : (extras!.type ?? ""));
  const [importance,       setImportance]      = useState(isNew ? (aiImportance || "Normal") : (extras!.importance ?? "Normal"));
  const [notToExceedCost,  setNotToExceedCost] = useState(isNew ? "" : "3,000.00");
  const [estimatedCost,    setEstimatedCost]   = useState(isNew ? "" : "3,000.00");
  const [actualCost,       setActualCost]      = useState(isNew ? "" : "2,700.00");
  const [impact,           setImpact]          = useState(isNew ? "" : "");
  const [response,         setResponse]        = useState(isNew ? "" : "");
  const [discipline,       setDiscipline]      = useState(isNew ? "" : "");
  const [stepDue,          setStepDue]         = useState(isNew ? "" : record?.dueDate ?? "");
  const [safetyDetails,    setSafetyDetails]   = useState({
    caseNumber: "", safetyCodeRegulation: "", safetyJurisdiction: "",
    firstAidBy: "", responsibility: "", reference: "",
    employeesInvolved: "", equipmentInvolved: "", materialInvolved: "",
    witnesses: "", preventionNotes: "", locationDetails: "",
  });

  // ── Sub-screen navigation ───────────────────────────────────────────────────
  const [subScreen,      setSubScreen]      = useState<SubScreenKind | null>(null);
  const [subVisible,     setSubVisible]     = useState(false);
  const [showAttachments,setShowAttachments]= useState(false);

  const openSub = useCallback((kind: SubScreenKind) => {
    setSubScreen(kind);
    requestAnimationFrame(() => requestAnimationFrame(() => setSubVisible(true)));
  }, []);

  const closeSub = useCallback(() => {
    setSubVisible(false);
    setTimeout(() => setSubScreen(null), 220);
  }, []);

  // ── Derived values ──────────────────────────────────────────────────────────
  const statusColor = getStatusColor(config, status);

  const locationParts    = location.split("/");
  const locationMain     = locationParts[locationParts.length - 1] || "";
  const locationBreadcrumb = locationParts.length > 1 ? location : "";

  const statusOptions: PickerOption[] = config.statuses.map((s) => ({
    label: s, value: s, color: getStatusColor(config, s),
  }));
  const companyOptions: PickerOption[] = MOCK_COMPANIES.map((c) => ({
    label: c, value: c === "None" ? "" : c,
  }));
  const typeOpts = TYPE_OPTIONS[recordType] ?? TYPE_OPTIONS.default;
  const typeOptions: PickerOption[] = typeOpts.map((t) => ({
    label: t, value: t === "None" ? "" : t,
  }));
  const importanceOptions: PickerOption[] = IMPORTANCE_OPTIONS.map((i) => ({
    label: i, value: i === "None" ? "" : i,
  }));
  const impactOptions: PickerOption[] = IMPACT_OPTIONS.map((i) => ({
    label: i, value: i === "None" ? "" : i,
  }));
  const responseOptions: PickerOption[]   = RESPONSE_OPTIONS.map((r) => ({ label: r, value: r === "None" ? "" : r }));
  const disciplineOptions: PickerOption[] = DISCIPLINE_OPTIONS.map((d) => ({ label: d, value: d === "None" ? "" : d }));

  // ── Render a single field by key ────────────────────────────────────────────
  function renderField(field: FormField, idx: number, arr: FormField[]) {
    const isLast = idx === arr.length - 1;
    const needsDivider = !isLast;

    switch (field) {
      case "number":
        return (
          <div key="number">
            <FormRow label="Number" value={isNew ? "–" : record!.number} />
            {needsDivider && <Divider />}
          </div>
        );

      case "status":
        return (
          <div key="status">
            <button
              onClick={() => openSub("status")}
              className="w-full flex items-center px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
            >
              <span className="text-sm text-gray-800 dark:text-gray-100 flex-1">Status</span>
              <div className="flex items-center gap-2 flex-none">
                <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[140px]">
                  {status.length > 18 ? status.slice(0, 17) + "…" : status}
                </span>
                <span className="w-4 h-4 rounded-full flex-none" style={{ backgroundColor: statusColor }} />
                <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 flex-none" />
              </div>
            </button>
            {needsDivider && <Divider />}
          </div>
        );

      case "subject":
        return (
          <div key="subject">
            <button
              onClick={() => openSub("subject")}
              className="w-full px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
            >
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-sm text-gray-800 dark:text-gray-100">Subject</span>
                <span className="text-red-500 text-sm">*</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug">
                {subject || <span className="text-gray-300 dark:text-gray-600 italic">Tap to add subject…</span>}
              </p>
            </button>
            {needsDivider && <Divider />}
          </div>
        );

      case "description":
        return (
          <div key="description">
            <button
              onClick={() => openSub("description")}
              className="w-full px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
            >
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-sm text-gray-800 dark:text-gray-100">Description</span>
                <span className="text-red-500 text-sm">*</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">
                {description || <span className="text-gray-300 dark:text-gray-600 italic">Tap to add description…</span>}
              </p>
            </button>
            {needsDivider && <Divider />}
          </div>
        );

      case "references": {
        const aiRefList = aiRefs ? aiRefs.split(",").map(s => s.trim()).filter(Boolean) : [];
        const hasDrawing = isNew ? (!!fromDrawingId || aiRefList.length > 0) : extras!.hasDrawingReference;
        const refCount   = isNew ? aiRefList.length || (fromDrawingId ? 1 : 0) : extras!.referencesCount;
        return (
          <div key="references" className="pt-3.5 pb-3.5">
            <div className="flex items-center justify-between px-4 mb-3">
              <span className="text-sm text-gray-800 dark:text-gray-100">References</span>
              {(isNew ? refCount > 0 : extras!.referencesCount > 0) && (
                <div className="flex items-center gap-1">
                  <Paperclip size={14} className="text-blue-400 dark:text-blue-300" />
                  <span className="text-sm text-blue-400 dark:text-blue-300 font-medium">{refCount}</span>
                </div>
              )}
            </div>
            <div className="flex items-start pl-4 gap-2 overflow-x-auto pb-1">
              {/* Drawing thumbnail (fromDrawing or first AI ref treated as drawing) */}
              {hasDrawing && (
                <div className="relative w-40 h-32 flex-none">
                  <div className="w-full h-full rounded overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                    <img
                      src={DRAWING_IMAGES[(isNew ? 0 : extras!.referencesCount) % DRAWING_IMAGES.length]}
                      alt="Drawing reference"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute bottom-7 left-10 text-red-500">
                    <MapPin size={20} className="fill-red-500 text-white" />
                  </div>
                </div>
              )}
              {/* AI-suggested spec/text references */}
              {isNew && aiRefList.slice(hasDrawing ? 1 : 0).map((ref, i) => (
                <div
                  key={i}
                  className="flex-none w-32 h-32 rounded border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 flex flex-col items-start justify-between p-2.5"
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                  </svg>
                  <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 leading-snug">{ref}</p>
                </div>
              ))}
              <div className="flex-1 min-w-0" />
              <button
                onClick={() => setShowAttachments(true)}
                className="flex-none w-14 h-16 rounded-l-xl text-white flex items-center justify-center shadow-sm self-center"
                style={{ backgroundColor: "#1b3a5c" }}
                aria-label="Add reference"
              >
                <Plus size={22} />
              </button>
            </div>
          </div>
        );
      }

      case "comments":
        return (
          <div key="comments" className="bg-white dark:bg-gray-900 mb-2">
            <button
              onClick={() => openSub("comments")}
              className="w-full flex items-center justify-between px-4 pt-4 pb-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
            >
              <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Comments</span>
              <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
            </button>
            {(extras?.comments ?? []).map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
            <button
              onClick={() => openSub("comments")}
              className="w-full flex items-center justify-end px-4 py-3 border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <span className="text-sm text-blue-500 dark:text-blue-400 font-medium">
                {!isNew && record!.commentCount > 0
                  ? `${record!.commentCount} Comments`
                  : "Start a conversation…"}
              </span>
              <ChevronRight size={16} className="text-blue-400 dark:text-blue-300 ml-1" />
            </button>
          </div>
        );

      case "due-date":
        return (
          <div key="due-date">
            <TapRow label="Due date" value={dueDate} onTap={() => openSub("due-date")} />
            {needsDivider && <Divider />}
          </div>
        );

      case "type":
        return (
          <div key="type">
            <TapRow label="Type" value={type || "None"} onTap={() => openSub("type")} />
            {needsDivider && <Divider />}
          </div>
        );

      case "importance":
        return (
          <div key="importance">
            <TapRow label="Importance" value={importance || "None"} onTap={() => openSub("importance")} />
            {needsDivider && <Divider />}
          </div>
        );

      case "impact":
        return (
          <div key="impact">
            <TapRow label="Impact" value={impact || "None"} onTap={() => openSub("impact")} />
            {needsDivider && <Divider />}
          </div>
        );

      case "response":
        return (
          <div key="response">
            <TapRow label="Response" value={response || "None"} onTap={() => openSub("response")} />
            {needsDivider && <Divider />}
          </div>
        );

      case "discipline":
        return (
          <div key="discipline">
            <TapRow label="Discipline" value={discipline || "None"} onTap={() => openSub("discipline")} />
            {needsDivider && <Divider />}
          </div>
        );

      case "step-due":
        return (
          <div key="step-due">
            <TapRow label="Step due" value={stepDue} onTap={() => openSub("step-due")} />
            {needsDivider && <Divider />}
          </div>
        );

      case "question":
        return (
          <div key="question" className="bg-white dark:bg-gray-900 mb-2">
            <button
              onClick={() => openSub("question")}
              className="w-full flex items-center justify-between px-4 pt-4 pb-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <span className="text-base font-bold text-blue-700 dark:text-blue-400">Question</span>
              <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
            </button>
            {/* AI pre-populated question text */}
            {isNew && questionText ? (
              <div className="px-4 pb-3">
                <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{questionText}</p>
                <button
                  onClick={() => openSub("question")}
                  className="mt-2 text-xs text-blue-500 dark:text-blue-400 font-medium"
                >
                  Edit question…
                </button>
              </div>
            ) : (
              <>
                {(extras?.comments ?? []).slice(0, 1).map((comment) => (
                  <CommentItem key={comment.id} comment={comment} />
                ))}
                <button
                  onClick={() => openSub("question")}
                  className="w-full flex items-center justify-end px-4 py-3 border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <span className="text-sm text-blue-500 dark:text-blue-400 font-medium">
                    {!isNew && record!.commentCount > 0
                      ? `${record!.commentCount} Comment${record!.commentCount !== 1 ? "s" : ""}`
                      : "Start a question…"}
                  </span>
                  <ChevronRight size={16} className="text-blue-400 dark:text-blue-300 ml-1" />
                </button>
              </>
            )}
          </div>
        );

      case "safety-details": {
        const detailRows: { key: keyof typeof safetyDetails; label: string }[] = [
          { key: "caseNumber",            label: "Case number" },
          { key: "safetyCodeRegulation",  label: "Safety code regulation" },
          { key: "safetyJurisdiction",    label: "Safety jurisdiction" },
          { key: "firstAidBy",            label: "First aid by" },
          { key: "responsibility",        label: "Responsibility" },
          { key: "reference",             label: "Reference" },
          { key: "employeesInvolved",     label: "Employees involved" },
          { key: "equipmentInvolved",     label: "Equipment involved" },
          { key: "materialInvolved",      label: "Material involved" },
          { key: "witnesses",             label: "Witnesses" },
          { key: "preventionNotes",       label: "Prevention notes" },
          { key: "locationDetails",       label: "Location details" },
        ];
        return (
          <div key="safety-details" className="mb-2">
            <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800">
              <span className="text-xs font-semibold tracking-wider text-gray-500 dark:text-gray-400">DETAILED INFORMATION</span>
            </div>
            <div className="bg-white dark:bg-gray-900 border-t border-b border-gray-200 dark:border-gray-800">
              {detailRows.map((row, i) => (
                <div key={row.key} className={`px-4 py-3 ${i < detailRows.length - 1 ? "border-b border-gray-100 dark:border-gray-800" : ""}`}>
                  <p className="text-sm text-gray-800 dark:text-gray-100 mb-0.5">{row.label}</p>
                  <input
                    className="w-full text-sm text-gray-500 dark:text-gray-400 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none bg-transparent"
                    placeholder={`Enter ${row.label}…`}
                    value={safetyDetails[row.key]}
                    onChange={e => setSafetyDetails(prev => ({ ...prev, [row.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "location":
        return (
          <div key="location">
            <button
              onClick={() => openSub("location")}
              className="w-full flex items-start justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <span className="text-sm text-gray-800 dark:text-gray-100 flex-1 text-left">Location</span>
              <div className="flex items-center gap-2 flex-none ml-3">
                {location ? (
                  <div className="flex items-center gap-1">
                    <MapPin size={13} className="text-gray-400 dark:text-gray-500 flex-none" />
                    <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[130px]">{locationMain}</span>
                  </div>
                ) : null}
                <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 flex-none" />
              </div>
            </button>
            {needsDivider && <Divider />}
          </div>
        );

      case "responsible-company":
        return (
          <div key="responsible-company">
            <TapRow label="Responsible comp..." value={company || "None"} onTap={() => openSub("company")} />
            {needsDivider && <Divider />}
          </div>
        );

      case "assigned-to":
        return (
          <div key="assigned-to">
            <TapRow
              label="Assigned to"
              value={
                assignees.length > 0
                  ? `${assignees[0].name.split(" ")[0]} (${assignees[0].company?.slice(0, 4)}…)`
                  : undefined
              }
              onTap={() => openSub("assigned-to")}
            />
            {needsDivider && <Divider />}
          </div>
        );

      case "cc":
        return (
          <div key="cc">
            <TapRow
              label={recordType === "rfis" ? "CC'D" : "CC"}
              value={ccList.length > 0 ? `${ccList.length} contact(s)` : undefined}
              onTap={() => openSub("cc")}
            />
            {needsDivider && <Divider />}
          </div>
        );

      case "not-to-exceed-cost":
        return (
          <div key="not-to-exceed-cost">
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm text-gray-800 dark:text-gray-100">Not to exceed cost</span>
              <div className="flex items-center gap-2">
                <input
                  className="text-sm text-gray-500 dark:text-gray-400 text-right w-28 focus:outline-none bg-transparent"
                  value={notToExceedCost}
                  onChange={e => setNotToExceedCost(e.target.value)}
                  onBlur={e => { const n = parseFloat(e.target.value.replace(/,/g, "")); if (!isNaN(n)) setNotToExceedCost(n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })); }}
                  placeholder="0.00"
                />
                <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 flex-none" />
              </div>
            </div>
            {needsDivider && <Divider />}
          </div>
        );

      case "estimated-cost":
        return (
          <div key="estimated-cost">
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm text-gray-800 dark:text-gray-100">Estimated cost</span>
              <div className="flex items-center gap-2">
                <input
                  className="text-sm text-gray-500 dark:text-gray-400 text-right w-28 focus:outline-none bg-transparent"
                  value={estimatedCost}
                  onChange={e => setEstimatedCost(e.target.value)}
                  onBlur={e => { const n = parseFloat(e.target.value.replace(/,/g, "")); if (!isNaN(n)) setEstimatedCost(n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })); }}
                  placeholder="0.00"
                />
                <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 flex-none" />
              </div>
            </div>
            {needsDivider && <Divider />}
          </div>
        );

      case "actual-cost":
        return (
          <div key="actual-cost">
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm text-gray-800 dark:text-gray-100">Actual cost</span>
              <div className="flex items-center gap-2">
                <input
                  className="text-sm text-gray-500 dark:text-gray-400 text-right w-28 focus:outline-none bg-transparent"
                  value={actualCost}
                  onChange={e => setActualCost(e.target.value)}
                  onBlur={e => { const n = parseFloat(e.target.value.replace(/,/g, "")); if (!isNaN(n)) setActualCost(n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })); }}
                  placeholder="0.00"
                />
                <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 flex-none" />
              </div>
            </div>
            {needsDivider && <Divider />}
          </div>
        );

      case "records":
        return (
          <div key="records" className="bg-white dark:bg-gray-900 mb-2">
            <div className="flex items-center justify-between px-4 py-4">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Records</span>
              <button className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" aria-label="Add linked record">
                <Plus size={20} />
              </button>
            </div>
            {(extras?.linkedRecordsCount ?? 0) > 0 && (
              <div className="px-4 pb-3">
                <p className="text-xs text-gray-400 dark:text-gray-500">{extras!.linkedRecordsCount} linked record(s)</p>
              </div>
            )}
          </div>
        );

      case "web-links":
        return (
          <div key="web-links" className="bg-white dark:bg-gray-900 mb-4">
            <div className="flex items-center justify-between px-4 py-4">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Web links</span>
              <button className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300" aria-label="Add web link">
                <Plus size={20} />
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  // ── Group fields into white cards ────────────────────────────────────────────
  // "comments", "records", and "web-links" are already self-contained blocks.
  // Everything else gets grouped into white cards separated at these boundaries.
  const STANDALONE: FormField[] = ["comments", "question", "safety-details", "records", "web-links"];

  function groupFields(fields: FormField[]): Array<{ standalone: boolean; fields: FormField[] }> {
    const result: Array<{ standalone: boolean; fields: FormField[] }> = [];
    let current: FormField[] = [];
    for (const f of fields) {
      if (STANDALONE.includes(f)) {
        if (current.length) { result.push({ standalone: false, fields: current }); current = []; }
        result.push({ standalone: true, fields: [f] });
      } else {
        current.push(f);
      }
    }
    if (current.length) result.push({ standalone: false, fields: current });
    return result;
  }

  const groups = groupFields(config.formFields);

  return (
    <div className="flex flex-col flex-1 bg-gray-100 dark:bg-gray-950 overflow-hidden relative">
      {/* ── Header ── */}
      <header
        className="flex items-center px-3 py-3 flex-none gap-3"
        style={{ backgroundColor: "#1b3a5c" }}
      >
        <button onClick={() => returnTo ? router.push(returnTo) : router.back()} className="text-white opacity-90 hover:opacity-100 p-1" aria-label="Close">
          <X size={20} />
        </button>
        <h1 className="flex-1 text-white font-semibold text-base leading-tight truncate">
          {isNew ? `New ${config.singularLabel}` : config.singularLabel}
        </h1>
        <button className="text-white opacity-80 hover:opacity-100 p-1" aria-label="Duplicate"><Copy size={20} /></button>
        <button className="text-white opacity-80 hover:opacity-100 p-1" aria-label="Save"><Save size={20} /></button>
        {recordType === "rfis" && (
          <button className="text-white font-semibold text-sm px-1 ml-1" aria-label="Submit">Submit</button>
        )}
      </header>

      {/* ── Scrollable form body ── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {groups.map((group, gi) =>
          group.standalone ? (
            group.fields.map((f) => renderField(f, 0, group.fields))
          ) : (
            <div key={gi} className="bg-white dark:bg-gray-900 mb-2">
              {group.fields.map((f, fi) => renderField(f, fi, group.fields))}
            </div>
          )
        )}
        <div className="h-4" />
      </div>

      {/* ── Sub-screen overlay (slides in from right) ── */}
      {subScreen && (
        <div
          className="absolute inset-0 z-10"
          style={{
            transform: subVisible ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.22s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {subScreen === "status" && (
            <FieldPickerScreen title="Status" options={statusOptions} value={status} onSelect={setStatus} onBack={closeSub} />
          )}
          {(subScreen === "subject") && (
            <DescriptionEditorScreen value={subject} onSave={setSubject} onBack={closeSub} label="Subject" singleLine />
          )}
          {subScreen === "description" && (
            <DescriptionEditorScreen value={description} onSave={setDescription} onBack={closeSub} />
          )}
          {subScreen === "location" && (
            <LocationPickerScreen value={location} onSelect={setLocation} onBack={closeSub} />
          )}
          {subScreen === "due-date" && (
            <DatePickerScreen value={dueDate} onSave={setDueDate} onBack={closeSub} />
          )}
          {subScreen === "company" && (
            <FieldPickerScreen title="Responsible company" options={companyOptions} value={company} onSelect={setCompany} onBack={closeSub} />
          )}
          {subScreen === "assigned-to" && (
            <ContactListScreen title="Assigned to" assignees={assignees} onChange={setAssignees} onBack={closeSub} />
          )}
          {subScreen === "cc" && (
            <ContactListScreen title="CC" assignees={ccList} onChange={setCcList} onBack={closeSub} />
          )}
          {subScreen === "type" && (
            <FieldPickerScreen title="Type" options={typeOptions} value={type} onSelect={setType} onBack={closeSub} />
          )}
          {subScreen === "importance" && (
            <FieldPickerScreen title="Importance" options={importanceOptions} value={importance} onSelect={setImportance} onBack={closeSub} />
          )}
          {subScreen === "impact" && (
            <FieldPickerScreen title="Impact" options={impactOptions} value={impact} onSelect={setImpact} onBack={closeSub} />
          )}
          {subScreen === "response" && (
            <FieldPickerScreen title="Response" options={responseOptions} value={response} onSelect={setResponse} onBack={closeSub} />
          )}
          {subScreen === "discipline" && (
            <FieldPickerScreen title="Discipline" options={disciplineOptions} value={discipline} onSelect={setDiscipline} onBack={closeSub} />
          )}
          {subScreen === "step-due" && (
            <DatePickerScreen value={stepDue} onSave={setStepDue} onBack={closeSub} />
          )}
          {subScreen === "question" && (
            <CommentsScreen comments={extras?.comments ?? []} onBack={closeSub} />
          )}
          {subScreen === "comments" && (
            <CommentsScreen comments={extras?.comments ?? []} onBack={closeSub} />
          )}
        </div>
      )}

      {/* ── Attachments bottom sheet ── */}
      {showAttachments && (
        <AttachmentsSheet onClose={() => setShowAttachments(false)} />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Divider() {
  return <div className="ml-4 border-b border-gray-100 dark:border-gray-800" />;
}

function FormRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className="text-sm text-gray-800 dark:text-gray-100">{label}</span>
      {value && <span className="text-sm text-gray-400 dark:text-gray-500 truncate max-w-[200px]">{value}</span>}
    </div>
  );
}

function TapRow({ label, value, onTap }: { label: string; value?: string; onTap: () => void }) {
  return (
    <button
      onClick={onTap}
      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
    >
      <span className="text-sm text-gray-800 dark:text-gray-100">{label}</span>
      <div className="flex items-center gap-2 flex-none ml-3">
        {value && <span className="text-sm text-gray-400 dark:text-gray-500 truncate max-w-[160px]">{value}</span>}
        <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 flex-none" />
      </div>
    </button>
  );
}

function CommentItem({ comment }: { comment: RecordComment }) {
  return (
    <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300 flex-none">
          {comment.authorInitials}
        </div>
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{comment.authorName}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">{comment.date}</span>
      </div>
      {comment.badge && (
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-4 h-4 rounded-full flex items-center justify-center flex-none" style={{ backgroundColor: comment.badgeColor }}>
            <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-white" fill="currentColor">
              <path d="M10 3L5 8.5 2 5.5l-1 1 4 4 6-7z" />
            </svg>
          </span>
          <span className="text-sm font-semibold" style={{ color: comment.badgeColor }}>{comment.badge}</span>
        </div>
      )}
      <p className="text-sm text-gray-700 dark:text-gray-300">{comment.text}</p>
    </div>
  );
}
