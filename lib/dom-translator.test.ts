// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDomTranslator, isTranslatable, type DomTranslator } from './dom-translator';

const SPANISH: Record<string, string> = {
  'Submit Daily Report': 'Enviar informe diario',
  'Your Trade Company': 'Su empresa contratista',
  'Or type company name': 'O escriba el nombre de la empresa',
  Form: 'Formulario',
};

function fakeFetch() {
  return vi.fn(async (_language: string, strings: string[]) => {
    const out: Record<string, string> = {};
    for (const s of strings) if (SPANISH[s]) out[s] = SPANISH[s];
    return out;
  });
}

describe('isTranslatable', () => {
  it('skips numbers, dates, emails, urls and file names', () => {
    expect(isTranslatable('2026-11-19')).toBe(false);
    expect(isTranslatable('12')).toBe(false);
    expect(isTranslatable('foreman@trade.com')).toBe(false);
    expect(isTranslatable('IMG_0042.jpg')).toBe(false);
    expect(isTranslatable('https://hp-trimble-lab.com/intake')).toBe(false);
  });

  it('accepts ordinary wording, including single words', () => {
    expect(isTranslatable('Form')).toBe(true);
    expect(isTranslatable('Submit Daily Report')).toBe(true);
  });
});

describe('createDomTranslator', () => {
  let root: HTMLElement;
  let translator: DomTranslator;
  let fetchTranslations: ReturnType<typeof fakeFetch>;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
    fetchTranslations = fakeFetch();
    translator = createDomTranslator(root, fetchTranslations);
  });

  afterEach(() => {
    translator.destroy();
    root.remove();
  });

  it('translates text and attributes while keeping surrounding whitespace', async () => {
    root.innerHTML = `<label>  Your Trade Company </label><input placeholder="Or type company name">`;

    translator.setLanguage('es');

    await vi.waitFor(() => {
      expect(root.querySelector('label')?.textContent).toBe('  Su empresa contratista ');
    });
    expect(root.querySelector('input')?.getAttribute('placeholder')).toBe('O escriba el nombre de la empresa');
  });

  it('leaves entered content, translate="no" content and identifiers alone', async () => {
    root.innerHTML = `
      <textarea>Form</textarea>
      <span translate="no">Form</span>
      <span id="mail">foreman@trade.com</span>
      <span id="real">Form</span>`;

    translator.setLanguage('es');

    await vi.waitFor(() => expect(root.querySelector('#real')?.textContent).toBe('Formulario'));
    expect(root.querySelector('textarea')?.textContent).toBe('Form');
    expect(root.querySelector('[translate="no"]')?.textContent).toBe('Form');
    expect(root.querySelector('#mail')?.textContent).toBe('foreman@trade.com');
  });

  it('asks for each distinct string once, even when it appears many times', async () => {
    root.innerHTML = `<b>Form</b><i>Form</i><u>Form</u>`;

    translator.setLanguage('es');

    await vi.waitFor(() => expect(root.querySelector('u')?.textContent).toBe('Formulario'));
    expect(fetchTranslations).toHaveBeenCalledTimes(1);
    expect(fetchTranslations.mock.calls[0][1]).toEqual(['Form']);
  });

  it('restores the original English when switching back', async () => {
    root.innerHTML = `<b>Form</b>`;
    translator.setLanguage('es');
    await vi.waitFor(() => expect(root.querySelector('b')?.textContent).toBe('Formulario'));

    translator.setLanguage('en');

    expect(root.querySelector('b')?.textContent).toBe('Form');
  });

  it('translates nodes added later and text the app changes after translation', async () => {
    root.innerHTML = `<b>Form</b>`;
    translator.setLanguage('es');
    await vi.waitFor(() => expect(root.querySelector('b')?.textContent).toBe('Formulario'));

    const added = document.createElement('p');
    added.textContent = 'Submit Daily Report';
    root.appendChild(added);
    await vi.waitFor(() => expect(added.textContent).toBe('Enviar informe diario'));

    const textNode = root.querySelector('b')!.firstChild as Text;
    textNode.nodeValue = 'Your Trade Company';
    await vi.waitFor(() => expect(textNode.nodeValue).toBe('Su empresa contratista'));
  });

  it('does not ask again for a string the service could not translate', async () => {
    root.innerHTML = `<b>Unknown wording</b>`;
    translator.setLanguage('es');
    await vi.waitFor(() => expect(fetchTranslations).toHaveBeenCalledTimes(1));

    const added = document.createElement('i');
    added.textContent = 'Unknown wording';
    root.appendChild(added);
    await new Promise((resolve) => setTimeout(resolve, 120));

    expect(fetchTranslations).toHaveBeenCalledTimes(1);
    expect(added.textContent).toBe('Unknown wording');
  });

  it('translates a single string on demand for spoken prompts', async () => {
    translator.setLanguage('es');

    expect(await translator.translateText('Submit Daily Report')).toBe('Enviar informe diario');
    expect(await translator.translateText('Not in the dictionary')).toBe('Not in the dictionary');
  });

  it('returns the text unchanged while the language is English', async () => {
    expect(await translator.translateText('Submit Daily Report')).toBe('Submit Daily Report');
    expect(fetchTranslations).not.toHaveBeenCalled();
  });
});
