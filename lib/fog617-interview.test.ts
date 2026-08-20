import { describe, it, expect } from 'vitest';
import {
  DUMP_OPENING_PROMPT,
  applyInterviewTurn,
  answeredFromValues,
  openingQuestion,
  parseFirstNumber,
  parseSpokenDate,
  parseYesNo,
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

  it('starts guided mode on trade partner', () => {
    const first = openingQuestion('guided');
    expect(first.slotId).toBe('tradePartnerName');
    expect(first.prompt).toMatch(/trade company/i);
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
      transcript: 'ALC, six electricians, forty eight hours, STA is done',
      skip: false,
    });

    expect(result.draft.tradePartnerName).toBe('ALC');
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

describe('applyInterviewTurn – guided one question', () => {
  it('applies only the current slot even if extraction has extra fields', () => {
    const result = applyInterviewTurn({
      mode: 'guided',
      draft: {},
      answered: [],
      currentSlotId: 'tradePartnerName',
      extracted: { tradePartnerName: 'ALC', totalHours: 40 },
      transcript: 'ALC, forty hours',
      skip: false,
    });

    expect(result.draft.tradePartnerName).toBe('ALC');
    expect(result.draft.totalHours).toBeUndefined();
    expect(result.answered).toContain('tradePartnerName');
    expect(result.nextSlotId).toBe('date');
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
      answered: ['tradePartnerName', 'date', 'locationDescription', 'crew', 'totalHours'],
      currentSlotId: 'equipment',
      extracted: {},
      transcript: '',
      skip: true,
    });

    expect(result.answered).toContain('equipment');
    expect(result.nextSlotId).toBe('notes');
  });
});

describe('stripTranscriptOnlyNotes', () => {
  it('drops notes that are only the raw transcript when other fields exist', () => {
    const spoken = 'ALC six guys forty hours';
    const result = stripTranscriptOnlyNotes(
      { tradePartnerName: 'ALC', notes: spoken, spokenTranscript: spoken },
      spoken,
    );
    expect(result.notes).toBeUndefined();
    expect(result.tradePartnerName).toBe('ALC');
  });
});

describe('slotHasValue / answeredFromValues', () => {
  it('does not treat staCompleted as answered until a boolean is set', () => {
    expect(slotHasValue({}, 'staCompleted')).toBe(false);
    expect(answeredFromValues({ staCompleted: true })).toContain('staCompleted');
  });
});
