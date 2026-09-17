import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildInspectionExtractionPrompt,
  parseInspectionOcrResponse,
  extractInspectionSheet,
} from './inspection-ocr';
import type { InspectionRecord } from '@/types/inspections';

describe('inspection-ocr service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('buildInspectionExtractionPrompt includes known checklists', () => {
    const known: InspectionRecord[] = [
      {
        id: 'ck-1',
        projectId: '1025',
        number: 'CK-0042',
        title: 'Pre-Pour Concrete Inspection',
        status: 'open',
        items: [
          { id: 'i-1', itemNumber: 1, prompt: 'Rebar placement', result: 'Unchecked' },
        ],
        source: 'projectsight',
        createdAt: '2026-09-17T00:00:00.000Z',
        updatedAt: '2026-09-17T00:00:00.000Z',
      },
    ];

    const prompt = buildInspectionExtractionPrompt(known);
    expect(prompt).toContain('CK-0042');
    expect(prompt).toContain('Rebar placement');
  });

  it('parseInspectionOcrResponse parses valid model JSON output', () => {
    const jsonStr = `\`\`\`json
{
  "checklistNumber": "CK-0042",
  "title": "Pre-Pour Concrete Inspection",
  "inspectorName": "Jane Doe",
  "overallConfidence": 0.94,
  "items": [
    {
      "itemNumber": 1,
      "prompt": "Rebar placement verified",
      "result": "Pass",
      "comment": "All clear",
      "confidence": 0.96,
      "needsReview": false
    },
    {
      "itemNumber": 2,
      "prompt": "Formwork cleaned",
      "result": "Fail",
      "comment": "Debris in corner",
      "confidence": 0.70,
      "needsReview": true
    }
  ]
}
\`\`\``;

    const res = parseInspectionOcrResponse(jsonStr);
    expect(res.checklistNumber).toBe('CK-0042');
    expect(res.items.length).toBe(2);
    expect(res.items[0].result).toBe('Pass');
    expect(res.items[1].result).toBe('Fail');
    expect(res.items[1].needsReview).toBe(true);
  });

  it('extractInspectionSheet returns fixture extraction when forceFixture is true', async () => {
    const known: InspectionRecord[] = [
      {
        id: 'ck-fix',
        projectId: '1025',
        number: 'CK-0042',
        title: 'Pre-Pour Concrete Inspection',
        status: 'open',
        items: [
          { id: 'it-1', itemNumber: 1, prompt: 'Rebar placement verified', result: 'Unchecked' },
        ],
        source: 'projectsight',
        createdAt: '2026-09-17T00:00:00.000Z',
        updatedAt: '2026-09-17T00:00:00.000Z',
      },
    ];

    const buf = Buffer.from('fake-image-bytes');
    const result = await extractInspectionSheet(buf, 'image/jpeg', 'sheet.jpg', known, true);

    expect(result.checklistNumber).toBe('CK-0042');
    expect(result.items.length).toBe(1);
    expect(result.items[0].result).toBe('Pass');
  });
});
