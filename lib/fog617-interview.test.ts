import { describe, it, expect } from 'vitest';
import {
  DUMP_ANSWER_KEY,
  DUMP_OPENING_PROMPT,
  adjacentQuestion,
  applyInterviewTurn,
  answerKeyForSlot,
  answeredFromValues,
  interviewQuestions,
  openingQuestion,
  parseFirstNumber,
  parseSpokenDate,
  parseYesNo,
  questionIndex,
  requiredSlotsFilled,
  interviewFieldPreview,
  slotHasValue,
  stripTranscriptOnlyNotes,
} from './fog617-interview';

describe('openingQuestion', () => {
  it('starts dump mode with the whole-daily prompt', () => {
    expect(openingQuestion('dump')).toEqual({
      slotId: null,
      prompt: DUMP_OPENING_PROMPT,
    });
  });

  it('starts guided mode directly on report date', () => {
    const first = openingQuestion('guided');
    expect(first.slotId).toBe('date');
    expect(first.prompt).toMatch(/date/i);
  });
});

describe('parse helpers', () => {
  it('parses STA yes/no', () => {
    expect(parseYesNo('yeah STA is done')).toBe(true);
    expect(parseYesNo('no not yet')).toBe(false);
    expect(parseYesNo('six electricians')).toBeUndefined();
  });

  it('parses the first number from crew talk', () => {
    expect(parseFirstNumber('we had 8 guys')).toBe(8);
  });

  it('treats today as an ISO date', () => {
    expect(parseSpokenDate('today')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('applyInterviewTurn – dump then gaps', () => {
  it('fills several slots from one dump and asks the next required gap', () => {
    const result = applyInterviewTurn({
      mode: 'dump',
      draft: {},
      answered: [],
      currentSlotId: null,
      extracted: {
        tradePartnerName: 'ALC',
        workerCount: 6,
        totalHours: 48,
        staCompleted: true,
      },
      transcript: 'six electricians, forty eight hours, STA is done',
      skip: false,
    });

    expect(result.draft.totalHours).toBe(48);
    expect(result.done).toBe(false);
    expect(result.nextSlotId).toBe('date');
  });

  it('is done when all required slots have values', () => {
    const result = applyInterviewTurn({
      mode: 'dump',
      draft: {
        tradePartnerName: 'ALC',
        date: '2026-08-20',
        locationDescription: 'Building A',
        workerCount: 4,
        totalHours: 32,
        staCompleted: true,
      },
      answered: [],
      currentSlotId: null,
      extracted: {},
      transcript: '',
      skip: false,
    });
    expect(result.done).toBe(true);
    expect(result.nextPrompt).toBeNull();
  });
});

describe('applyInterviewTurn – guided combined questions', () => {
  it('applies slot and merges all extracted fields from the response', () => {
    const result = applyInterviewTurn({
      mode: 'guided',
      draft: {},
      answered: [],
      currentSlotId: 'date',
      extracted: { date: '2026-08-20', totalHours: 40 },
      transcript: 'today, forty hours',
      skip: false,
    });

    expect(result.draft.date).toBe('2026-08-20');
    expect(result.draft.totalHours).toBe(40);
    expect(result.answered).toContain('date');
    expect(result.nextSlotId).toBe('crew');
  });

  it('skips an optional slot', () => {
    const result = applyInterviewTurn({
      mode: 'guided',
      draft: {
        tradePartnerName: 'ALC',
        date: '2026-08-20',
        locationDescription: 'Roof',
        workerCount: 4,
        totalHours: 32,
      },
      answered: ['date', 'locationDescription', 'crew', 'totalHours', 'tierSubcontractors'],
      currentSlotId: 'notes',
      extracted: {},
      transcript: '',
      skip: true,
    });

    expect(result.answered).toContain('notes');
    expect(result.nextSlotId).toBeNull();
    expect(result.done).toBe(true);
  });

  it('lets them skip a question and move to the next question', () => {
    const result = applyInterviewTurn({
      mode: 'guided',
      draft: {},
      answered: [],
      currentSlotId: 'date',
      extracted: {},
      transcript: '',
      skip: true,
    });

    expect(result.answered).toContain('date');
    expect(result.draft.date).toBeUndefined();
    expect(result.nextSlotId).toBe('crew');
    expect(result.done).toBe(false);
  });

  it('lets dump follow-up skip a required gap', () => {
    const result = applyInterviewTurn({
      mode: 'dump',
      draft: { workerCount: 6, totalHours: 48 },
      answered: ['crew'],
      currentSlotId: 'date',
      extracted: {},
      transcript: '',
      skip: true,
    });

    expect(result.answered).toContain('date');
    expect(result.nextSlotId).toBe('notes');
    expect(result.done).toBe(false);
  });
});

describe('stripTranscriptOnlyNotes', () => {
  it('drops notes that are only the raw transcript when other fields exist', () => {
    const spoken = 'six guys forty hours';
    const result = stripTranscriptOnlyNotes(
      { workerCount: 6, totalHours: 40, notes: spoken, spokenTranscript: spoken },
      spoken,
    );
    expect(result.notes).toBeUndefined();
    expect(result.workerCount).toBe(6);
  });
});

describe('slotHasValue / answeredFromValues', () => {
  it('does not treat staCompleted as answered until a boolean is set', () => {
    expect(slotHasValue({}, 'staCompleted')).toBe(false);
    expect(answeredFromValues({ staCompleted: true })).toContain('staCompleted');
  });
});

describe('interview question navigation', () => {
  it('walks guided questions in combined order starting from date to crew to tierSubcontractors to notes', () => {
    const first = openingQuestion('guided');
    expect(first.slotId).toBe('date');
    const next = adjacentQuestion('guided', first.slotId, 'forward');
    expect(next?.slotId).toBe('crew');
    const third = adjacentQuestion('guided', 'crew', 'forward');
    expect(third?.slotId).toBe('tierSubcontractors');
    const fourth = adjacentQuestion('guided', 'tierSubcontractors', 'forward');
    expect(fourth?.slotId).toBe('notes');
    expect(adjacentQuestion('guided', 'notes', 'forward')).toBeNull();
    expect(adjacentQuestion('guided', first.slotId, 'back')).toBeNull();
  });

  it('puts the dump opening before the slot list', () => {
    const questions = interviewQuestions('dump');
    expect(questions[0]).toEqual({ slotId: null, prompt: DUMP_OPENING_PROMPT });
    expect(questions[1]?.slotId).toBe('date');
    expect(adjacentQuestion('dump', null, 'forward')?.slotId).toBe('date');
    expect(adjacentQuestion('dump', 'date', 'back')?.slotId).toBeNull();
  });

  it('maps dump answers onto a dedicated key', () => {
    expect(answerKeyForSlot(null)).toBe(DUMP_ANSWER_KEY);
    expect(answerKeyForSlot('crew')).toBe('crew');
    expect(questionIndex('guided', 'crew')).toBeGreaterThan(0);
  });
});

describe('requiredSlotsFilled', () => {
  it('is false until every required slot has a value', () => {
    expect(requiredSlotsFilled({ date: '2026-08-20' })).toBe(false);
    expect(
      requiredSlotsFilled({
        tradePartnerName: 'ALC',
        date: '2026-08-20',
        locationDescription: 'Roof',
        workerCount: 4,
        totalHours: 32,
        staCompleted: true,
      }),
    ).toBe(true);
  });
});

describe('interviewFieldPreview', () => {
  it('marks missing required fields and filled values', () => {
    const rows = interviewFieldPreview({
      workerCount: 12,
    });
    const hours = rows.find((row) => row.id === 'totalHours');
    expect(hours?.complete).toBe(false);
    expect(hours?.required).toBe(true);
  });
});

describe('applyInterviewTurn – stay on current question', () => {
  it('keeps the current slot after an edited transcript', () => {
    const result = applyInterviewTurn({
      mode: 'guided',
      draft: {},
      answered: [],
      currentSlotId: 'date',
      extracted: { date: '2026-08-20' },
      transcript: '2026-08-20',
      skip: false,
      advance: false,
    });

    expect(result.draft.date).toBe('2026-08-20');
    expect(result.nextSlotId).toBe('date');
    expect(result.nextPrompt).toMatch(/date/i);
    expect(result.done).toBe(false);
  });
});
