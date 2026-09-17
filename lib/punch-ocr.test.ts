import { describe, it, expect } from 'vitest';
import { buildPunchExtractionPrompt, parsePunchOcrResponse } from './punch-ocr';

describe('Punch List Multimodal OCR Service', () => {
  it('builds grounded prompt with known trades and open punch items', () => {
    const prompt = buildPunchExtractionPrompt({
      knownTrades: ['Three Star Drywall', 'Apex Painting'],
      openItems: [
        { id: 'p-1', itemNumber: 'P-101', description: 'Drywall crack', tradeName: 'Three Star Drywall' },
      ],
    });

    expect(prompt).toContain('Three Star Drywall');
    expect(prompt).toContain('Apex Painting');
    expect(prompt).toContain('P-101');
    expect(prompt).toContain('Drywall crack');
    expect(prompt).toContain('"action": "create" | "resolve"');
  });

  it('parses valid JSON response with create and resolve items', () => {
    const jsonStr = JSON.stringify({
      sheetType: 'mixed',
      items: [
        {
          action: 'resolve',
          targetItemNumber: 'P-101',
          description: 'Drywall crack patched and sanded',
          tradeName: 'Three Star Drywall',
          locationDescription: 'Room 204',
          status: 'resolved',
          importance: 'high',
          confidence: 0.95,
        },
        {
          action: 'create',
          description: 'Touch up trim paint',
          tradeName: 'Apex Painting',
          locationDescription: 'Corridor B',
          status: 'open',
          importance: 'low',
          confidence: 0.88,
        },
      ],
    });

    const parsed = parsePunchOcrResponse(jsonStr);
    expect(parsed.items.length).toBe(2);
    expect(parsed.items[0].action).toBe('resolve');
    expect(parsed.items[0].targetItemNumber).toBe('P-101');
    expect(parsed.items[1].action).toBe('create');
  });

  it('handles malformed JSON with safe fallback', () => {
    const parsed = parsePunchOcrResponse('invalid json text');
    expect(parsed.items).toEqual([]);
    expect(parsed.success).toBe(false);
  });
});
