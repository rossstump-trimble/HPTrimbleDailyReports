import type { ExtractedDaily } from '@/lib/extract-response';

export const FOG617_SLOT_IDS = [
  'tradePartnerName',
  'date',
  'locationDescription',
  'crew',
  'totalHours',
  'equipment',
  'notes',
  'staCompleted',
  'emailRecipients',
] as const;

export type Fog617SlotId = (typeof FOG617_SLOT_IDS)[number];
export type InterviewMode = 'guided' | 'dump';

export interface Fog617Slot {
  id: Fog617SlotId;
  prompt: string;
  required: boolean;
}

export const DUMP_OPENING_PROMPT =
  'Tell me your whole daily. Company, date, where you worked, crew and hours, equipment, delays, and whether STA is done.';

export const FOG617_SLOTS: Fog617Slot[] = [
  {
    id: 'tradePartnerName',
    prompt: 'Which trade company is this daily for?',
    required: true,
  },
  {
    id: 'date',
    prompt: 'What date is this daily for? You can say today.',
    required: true,
  },
  {
    id: 'locationDescription',
    prompt: 'Where did you work today, and what did you complete?',
    required: true,
  },
  {
    id: 'crew',
    prompt: 'Walk the crew. What crafts, and how many people?',
    required: true,
  },
  {
    id: 'totalHours',
    prompt: 'How many total hours did the crew work today?',
    required: true,
  },
  {
    id: 'equipment',
    prompt: 'What equipment was on site? Say skip if none.',
    required: false,
  },
  {
    id: 'notes',
    prompt: 'Any delays, coordination issues, or discrepancies? Say skip if none.',
    required: false,
  },
  {
    id: 'staCompleted',
    prompt: 'Was STA completed? Yes or no.',
    required: true,
  },
  {
    id: 'emailRecipients',
    prompt: 'Want an email copy? Say the addresses, or skip.',
    required: false,
  },
];

export function isFog617SlotId(value: unknown): value is Fog617SlotId {
  return typeof value === 'string' && (FOG617_SLOT_IDS as readonly string[]).includes(value);
}

export function parseInterviewMode(value: unknown): InterviewMode {
  return value === 'guided' ? 'guided' : 'dump';
}

export function slotById(id: Fog617SlotId): Fog617Slot {
  const slot = FOG617_SLOTS.find((s) => s.id === id);
  if (!slot) {
    throw new Error(`Unknown FOG617 slot: ${id}`);
  }
  return slot;
}

export function slotHasValue(draft: ExtractedDaily, id: Fog617SlotId): boolean {
  switch (id) {
    case 'tradePartnerName':
      return Boolean(draft.tradePartnerName?.trim());
    case 'date':
      return Boolean(draft.date?.trim());
    case 'locationDescription':
      return Boolean(draft.locationDescription?.trim());
    case 'crew':
      return (draft.workerCount ?? 0) > 0 || (draft.crewBreakdown?.length ?? 0) > 0;
    case 'totalHours':
      return (draft.totalHours ?? 0) > 0;
    case 'equipment':
      return (draft.equipment?.length ?? 0) > 0;
    case 'notes':
      return Boolean(draft.notes?.trim());
    case 'staCompleted':
      return typeof draft.staCompleted === 'boolean';
    case 'emailRecipients':
      return (draft.emailRecipients?.length ?? 0) > 0;
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

export function openingQuestion(mode: InterviewMode): { slotId: Fog617SlotId | null; prompt: string } {
  switch (mode) {
    case 'dump':
      return { slotId: null, prompt: DUMP_OPENING_PROMPT };
    case 'guided':
      return { slotId: FOG617_SLOTS[0].id, prompt: FOG617_SLOTS[0].prompt };
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

function uniqueAnswered(ids: Fog617SlotId[]): Fog617SlotId[] {
  return FOG617_SLOT_IDS.filter((id) => ids.includes(id));
}

export function answeredFromValues(draft: ExtractedDaily): Fog617SlotId[] {
  return FOG617_SLOT_IDS.filter((id) => slotHasValue(draft, id));
}

function nextSlot(
  mode: InterviewMode,
  draft: ExtractedDaily,
  answered: Fog617SlotId[],
): Fog617Slot | null {
  switch (mode) {
    case 'guided':
      return FOG617_SLOTS.find((slot) => !answered.includes(slot.id)) ?? null;
    case 'dump':
      return FOG617_SLOTS.find((slot) => slot.required && !slotHasValue(draft, slot.id)) ?? null;
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

export function parseYesNo(transcript: string): boolean | undefined {
  const text = transcript.toLowerCase();
  if (/\b(yes|yeah|yep|yup|done|complete|completed|we did|affirmative)\b/.test(text)) return true;
  if (/\b(no|nope|not yet|didn'?t|did not|negative)\b/.test(text)) return false;
  return undefined;
}

export function parseFirstNumber(transcript: string): number | undefined {
  const match = transcript.replace(/,/g, '').match(/\d+(?:\.\d+)?/);
  if (!match) return undefined;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : undefined;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function parseSpokenDate(transcript: string): string | undefined {
  if (/\b(today|tonight)\b/i.test(transcript)) return todayISO();
  const iso = transcript.match(/\d{4}-\d{2}-\d{2}/);
  if (iso) return iso[0];
  return undefined;
}

export function parseEmails(transcript: string): string[] {
  const matches = transcript.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
  return matches ?? [];
}

function applyGuidedSlot(
  draft: ExtractedDaily,
  slotId: Fog617SlotId,
  extracted: ExtractedDaily,
  transcript: string,
): ExtractedDaily {
  const next: ExtractedDaily = { ...draft };
  const spoken = transcript.trim();

  switch (slotId) {
    case 'tradePartnerName': {
      next.tradePartnerName = extracted.tradePartnerName?.trim() || spoken || next.tradePartnerName;
      return next;
    }
    case 'date': {
      next.date = extracted.date || parseSpokenDate(spoken) || next.date;
      return next;
    }
    case 'locationDescription': {
      next.locationDescription =
        extracted.locationDescription?.trim() || spoken || next.locationDescription;
      return next;
    }
    case 'crew': {
      if (extracted.crewBreakdown?.length) next.crewBreakdown = extracted.crewBreakdown;
      if (typeof extracted.workerCount === 'number') next.workerCount = extracted.workerCount;
      if (!slotHasValue(next, 'crew')) {
        const count = parseFirstNumber(spoken);
        if (count != null) {
          next.workerCount = count;
          next.crewBreakdown = [{ craft: 'Crew', count }];
        }
      }
      return next;
    }
    case 'totalHours': {
      next.totalHours = extracted.totalHours ?? parseFirstNumber(spoken) ?? next.totalHours;
      return next;
    }
    case 'equipment': {
      if (extracted.equipment?.length) next.equipment = extracted.equipment;
      else if (spoken && !/^skip\b/i.test(spoken)) {
        next.equipment = spoken.split(/,| and /i).map((s) => s.trim()).filter(Boolean);
      }
      return next;
    }
    case 'notes': {
      next.notes = extracted.notes?.trim() || spoken || next.notes;
      return next;
    }
    case 'staCompleted': {
      const parsed = extracted.staCompleted ?? parseYesNo(spoken);
      if (typeof parsed === 'boolean') next.staCompleted = parsed;
      return next;
    }
    case 'emailRecipients': {
      const emails = extracted.emailRecipients?.length
        ? extracted.emailRecipients
        : parseEmails(spoken);
      if (emails.length) next.emailRecipients = emails;
      return next;
    }
    default: {
      const _exhaustive: never = slotId;
      return _exhaustive;
    }
  }
}

export function mergeDumpDraft(base: ExtractedDaily, extracted: ExtractedDaily): ExtractedDaily {
  return {
    ...base,
    ...extracted,
    crewBreakdown:
      extracted.crewBreakdown && extracted.crewBreakdown.length > 0
        ? extracted.crewBreakdown
        : base.crewBreakdown,
    equipment:
      extracted.equipment && extracted.equipment.length > 0 ? extracted.equipment : base.equipment,
    emailRecipients:
      extracted.emailRecipients && extracted.emailRecipients.length > 0
        ? extracted.emailRecipients
        : base.emailRecipients,
    notes: extracted.notes?.trim() ? extracted.notes : base.notes,
    spokenTranscript: [base.spokenTranscript, extracted.spokenTranscript]
      .filter((part): part is string => Boolean(part && part.trim()))
      .join('\n'),
  };
}

function appendTranscript(draft: ExtractedDaily, transcript: string): ExtractedDaily {
  const spoken = transcript.trim();
  if (!spoken) return draft;
  if (draft.spokenTranscript?.includes(spoken)) return draft;
  return {
    ...draft,
    spokenTranscript: [draft.spokenTranscript, spoken].filter(Boolean).join('\n'),
  };
}

export interface InterviewTurnInput {
  mode: InterviewMode;
  draft: ExtractedDaily;
  answered: Fog617SlotId[];
  currentSlotId: Fog617SlotId | null;
  extracted: ExtractedDaily;
  transcript: string;
  skip: boolean;
}

export interface InterviewTurnResult {
  draft: ExtractedDaily;
  answered: Fog617SlotId[];
  nextSlotId: Fog617SlotId | null;
  nextPrompt: string | null;
  done: boolean;
}

export function applyInterviewTurn(input: InterviewTurnInput): InterviewTurnResult {
  const { mode, extracted, transcript, skip } = input;
  let { draft, answered } = input;

  if (skip && input.currentSlotId) {
    const slot = slotById(input.currentSlotId);
    if (!slot.required) {
      answered = uniqueAnswered([...answered, slot.id]);
    }
  } else if (mode === 'dump') {
    draft = mergeDumpDraft(draft, extracted);
    draft = appendTranscript(draft, transcript);
    answered = uniqueAnswered([...answered, ...answeredFromValues(draft)]);
  } else if (input.currentSlotId) {
    const slot = slotById(input.currentSlotId);
    const saidSkip = /^skip\b/i.test(transcript.trim());
    if (!slot.required && saidSkip) {
      answered = uniqueAnswered([...answered, slot.id]);
      draft = appendTranscript(draft, transcript);
    } else {
      draft = applyGuidedSlot(draft, input.currentSlotId, extracted, transcript);
      draft = appendTranscript(draft, transcript);
      if (slotHasValue(draft, input.currentSlotId) || transcript.trim()) {
        answered = uniqueAnswered([...answered, input.currentSlotId]);
      }
    }
  }

  const upcoming = nextSlot(mode, draft, answered);
  return {
    draft,
    answered,
    nextSlotId: upcoming?.id ?? null,
    nextPrompt: upcoming?.prompt ?? null,
    done: upcoming == null,
  };
}

/** Drop notes that are just a copy of the raw transcript when other fields were extracted. */
export function stripTranscriptOnlyNotes(extracted: ExtractedDaily, transcript: string): ExtractedDaily {
  const spoken = transcript.trim();
  if (!spoken || extracted.notes?.trim() !== spoken) return extracted;
  const withoutNotes = { ...extracted };
  delete withoutNotes.notes;
  const hasOther =
    slotHasValue(withoutNotes, 'tradePartnerName') ||
    slotHasValue(withoutNotes, 'locationDescription') ||
    slotHasValue(withoutNotes, 'crew') ||
    slotHasValue(withoutNotes, 'totalHours') ||
    slotHasValue(withoutNotes, 'equipment') ||
    typeof withoutNotes.staCompleted === 'boolean';
  return hasOther ? withoutNotes : extracted;
}
