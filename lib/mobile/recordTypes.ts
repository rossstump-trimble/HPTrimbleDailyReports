// ─── Types ──────────────────────────────────────────────────────────────────

export interface BatchEditField {
  key: string;
  label: string;
  type: "select" | "date" | "text" | "toggle";
  defaultValue?: string;
}

export interface SortOption {
  id: string;
  label: string;
}

export interface AddOption {
  label: string;
  /** Lucide icon name slug */
  iconName: "camera" | "image" | "check-square" | "file-text" | "plus";
}

/**
 * Ordered list of field keys to render in the record form.
 * Keys: "number" | "status" | "subject" | "description" | "references" |
 *       "comments" | "due-date" | "type" | "importance" | "location" |
 *       "responsible-company" | "assigned-to" | "cc" | "records"
 */
export type FormField =
  | "number"
  | "status"
  | "subject"
  | "description"
  | "references"
  | "comments"
  | "due-date"
  | "type"
  | "importance"
  | "location"
  | "responsible-company"
  | "assigned-to"
  | "cc"
  | "records"
  | "not-to-exceed-cost"
  | "estimated-cost"
  | "actual-cost"
  | "web-links"
  | "impact"
  | "response"
  | "question"
  | "discipline"
  | "step-due"
  | "safety-details";

export interface RecordTypeConfig {
  label: string;
  singularLabel: string;
  statuses: string[];
  sortOptions: SortOption[];
  defaultSort: string;
  addOptions: AddOption[];
  batchEditFields: BatchEditField[];
  /** Maps status string → hex color */
  statusColors: Record<string, string>;
  /** Ordered field keys to render in the form */
  formFields: FormField[];
}

// ─── Shared defaults ─────────────────────────────────────────────────────────

const COMMON_SORT_OPTIONS: SortOption[] = [
  { id: "number", label: "Number" },
  { id: "recently-modified", label: "Recently Modified" },
  { id: "recently-viewed", label: "Recently Viewed" },
  { id: "type", label: "Type" },
];

const AMBER = "#eab308";
const GRAY = "#6b7280";
const GREEN = "#16a34a";
const DARK_GREEN = "#166534";
const BLUE = "#2563eb";
const RED = "#dc2626";

// ─── Registry ────────────────────────────────────────────────────────────────

export const RECORD_TYPES: Record<string, RecordTypeConfig> = {
  "punch-items": {
    label: "Punch items",
    singularLabel: "Punch item",
    statuses: ["Draft", "Open", "Pending Reinspection", "Closed"],
    sortOptions: COMMON_SORT_OPTIONS,
    defaultSort: "recently-modified",
    addOptions: [
      { label: "New from Camera", iconName: "camera" },
      { label: "New from Photos/Videos", iconName: "image" },
      { label: "New Punch item", iconName: "check-square" },
    ],
    batchEditFields: [
      { key: "importance", label: "Importance", type: "select", defaultValue: "None" },
      { key: "status", label: "Status", type: "select" },
      { key: "dueDate", label: "Due date", type: "date" },
      { key: "responsibleCompany", label: "Responsible comp...", type: "select", defaultValue: "None" },
      { key: "assign", label: "Assign", type: "select" },
      { key: "cc", label: "CC", type: "select" },
      { key: "location", label: "Location", type: "select" },
      { key: "type", label: "Type", type: "select", defaultValue: "None" },
      { key: "markDone", label: "Mark my assignments done", type: "toggle" },
    ],
    statusColors: {
      OPEN: AMBER,
      "PENDING REINSPECTION": AMBER,
      CLOSED: DARK_GREEN,
      DRAFT: GRAY,
      VOID: GRAY,
    },
    formFields: [
      "number", "status", "description", "references", "comments",
      "location", "due-date", "responsible-company", "assigned-to", "cc",
      "type", "importance", "records",
    ],
  },

  rfis: {
    label: "RFIs",
    singularLabel: "RFI",
    statuses: ["Draft", "Open", "Submitted", "Closed", "Void"],
    sortOptions: COMMON_SORT_OPTIONS,
    defaultSort: "recently-modified",
    addOptions: [
      { label: "New RFI", iconName: "file-text" },
    ],
    batchEditFields: [
      { key: "importance", label: "Importance", type: "select", defaultValue: "None" },
      { key: "status", label: "Status", type: "select" },
      { key: "dueDate", label: "Due date", type: "date" },
      { key: "assign", label: "Assign", type: "select" },
      { key: "cc", label: "CC'D", type: "select" },
    ],
    statusColors: {
      OPEN: AMBER,
      SUBMITTED: BLUE,
      CLOSED: GREEN,
      DRAFT: GRAY,
      VOID: GRAY,
    },
    formFields: [
      "number", "status", "subject", "response",
      "question", "references",
      "discipline", "responsible-company", "assigned-to", "cc",
      "step-due", "due-date", "impact", "importance", "location",
      "records",
    ],
  },

  checklists: {
    label: "Checklists",
    singularLabel: "Checklist",
    statuses: ["Draft", "In Progress", "Complete", "Void"],
    sortOptions: COMMON_SORT_OPTIONS,
    defaultSort: "recently-modified",
    addOptions: [
      { label: "New Checklist", iconName: "check-square" },
    ],
    batchEditFields: [
      { key: "status", label: "Status", type: "select" },
      { key: "dueDate", label: "Due date", type: "date" },
      { key: "assign", label: "Assign", type: "select" },
      { key: "location", label: "Location", type: "select" },
    ],
    statusColors: {
      "IN PROGRESS": AMBER,
      COMPLETE: GREEN,
      DRAFT: GRAY,
      VOID: GRAY,
    },
    formFields: [
      "number", "status", "description", "references", "comments",
      "due-date", "location", "assigned-to", "cc", "records",
    ],
  },

  "action-items": {
    label: "Action items",
    singularLabel: "Action item",
    statuses: ["Open", "Closed", "Void"],
    sortOptions: COMMON_SORT_OPTIONS,
    defaultSort: "recently-modified",
    addOptions: [
      { label: "New Action item", iconName: "check-square" },
    ],
    batchEditFields: [
      { key: "importance", label: "Importance", type: "select", defaultValue: "None" },
      { key: "status", label: "Status", type: "select" },
      { key: "dueDate", label: "Due date", type: "date" },
      { key: "assign", label: "Assign", type: "select" },
      { key: "cc", label: "CC", type: "select" },
    ],
    statusColors: {
      OPEN: AMBER,
      CLOSED: GREEN,
      VOID: GRAY,
    },
    formFields: [
      "number", "status", "subject", "description", "references", "comments",
      "due-date", "type", "importance", "location", "assigned-to", "cc",
    ],
  },

  issues: {
    label: "Issues",
    singularLabel: "Issue",
    statuses: ["Open", "In Review", "Closed", "Void"],
    sortOptions: COMMON_SORT_OPTIONS,
    defaultSort: "recently-modified",
    addOptions: [
      { label: "New from Camera", iconName: "camera" },
      { label: "New from Photos/Videos", iconName: "image" },
      { label: "New Issue", iconName: "file-text" },
    ],
    batchEditFields: [
      { key: "importance", label: "Importance", type: "select", defaultValue: "None" },
      { key: "status", label: "Status", type: "select" },
      { key: "dueDate", label: "Due date", type: "date" },
      { key: "assign", label: "Assign", type: "select" },
      { key: "location", label: "Location", type: "select" },
      { key: "type", label: "Type", type: "select", defaultValue: "None" },
    ],
    statusColors: {
      OPEN: AMBER,
      "IN REVIEW": BLUE,
      CLOSED: GREEN,
      VOID: GRAY,
    },
    formFields: [
      "number", "status", "subject", "description", "references",
      "due-date", "impact", "type", "importance", "location",
      "assigned-to", "cc",
      "comments", "records", "web-links",
    ],
  },

  "notices-to-comply": {
    label: "Notices to comply",
    singularLabel: "Notice to comply",
    statuses: ["Open", "Pending Response", "Closed", "Void"],
    sortOptions: COMMON_SORT_OPTIONS,
    defaultSort: "recently-modified",
    addOptions: [
      { label: "New Notice to comply", iconName: "file-text" },
    ],
    batchEditFields: [
      { key: "status", label: "Status", type: "select" },
      { key: "dueDate", label: "Due date", type: "date" },
      { key: "assign", label: "Assign", type: "select" },
      { key: "location", label: "Location", type: "select" },
    ],
    statusColors: {
      OPEN: AMBER,
      "PENDING RESPONSE": BLUE,
      CLOSED: GREEN,
      VOID: GRAY,
    },
    formFields: [
      "number", "status", "subject", "description", "references",
      "due-date", "type", "importance", "location",
      "assigned-to", "cc",
      "comments", "records", "web-links",
    ],
  },

  "field-work-directives": {
    label: "Field work directives",
    singularLabel: "Field work directive",
    statuses: ["Draft", "Open", "Closed", "Void"],
    sortOptions: COMMON_SORT_OPTIONS,
    defaultSort: "recently-modified",
    addOptions: [
      { label: "New Field work directive", iconName: "file-text" },
    ],
    batchEditFields: [
      { key: "status", label: "Status", type: "select" },
      { key: "dueDate", label: "Due date", type: "date" },
      { key: "assign", label: "Assign", type: "select" },
      { key: "location", label: "Location", type: "select" },
    ],
    statusColors: {
      OPEN: AMBER,
      CLOSED: GREEN,
      DRAFT: GRAY,
      VOID: GRAY,
    },
    formFields: [
      "number", "status", "subject", "description", "references",
      "due-date", "type", "importance", "location",
      "not-to-exceed-cost", "estimated-cost", "actual-cost",
      "assigned-to", "cc",
      "comments", "records", "web-links",
    ],
  },

  "daily-reports": {
    label: "Daily reports",
    singularLabel: "Daily report",
    statuses: ["Pending", "Draft", "Submitted", "Approved"],
    sortOptions: [
      { id: "date", label: "Date" },
      { id: "recently-modified", label: "Recently Modified" },
      { id: "recently-viewed", label: "Recently Viewed" },
    ],
    defaultSort: "date",
    addOptions: [
      { label: "New Daily report", iconName: "file-text" },
    ],
    batchEditFields: [
      { key: "status", label: "Status", type: "select" },
      { key: "date", label: "Date", type: "date" },
    ],
    statusColors: {
      PENDING: GRAY,
      DRAFT: GRAY,
      SUBMITTED: AMBER,
      APPROVED: GREEN,
    },
    formFields: [
      "number", "status", "description", "references", "comments",
      "due-date", "assigned-to", "cc", "records",
    ],
  },

  "safety-notices": {
    label: "Safety notices",
    singularLabel: "Safety notice",
    statuses: ["Draft", "Open", "Closed", "Void"],
    sortOptions: COMMON_SORT_OPTIONS,
    defaultSort: "recently-modified",
    addOptions: [
      { label: "New Safety notice", iconName: "file-text" },
    ],
    batchEditFields: [
      { key: "importance", label: "Importance", type: "select", defaultValue: "None" },
      { key: "status", label: "Status", type: "select" },
      { key: "dueDate", label: "Due date", type: "date" },
      { key: "assign", label: "Assign", type: "select" },
      { key: "location", label: "Location", type: "select" },
    ],
    statusColors: {
      OPEN: AMBER,
      CLOSED: GREEN,
      DRAFT: GRAY,
      VOID: GRAY,
    },
    formFields: [
      "number", "status", "subject", "description", "references",
      "due-date", "type", "importance", "location", "assigned-to", "cc",
      "comments", "safety-details", "records", "web-links",
    ],
  },

  "submittal-packages": {
    label: "Submittal packages",
    singularLabel: "Submittal package",
    statuses: ["Draft", "Open", "Under Review", "Approved", "Rejected"],
    sortOptions: COMMON_SORT_OPTIONS,
    defaultSort: "recently-modified",
    addOptions: [],
    batchEditFields: [
      { key: "status", label: "Status", type: "select" },
      { key: "dueDate", label: "Due date", type: "date" },
      { key: "responsibleCompany", label: "Responsible comp...", type: "select", defaultValue: "None" },
      { key: "assign", label: "Assign", type: "select" },
      { key: "cc", label: "CC", type: "select" },
    ],
    statusColors: {
      OPEN: BLUE,
      "UNDER REVIEW": AMBER,
      APPROVED: GREEN,
      REJECTED: RED,
      DRAFT: GRAY,
    },
    formFields: [
      "number", "status", "subject", "description", "references", "comments",
      "due-date", "responsible-company", "assigned-to", "cc", "records",
    ],
  },

  submittals: {
    label: "Submittals",
    singularLabel: "Submittal",
    statuses: ["Draft", "Open", "For Review", "Approved", "Revise and Resubmit", "Rejected"],
    sortOptions: COMMON_SORT_OPTIONS,
    defaultSort: "recently-modified",
    addOptions: [
    ],
    batchEditFields: [
      { key: "importance", label: "Importance", type: "select", defaultValue: "None" },
      { key: "status", label: "Status", type: "select" },
      { key: "dueDate", label: "Due date", type: "date" },
      { key: "responsibleCompany", label: "Responsible comp...", type: "select", defaultValue: "None" },
      { key: "assign", label: "Assign", type: "select" },
      { key: "cc", label: "CC", type: "select" },
      { key: "type", label: "Type", type: "select", defaultValue: "None" },
    ],
    statusColors: {
      OPEN: BLUE,
      "FOR REVIEW": AMBER,
      APPROVED: GREEN,
      "REVISE AND RESUBMIT": AMBER,
      REJECTED: RED,
      DRAFT: GRAY,
    },
    formFields: [
      "number", "status", "subject", "description", "references", "comments",
      "due-date", "type", "importance", "responsible-company", "assigned-to", "cc", "records",
    ],
  },
};

/**
 * Resolve a status color regardless of the case the status string is stored in.
 * Tries the value as-is, then uppercased, then lowercased.
 */
export function getStatusColor(config: RecordTypeConfig, status: string): string {
  return (
    config.statusColors[status] ??
    config.statusColors[status.toUpperCase()] ??
    config.statusColors[status.toLowerCase()] ??
    "#6b7280"
  );
}

/** Returns the config for a given type slug, falling back to a safe default. */
export function getRecordTypeConfig(type: string): RecordTypeConfig {
  return (
    RECORD_TYPES[type] ?? {
      label: type,
      singularLabel: type,
      statuses: ["Open", "Closed"],
      sortOptions: COMMON_SORT_OPTIONS,
      defaultSort: "recently-modified",
      addOptions: [{ label: `New ${type}`, iconName: "plus" }],
      batchEditFields: [],
      statusColors: { OPEN: AMBER, CLOSED: GRAY },
      formFields: [
        "number", "status", "description", "references", "comments",
        "due-date", "location", "assigned-to", "cc", "records",
      ],
    }
  );
}
