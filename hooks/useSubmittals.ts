export type SubmittalStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "approved_as_noted"
  | "rejected"
  | "resubmit";

export interface Submittal {
  id: string;
  project_id: string;
  title: string;
  spec_section: string | null;
  status: SubmittalStatus;
  linked_activity_id: string | null;
}

export function useSubmittals(_projectId?: string) {
  return { data: [] as Submittal[] };
}
