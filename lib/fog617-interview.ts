import type { ExtractedDaily } from '@/lib/extract-response';

export const FOG617_SLOT_IDS = [
  'tradePartnerName',
  'date',
  'locationDescription',
  'crew',
  'totalHours',
  'tierSubcontractors',
  'tradesAndFavors',
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
  'Tell me your daily report. Date, where you worked, crew and hours, equipment, delays, and whether STA is done.';

export const COMBINED_GUIDED_SLOTS: Fog617Slot[] = [
  {
    id: 'date',
    prompt: 'What date is this report for, and where did you work and what was completed today?',
    required: true,
  },
  {
    id: 'crew',
    prompt: 'Who was on site? Walk the crew crafts, number of workers, and hours worked per person today.',
    required: true,
  },
  {
    id: 'tierSubcontractors',
    prompt: 'Did you have any tier subcontractors on site, and how many people did they have onsite?',
    required: false,
  },
  {
    id: 'notes',
    prompt: 'Any equipment on site, delays or field notes, and was safety STA completed?',
    required: true,
  },
];

export const HP_DUMP_OPENING_PROMPT =
  'Tell me your HP staff daily report. Date, areas inspected, trades and favors done for trade partners, delays, and safety notes.';

export const HP_GUIDED_SLOTS: Fog617Slot[] = [
  {
    id: 'date',
    prompt: 'What date is this report for, what areas did you inspect, and what general work was completed across the jobsite today?',
    required: true,
  },
  {
    id: 'tradesAndFavors',
    prompt: 'What trades and favors were done today? Any equipment loaned, staging help, trade coordination, or favors done for trade partners?',
    required: false,
  },
  {
    id: 'notes',
    prompt: 'Any trade delays, safety observations, or general superintendent notes?',
    required: true,
  },
];

export const FOG617_SLOTS: Fog617Slot[] = [
  {
    id: 'date',
    prompt: 'What date is this report for, and where did you work and what was completed today?',
    required: true,
  },
  {
    id: 'locationDescription',
    prompt: 'Where did you work today, and what did you complete?',
    required: true,
  },
  {
    id: 'crew',
    prompt: 'Who was on site? Walk the crew crafts, number of workers, and total hours worked today.',
    required: true,
  },
  {
    id: 'totalHours',
    prompt: 'How many total hours did the crew work today?',
    required: true,
  },
  {
    id: 'tierSubcontractors',
    prompt: 'Did you have any tier subcontractors on site, and how many people did they have onsite?',
    required: false,
  },
  {
    id: 'equipment',
    prompt: 'What equipment was on site? Say skip if none.',
    required: false,
  },
  {
    id: 'notes',
    prompt: 'Any equipment on site, delays or field notes, and was safety STA completed?',
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
  const slot =
    HP_GUIDED_SLOTS.find((s) => s.id === id) ??
    COMBINED_GUIDED_SLOTS.find((s) => s.id === id) ??
    FOG617_SLOTS.find((s) => s.id === id);
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
    case 'tierSubcontractors':
      return Boolean(
        (draft.tierSubcontractors && draft.tierSubcontractors.length > 0) ||
        draft.tierSubsSummary?.trim(),
      );
    case 'tradesAndFavors':
      return Boolean(draft.tradesAndFavors?.trim());
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

export interface InterviewQuestion {
  slotId: Fog617SlotId | null;
  prompt: string;
}

export const DUMP_ANSWER_KEY = '__dump' as const;
export type InterviewAnswerKey = Fog617SlotId | typeof DUMP_ANSWER_KEY;

export function answerKeyForSlot(slotId: Fog617SlotId | null): InterviewAnswerKey {
  return slotId ?? DUMP_ANSWER_KEY;
}

export function interviewQuestions(mode: InterviewMode, audience?: 'trade' | 'hp'): InterviewQuestion[] {
  const sourceSlots = audience === 'hp' ? HP_GUIDED_SLOTS : COMBINED_GUIDED_SLOTS;
  const dumpOpening = audience === 'hp' ? HP_DUMP_OPENING_PROMPT : DUMP_OPENING_PROMPT;
  const slots: InterviewQuestion[] = sourceSlots.map((slot) => ({
    slotId: slot.id,
    prompt: slot.prompt,
  }));
  switch (mode) {
    case 'dump':
      return [{ slotId: null, prompt: dumpOpening }, ...slots];
    case 'guided':
      return slots;
    default: {
      const _exhaustive: never = mode;
      return _exhaustive;
    }
  }
}

export function questionIndex(mode: InterviewMode, slotId: Fog617SlotId | null, audience?: 'trade' | 'hp'): number {
  const idx = interviewQuestions(mode, audience).findIndex((question) => question.slotId === slotId);
  return idx >= 0 ? idx : 0;
}

export function adjacentQuestion(
  mode: InterviewMode,
  slotId: Fog617SlotId | null,
  direction: 'back' | 'forward',
  audience?: 'trade' | 'hp',
): InterviewQuestion | null {
  const questions = interviewQuestions(mode, audience);
  const idx = questionIndex(mode, slotId, audience);
  switch (direction) {
    case 'back':
      return questions[idx - 1] ?? null;
    case 'forward':
      return questions[idx + 1] ?? null;
    default: {
      const _exhaustive: never = direction;
      return _exhaustive;
    }
  }
}

export function openingQuestion(mode: InterviewMode, audience?: 'trade' | 'hp'): InterviewQuestion {
  const first = interviewQuestions(mode, audience)[0];
  if (!first) {
    throw new Error('Interview has no questions');
  }
  return first;
}

export function requiredSlotsFilled(draft: ExtractedDaily): boolean {
  return (
    slotHasValue(draft, 'date') &&
    slotHasValue(draft, 'locationDescription') &&
    slotHasValue(draft, 'crew') &&
    slotHasValue(draft, 'totalHours') &&
    slotHasValue(draft, 'staCompleted')
  );
}

export interface InterviewFieldPreview {
  id: Fog617SlotId;
  label: string;
  value: string;
  required: boolean;
  complete: boolean;
}

function slotPreviewLabel(id: Fog617SlotId): string {
  switch (id) {
    case 'tradePartnerName':
      return 'Trade partner';
    case 'date':
      return 'Date';
    case 'locationDescription':
      return 'Location / work';
    case 'crew':
      return 'Crew';
    case 'totalHours':
      return 'Total hours';
    case 'tierSubcontractors':
      return 'Tier subcontractors';
    case 'tradesAndFavors':
      return 'Trades & favors';
    case 'equipment':
      return 'Equipment';
    case 'notes':
      return 'Notes / delays';
    case 'staCompleted':
      return 'STA completed';
    case 'emailRecipients':
      return 'Email copy';
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

function slotPreviewValue(draft: ExtractedDaily, id: Fog617SlotId): string {
  switch (id) {
    case 'tradePartnerName':
      return draft.tradePartnerName?.trim() || '';
    case 'date':
      return draft.date?.trim() || '';
    case 'locationDescription':
      return draft.locationDescription?.trim() || '';
    case 'crew': {
      const breakdown = (draft.crewBreakdown ?? [])
        .filter((row) => row.craft)
        .map((row) => `${row.craft} (${row.count})`)
        .join(', ');
      if (breakdown) return breakdown;
      return (draft.workerCount ?? 0) > 0 ? `${draft.workerCount} workers` : '';
    }
    case 'totalHours':
      return (draft.totalHours ?? 0) > 0 ? String(draft.totalHours) : '';
    case 'tierSubcontractors': {
      if (draft.tierSubcontractors && draft.tierSubcontractors.length > 0) {
        return draft.tierSubcontractors
          .map((sub) => `${sub.name} (${sub.count})`)
          .join(', ');
      }
      return draft.tierSubsSummary?.trim() || '';
    }
    case 'tradesAndFavors':
      return draft.tradesAndFavors?.trim() || '';
    case 'equipment':
      return (draft.equipment ?? []).filter(Boolean).join(', ');
    case 'notes':
      return draft.notes?.trim() || '';
    case 'staCompleted':
      return typeof draft.staCompleted === 'boolean' ? (draft.staCompleted ? 'Yes' : 'No') : '';
    case 'emailRecipients':
      return (draft.emailRecipients ?? []).filter(Boolean).join(', ');
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

export function interviewFieldPreview(draft: ExtractedDaily, audience?: 'trade' | 'hp'): InterviewFieldPreview[] {
  const slots = audience === 'hp' ? HP_GUIDED_SLOTS : FOG617_SLOTS;
  return slots.map((slot) => ({
    id: slot.id,
    label: slotPreviewLabel(slot.id),
    value: slotPreviewValue(draft, slot.id),
    required: slot.required,
    complete: slotHasValue(draft, slot.id),
  }));
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
  audience?: 'trade' | 'hp',
): Fog617Slot | null {
  const sourceSlots = audience === 'hp' ? HP_GUIDED_SLOTS : COMBINED_GUIDED_SLOTS;
  switch (mode) {
    case 'guided':
      return sourceSlots.find((slot) => !answered.includes(slot.id)) ?? null;
    case 'dump':
      return (
        sourceSlots.find((slot) => {
          if (answered.includes(slot.id)) return false;
          if (audience === 'hp') {
            if (slot.id === 'date') return !slotHasValue(draft, 'date');
            if (slot.id === 'notes') return !slotHasValue(draft, 'notes');
            return false;
          }
          if (slot.id === 'date') {
            return !slotHasValue(draft, 'date') || !slotHasValue(draft, 'locationDescription');
          }
          if (slot.id === 'crew') {
            return !slotHasValue(draft, 'crew') || !slotHasValue(draft, 'totalHours');
          }
          if (slot.id === 'notes') {
            return !slotHasValue(draft, 'staCompleted');
          }
          return false;
        }) ?? null
      );
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
  let next: ExtractedDaily = { ...draft };
  const spoken = transcript.trim();

  // Always merge any fields extracted by AI anywhere in the transcript
  next = mergeDumpDraft(next, extracted);

  const spokenEmails = parseEmails(spoken);
  if (spokenEmails.length > 0) {
    next.emailRecipients = Array.from(new Set([...(next.emailRecipients ?? []), ...spokenEmails]));
  }

  switch (slotId) {
    case 'date': {
      // Combined Q1: Date & Work / Location
      next.date = extracted.date || parseSpokenDate(spoken) || next.date || todayISO();
      if (!next.locationDescription?.trim() && spoken && !/^skip\b/i.test(spoken)) {
        next.locationDescription = extracted.locationDescription?.trim() || spoken;
      }
      return next;
    }
    case 'crew': {
      // Combined Q2: Crew Crafts, Count & Hours per person
      if (!slotHasValue(next, 'crew')) {
        const count = parseFirstNumber(spoken);
        if (count != null) {
          next.workerCount = count;
          next.crewBreakdown = [{ craft: 'Crew', count }];
        }
      }
      if (!slotHasValue(next, 'totalHours')) {
        const hrMatch = spoken.match(/(\d+(?:\.\d+)?)\s*(?:hours|hrs|hr)\b/i);
        if (hrMatch) {
          const parsedHr = parseFloat(hrMatch[1]);
          const workers = next.workerCount || 1;
          if (parsedHr <= 24 && workers > 1) {
            next.totalHours = workers * parsedHr;
          } else {
            next.totalHours = parsedHr;
          }
        } else if (next.workerCount) {
          next.totalHours = next.workerCount * 8;
        }
      }
      return next;
    }
    case 'tierSubcontractors': {
      if (extracted.tierSubcontractors?.length) {
        next.tierSubcontractors = extracted.tierSubcontractors;
      }
      if (extracted.tierSubsSummary) {
        next.tierSubsSummary = extracted.tierSubsSummary;
      }
      const spokenLower = spoken.toLowerCase();
      const isNegative = /\b(no|none|nope|no tier|zero|did not|didn'?t|not today|nobody|just us)\b/i.test(spokenLower);
      if (isNegative) {
        next.tierSubsSummary = 'None';
        if (!next.tierSubcontractors?.length) {
          next.tierSubcontractors = [];
        }
      } else if (spoken && !/^skip\b/i.test(spoken)) {
        if (!next.tierSubsSummary) {
          next.tierSubsSummary = spoken;
        }
        if (!next.tierSubcontractors?.length) {
          const count = parseFirstNumber(spoken);
          if (count != null && count > 0) {
            const cleanedName = spoken
              .replace(/\b(yes|yeah|we had|there were|subcontractors?|tier|on site|onsite|workers?|people|guys|headcount)\b/gi, '')
              .replace(/\d+/g, '')
              .trim();
            next.tierSubcontractors = [
              {
                name: cleanedName || 'Tier Subcontractor',
                count,
                trade: 'Subcontractor',
              },
            ];
          }
        }
      }
      return next;
    }
    case 'tradesAndFavors': {
      if (extracted.tradesAndFavors?.trim()) {
        next.tradesAndFavors = extracted.tradesAndFavors.trim();
      } else if (spoken && !/^skip\b/i.test(spoken)) {
        next.tradesAndFavors = spoken;
      }
      return next;
    }
    case 'notes': {
      // Combined Q3: Equipment, Notes/Delays & Safety (STA)
      const parsedSta = extracted.staCompleted ?? parseYesNo(spoken);
      if (typeof parsedSta === 'boolean') {
        next.staCompleted = parsedSta;
      }
      if (!next.notes?.trim() && spoken && !/^skip\b/i.test(spoken) && parseYesNo(spoken) === undefined) {
        next.notes = spoken;
      }
      return next;
    }
    case 'tradePartnerName': {
      next.tradePartnerName = extracted.tradePartnerName?.trim() || spoken || next.tradePartnerName;
      return next;
    }
    case 'locationDescription': {
      next.locationDescription =
        extracted.locationDescription?.trim() || spoken || next.locationDescription;
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
    tierSubcontractors:
      extracted.tierSubcontractors && extracted.tierSubcontractors.length > 0
        ? extracted.tierSubcontractors
        : base.tierSubcontractors,
    tierSubsSummary:
      extracted.tierSubsSummary?.trim() ? extracted.tierSubsSummary : base.tierSubsSummary,
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
  /** When false, keep the interviewer on the current question after saving an edit. */
  advance?: boolean;
  audience?: 'trade' | 'hp';
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
    answered = uniqueAnswered([...answered, input.currentSlotId]);
    if (input.currentSlotId === 'date') {
      answered = uniqueAnswered([...answered, 'date', 'locationDescription']);
    } else if (input.currentSlotId === 'crew') {
      answered = uniqueAnswered([...answered, 'crew', 'totalHours']);
    } else if (input.currentSlotId === 'notes') {
      answered = uniqueAnswered([...answered, 'notes', 'equipment', 'staCompleted']);
    }
  } else if (mode === 'dump') {
    draft = mergeDumpDraft(draft, extracted);
    draft = appendTranscript(draft, transcript);
    answered = uniqueAnswered([...answered, ...answeredFromValues(draft)]);
  } else if (input.currentSlotId) {
    const slot = slotById(input.currentSlotId);
    const saidSkip = /^skip\b/i.test(transcript.trim());
    if (saidSkip) {
      answered = uniqueAnswered([...answered, slot.id]);
      if (input.currentSlotId === 'date') {
        answered = uniqueAnswered([...answered, 'date', 'locationDescription']);
      } else if (input.currentSlotId === 'crew') {
        answered = uniqueAnswered([...answered, 'crew', 'totalHours']);
      } else if (input.currentSlotId === 'notes') {
        answered = uniqueAnswered([...answered, 'notes', 'equipment', 'staCompleted']);
      }
      draft = appendTranscript(draft, transcript);
    } else {
      draft = applyGuidedSlot(draft, input.currentSlotId, extracted, transcript);
      draft = appendTranscript(draft, transcript);
      answered = uniqueAnswered([...answered, input.currentSlotId]);
      if (input.currentSlotId === 'date') {
        answered = uniqueAnswered([...answered, 'date', 'locationDescription']);
      } else if (input.currentSlotId === 'crew') {
        answered = uniqueAnswered([...answered, 'crew', 'totalHours']);
      } else if (input.currentSlotId === 'notes') {
        answered = uniqueAnswered([...answered, 'notes', 'equipment', 'staCompleted']);
      }
    }
  }

  if (input.advance === false) {
    if (input.currentSlotId) {
      const slot = slotById(input.currentSlotId);
      return {
        draft,
        answered,
        nextSlotId: slot.id,
        nextPrompt: slot.prompt,
        done: false,
      };
    }
    return {
      draft,
      answered,
      nextSlotId: null,
      nextPrompt: DUMP_OPENING_PROMPT,
      done: false,
    };
  }

  const upcoming = nextSlot(mode, draft, answered, input.audience);
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
