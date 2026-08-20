"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ClipboardCheck, Download, X } from "lucide-react";
import { getMockRecords, getMockFormExtras } from "@/lib/mobile/mockData";
import CommentsScreen from "./subforms/CommentsScreen";

// ─── Per-submittal mock detail data ──────────────────────────────────────────

interface SubmittalDetail {
  number: string;
  status: string;
  subject: string;
  descriptionText: string;
  specLink: string;
  revision: string;
  specSection: string;
  specSubSection: string;
  packageName: string;
  stepDue: string;
  dueDate: string;
  type: string;
  responsibleCompany: string;
  assignedTo: string;
  ccd: string;
}

const DETAIL_MAP: Record<string, SubmittalDetail> = {
  "sub-04": {
    number: "055213.1.3.E", status: "Rejected",
    subject: "055213 - PIPE AND TUBE RAILINGS",
    descriptionText: "PIPE AND TUBE RAILINGS: Product Data",
    specLink: "055213 - PIPE AND TUBE RAILINGS",
    revision: "00", specSection: "", specSubSection: "055213.1.3.E - Product Data",
    packageName: "Test", stepDue: "2/3/26", dueDate: "12/16/25",
    type: "Product Data", responsibleCompany: "Sample Company",
    assignedTo: "Jesse Lavine", ccd: "Jesse Lavine",
  },
  "sub-03": {
    number: "08 44 13.1.A", status: "Approved",
    subject: "08 44 13 - GLAZED ALUMINUM CURTAIN WALLS",
    descriptionText: "Exterior Aluminum Curtain Wall System: Shop Drawings",
    specLink: "08 44 13 - GLAZED ALUMINUM CURTAIN WALLS",
    revision: "01", specSection: "08 44 13", specSubSection: "08 44 13.1.A - Shop Drawings",
    packageName: "Exterior Glazing Package", stepDue: "6/10/26", dueDate: "6/25/26",
    type: "Shop Drawing", responsibleCompany: "Pacific Glass Co.",
    assignedTo: "Paula Standley", ccd: "Jesse Lavine",
  },
  "sub-05": {
    number: "07 52 16.1.A", status: "For Review",
    subject: "07 52 16 - MODIFIED BITUMINOUS SHEET ROOFING",
    descriptionText: "Roofing Membrane Product Data Sheet",
    specLink: "07 52 16 - MODIFIED BITUMINOUS SHEET ROOFING",
    revision: "00", specSection: "07 52 16", specSubSection: "07 52 16.1.A - Product Data",
    packageName: "", stepDue: "7/2/26", dueDate: "7/9/26",
    type: "Product Data", responsibleCompany: "Summit Roofing",
    assignedTo: "Scott Casey", ccd: "",
  },
};

function getDetail(id: string, fallbackTitle: string, fallbackStatus: string, fallbackDue: string): SubmittalDetail {
  return DETAIL_MAP[id] ?? {
    number: id.replace("sub-", "0000") + ".A",
    status: fallbackStatus.charAt(0) + fallbackStatus.slice(1).toLowerCase(),
    subject: fallbackTitle,
    descriptionText: fallbackTitle,
    specLink: fallbackTitle,
    revision: "00", specSection: "", specSubSection: "",
    packageName: "", stepDue: fallbackDue, dueDate: fallbackDue,
    type: "Product Data", responsibleCompany: "Sample Company",
    assignedTo: "Jesse Lavine", ccd: "",
  };
}

// ─── Read-only toast ──────────────────────────────────────────────────────────

function ReadOnlyToast() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full text-white text-sm font-medium shadow-lg transition-opacity duration-500 pointer-events-none whitespace-nowrap"
      style={{ backgroundColor: "rgba(50,50,50,0.88)", opacity: visible ? 1 : 0 }}
    >
      This record is read-only.
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Divider() {
  return <div className="mx-4 border-t border-gray-100 dark:border-gray-800" />;
}

function ReadRow({ label, value, chevron, valueBlue }: { label: string; value?: string; chevron?: boolean; valueBlue?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className="text-sm text-gray-800 dark:text-gray-100">{label}</span>
      <div className="flex items-center gap-2">
        {value && (
          <span className={`text-sm truncate max-w-[170px] ${valueBlue ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}`}>
            {value}
          </span>
        )}
        {chevron && <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 flex-none" />}
      </div>
    </div>
  );
}

function Toggle({ label, on = false }: { label: string; on?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className={`text-sm ${on ? "text-gray-800 dark:text-gray-100" : "text-gray-300 dark:text-gray-600"}`}>{label}</span>
      <div className={`w-10 h-6 rounded-full relative flex-none transition-colors ${on ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"}`}>
        <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface Props { projectId: string; recordId: string; }

export default function SubmittalFormScreen({ projectId, recordId }: Props) {
  const router = useRouter();
  const records = getMockRecords("submittals");
  const record  = records.find(r => r.id === recordId) ?? records[0];
  const detail  = getDetail(record.id, record.title, record.status, record.dueDate);

  const extras = getMockFormExtras(record.id);
  const [showToast] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [subVisible,   setSubVisible]   = useState(false);

  const openComments = useCallback(() => {
    setShowComments(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setSubVisible(true)));
  }, []);
  const closeComments = useCallback(() => {
    setSubVisible(false);
    setTimeout(() => setShowComments(false), 220);
  }, []);

  return (
    <div className="flex flex-col flex-1 bg-gray-100 dark:bg-gray-950 overflow-hidden relative">
      {/* Header */}
      <header className="flex items-center px-3 py-3 flex-none gap-3" style={{ backgroundColor: "#1b3a5c" }}>
        <button onClick={() => router.back()} className="text-white p-1"><X size={20} /></button>
        <h1 className="flex-1 text-white font-semibold text-base truncate">Submittal</h1>
      </header>

      <div className="flex-1 overflow-y-auto min-h-0">

        {/* Core identity card */}
        <div className="bg-white dark:bg-gray-900 mb-2 border-t border-gray-100 dark:border-gray-800">
          <ReadRow label="Number" value={detail.number} />
          <Divider />
          <ReadRow label="Status" value={detail.status} />
          <Divider />
          <Toggle label="Closed" on={false} />
          <Divider />
          {/* Subject */}
          <div className="px-4 py-3.5">
            <p className="text-sm text-gray-800 dark:text-gray-100 mb-0.5">Subject</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{detail.subject}</p>
          </div>
        </div>

        {/* Description block */}
        <div className="bg-white dark:bg-gray-900 mb-2 border-t border-b border-gray-100 dark:border-gray-800 px-4 py-3.5">
          <p className="text-sm text-gray-800 dark:text-gray-100 mb-2">Description</p>
          <div className="flex items-start gap-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center flex-none">
              <span className="text-[10px] font-semibold text-white">JL</span>
            </div>
            <div className="flex-1">
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-100">Jesse Lavine</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">December 9, 2025</span>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{detail.descriptionText}</p>
            </div>
          </div>
          {detail.specLink && (
            <button className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950/60">
              <ClipboardCheck size={14} className="text-blue-600 dark:text-blue-400 flex-none" />
              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">{detail.specLink}</span>
            </button>
          )}
        </div>

        {/* Documents for review */}
        <div className="bg-white dark:bg-gray-900 mb-2 border-t border-b border-gray-100 dark:border-gray-800 px-4 py-3.5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-800 dark:text-gray-100">Documents for review</p>
            <div className="flex items-center gap-1">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#3b82f6" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
              </svg>
              <span className="text-sm text-blue-500 dark:text-blue-400 font-medium">1</span>
            </div>
          </div>
          {/* Document thumbnail */}
          <div className="w-36 h-28 rounded overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 relative">
            <img
              src="/images/drawings/drawing-a.png"
              alt="Document"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
                <Download size={16} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Physical submittal toggle */}
        <div className="bg-white dark:bg-gray-900 mb-2 border-t border-b border-gray-100 dark:border-gray-800">
          <Toggle label="Physical submittal" on={false} />
        </div>

        {/* Comments */}
        <div className="bg-white dark:bg-gray-900 mb-2 border-t border-b border-gray-100 dark:border-gray-800">
          <div className="px-4 pt-3.5 pb-1">
            <p className="text-sm text-gray-800 dark:text-gray-100">Comments</p>
          </div>
          {extras.comments.slice(0, 1).map(c => (
            <div key={c.id} className="flex items-start gap-2 px-4 py-2">
              <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center flex-none">
                <span className="text-[10px] font-semibold text-white">{c.authorInitials}</span>
              </div>
              <div className="flex-1">
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-100">{c.authorName}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">{c.date}</span>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{c.text}</p>
              </div>
            </div>
          ))}
          <button
            onClick={openComments}
            className="w-full flex items-center justify-end px-4 py-3 border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <span className="text-sm text-blue-500 dark:text-blue-400 font-medium">
              {record.commentCount > 0 ? `${record.commentCount} Comment${record.commentCount !== 1 ? "s" : ""}` : "Start a discussion…"}
            </span>
            <ChevronRight size={16} className="text-blue-400 ml-1" />
          </button>
        </div>

        {/* Metadata card */}
        <div className="bg-white dark:bg-gray-900 mb-4 border-t border-gray-100 dark:border-gray-800">
          <ReadRow label="Revision" value={detail.revision} />
          <Divider />
          <ReadRow label="Spec section" value={detail.specSection || undefined} />
          <Divider />
          <div className="px-4 py-3.5">
            <div className="flex items-start justify-between">
              <span className="text-sm text-gray-800 dark:text-gray-100 flex-none mr-4">Spec sub section</span>
              <span className="text-sm text-gray-400 dark:text-gray-500 text-right">{detail.specSubSection}</span>
            </div>
          </div>
          <Divider />
          {detail.packageName ? (
            <>
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-sm text-gray-800 dark:text-gray-100">Submittal package</span>
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">{detail.packageName}</span>
              </div>
              <Divider />
            </>
          ) : (
            <>
              <ReadRow label="Submittal package" />
              <Divider />
            </>
          )}
          <ReadRow label="Step due" value={detail.stepDue} />
          <Divider />
          <ReadRow label="Due date" value={detail.dueDate} />
          <Divider />
          <ReadRow label="Type" value={detail.type} />
          <Divider />
          <ReadRow label="Importance" value="None" />
          <Divider />
          <ReadRow label="Location" value={record.location ?? undefined} />
          <Divider />
          <ReadRow label="Responsible company" value={detail.responsibleCompany} />
          <Divider />
          <ReadRow label="Assigned to" value={detail.assignedTo} chevron />
          <Divider />
          <ReadRow label="CC'D" value={detail.ccd || undefined} chevron />
          <Divider />
          <ReadRow label="Records" />
        </div>

        <div className="h-4" />
      </div>

      {showToast && <ReadOnlyToast />}

      {/* Comments sub-screen */}
      {showComments && (
        <div
          className="absolute inset-0 z-10"
          style={{
            transform: subVisible ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.22s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <CommentsScreen comments={extras.comments} onBack={closeComments} />
        </div>
      )}
    </div>
  );
}
