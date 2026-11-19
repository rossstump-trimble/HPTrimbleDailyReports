export type FetchTranslations = (
  language: string,
  strings: string[],
) => Promise<Record<string, string>>;

export interface DomTranslator {
  setLanguage: (language: string) => void;
  /** Translates one string with the same cache the page uses; resolves to the input when unavailable. */
  translateText: (text: string) => Promise<string>;
  destroy: () => void;
}

const TRANSLATED_ATTRIBUTES = ['placeholder', 'title', 'aria-label', 'alt'];
// Typed or entered content must never be rewritten, only the app's own wording.
const SKIPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'PRE', 'SVG']);
// Small chunks are requested in parallel: model latency grows with output size, so one big request leaves the page in English far longer.
const FETCH_BATCH_SIZE = 12;
const FLUSH_DELAY_MS = 20;
const RESCAN_DELAY_MS = 30;
const MAX_TRACKED_SLOTS = 3000;
const LETTER_PATTERN = new RegExp('\\p{L}', 'u');

export function isTranslatable(text: string): boolean {
  const trimmed = text.trim();
  if (!LETTER_PATTERN.test(trimmed)) return false;
  // Emails, URLs and file names are identifiers, not wording.
  if (/^\S+$/.test(trimmed) && /[@/\\]|\.[a-z]{2,4}$/i.test(trimmed)) return false;
  return true;
}

interface Slot {
  read: () => string;
  write: (value: string) => void;
  node: Node;
  stateKey: string;
}

interface SlotState {
  original: string;
  applied: string | null;
}

const TEXT_STATE_KEY = '#text';

function isNoTranslate(el: Element | null): boolean {
  return Boolean(el?.closest('[translate="no"]'));
}

function hasUntranslatableChildren(el: Element): boolean {
  return SKIPPED_TAGS.has(el.tagName.toUpperCase());
}

/**
 * Translates the visible wording under `root` by rewriting text and a few attributes in place.
 * It never adds or removes nodes, so React can keep reconciling the same DOM; when React
 * changes a translated string, the new English is detected and translated again.
 */
export function createDomTranslator(
  root: HTMLElement,
  fetchTranslations: FetchTranslations,
  onBusyChange?: (busy: boolean) => void,
): DomTranslator {
  let language = 'en';
  const caches = new Map<string, Map<string, string>>();
  const requested = new Map<string, Set<string>>();
  const states = new WeakMap<Node, Record<string, SlotState>>();
  let tracked: Slot[] = [];
  const pending = new Map<string, Slot[]>();
  const inFlight = new Map<string, Slot[]>();
  const dirty = new Set<Node>();
  let flushTimer: ReturnType<typeof setTimeout> | null = null;
  let rescanTimer: ReturnType<typeof setTimeout> | null = null;
  let busy = false;

  const notifyBusy = (): void => {
    const next = pending.size > 0 || inFlight.size > 0;
    if (next === busy) return;
    busy = next;
    onBusyChange?.(next);
  };

  const cacheFor = (lang: string): Map<string, string> => {
    let cache = caches.get(lang);
    if (!cache) {
      cache = new Map();
      caches.set(lang, cache);
    }
    return cache;
  };

  const requestedFor = (lang: string): Set<string> => {
    let set = requested.get(lang);
    if (!set) {
      set = new Set();
      requested.set(lang, set);
    }
    return set;
  };

  const getState = (slot: Slot): SlotState | undefined => states.get(slot.node)?.[slot.stateKey];

  const setState = (slot: Slot, state: SlotState): void => {
    const forNode = states.get(slot.node) ?? {};
    forNode[slot.stateKey] = state;
    states.set(slot.node, forNode);
  };

  const textSlot = (node: Text): Slot => ({
    node,
    stateKey: TEXT_STATE_KEY,
    read: () => node.nodeValue ?? '',
    write: (value) => {
      node.nodeValue = value;
    },
  });

  const attributeSlot = (el: Element, attribute: string): Slot => ({
    node: el,
    stateKey: attribute,
    read: () => el.getAttribute(attribute) ?? '',
    write: (value) => el.setAttribute(attribute, value),
  });

  const collectSlots = (node: Node, out: Slot[]): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      out.push(textSlot(node as Text));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    if (el.getAttribute('translate') === 'no') return;
    for (const attribute of TRANSLATED_ATTRIBUTES) {
      if (el.hasAttribute(attribute)) out.push(attributeSlot(el, attribute));
    }
    // A textarea's placeholder is app wording even though what is typed in it is not.
    if (hasUntranslatableChildren(el)) return;
    for (let i = 0; i < el.childNodes.length; i += 1) {
      collectSlots(el.childNodes[i], out);
    }
  };

  const apply = (slot: Slot, state: SlotState, translated: string): void => {
    const original = state.original;
    const leading = original.match(/^\s*/)?.[0] ?? '';
    const trailing = original.match(/\s*$/)?.[0] ?? '';
    slot.write(`${leading}${translated}${trailing}`);
    state.applied = slot.read();
    tracked.push(slot);
  };

  const flush = async (): Promise<void> => {
    flushTimer = null;
    const lang = language;
    const batches = new Map(pending);
    pending.clear();
    const keys = Array.from(batches.keys());
    const cache = cacheFor(lang);
    batches.forEach((slots, key) => inFlight.set(key, slots));

    notifyBusy();

    const chunks: string[][] = [];
    for (let i = 0; i < keys.length; i += FETCH_BATCH_SIZE) {
      chunks.push(keys.slice(i, i + FETCH_BATCH_SIZE));
    }

    await Promise.all(
      chunks.map(async (chunk) => {
        let translations: Record<string, string> = {};
        try {
          translations = await fetchTranslations(lang, chunk);
        } catch {
          translations = {};
        }
        if (lang !== language) return;

        for (const key of chunk) {
          const translated = translations[key];
          inFlight.delete(key);
          if (typeof translated !== 'string' || !translated) continue;
          cache.set(key, translated);
          for (const slot of batches.get(key) ?? []) {
            const state = getState(slot);
            if (state && state.applied === null && slot.read() === state.original) {
              apply(slot, state, translated);
            }
          }
        }
        notifyBusy();
      }),
    );
  };

  const queue = (key: string, slot: Slot): void => {
    const existing = pending.get(key);
    if (existing) existing.push(slot);
    else pending.set(key, [slot]);
    if (!flushTimer) flushTimer = setTimeout(() => void flush(), FLUSH_DELAY_MS);
    notifyBusy();
  };

  const processSlot = (slot: Slot): void => {
    const current = slot.read();
    const known = getState(slot);
    if (known && known.applied !== null && current === known.applied) return;

    const state: SlotState = { original: current, applied: null };
    setState(slot, state);
    if (language === 'en' || !isTranslatable(current)) return;

    const key = current.trim();
    const hit = cacheFor(language).get(key);
    if (hit !== undefined) {
      apply(slot, state, hit);
      return;
    }
    // A string the service already failed to translate is not asked for again until the language changes.
    const asked = requestedFor(language);
    if (asked.has(key)) {
      const waiting = pending.get(key) ?? inFlight.get(key);
      if (waiting) waiting.push(slot);
      return;
    }
    asked.add(key);
    queue(key, slot);
  };

  const scan = (node: Node): void => {
    const parent = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
    if (isNoTranslate(parent)) return;
    const slots: Slot[] = [];
    collectSlots(node, slots);
    slots.forEach(processSlot);
    if (tracked.length > MAX_TRACKED_SLOTS) {
      tracked = tracked.filter((slot) => slot.node.isConnected);
    }
  };

  const restoreAll = (): void => {
    for (const slot of tracked) {
      const state = getState(slot);
      if (state && state.applied !== null && slot.read() === state.applied) {
        slot.write(state.original);
      }
      if (state) state.applied = null;
    }
    tracked = [];
  };

  const rescanDirty = (): void => {
    rescanTimer = null;
    const nodes = Array.from(dirty);
    dirty.clear();
    for (const node of nodes) {
      if (root.contains(node)) scan(node);
    }
  };

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'childList') {
        record.addedNodes.forEach((added) => dirty.add(added));
      } else {
        dirty.add(record.target);
      }
    }
    if (dirty.size > 0 && !rescanTimer) rescanTimer = setTimeout(rescanDirty, RESCAN_DELAY_MS);
  });

  const startObserving = (): void => {
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: TRANSLATED_ATTRIBUTES,
    });
  };

  return {
    setLanguage(next) {
      observer.disconnect();
      restoreAll();
      pending.clear();
      inFlight.clear();
      dirty.clear();
      language = next;
      notifyBusy();
      if (next === 'en') return;
      requested.delete(next);
      scan(root);
      startObserving();
    },

    async translateText(text) {
      if (language === 'en' || !isTranslatable(text)) return text;
      const key = text.trim();
      const cache = cacheFor(language);
      const hit = cache.get(key);
      if (hit !== undefined) return hit;
      try {
        const result = await fetchTranslations(language, [key]);
        if (result[key]) {
          cache.set(key, result[key]);
          return result[key];
        }
      } catch {
        // fall through to the original wording
      }
      return text;
    },

    destroy() {
      observer.disconnect();
      if (flushTimer) clearTimeout(flushTimer);
      if (rescanTimer) clearTimeout(rescanTimer);
      restoreAll();
    },
  };
}
