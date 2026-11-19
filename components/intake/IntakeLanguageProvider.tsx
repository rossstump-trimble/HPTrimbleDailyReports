"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Globe, Loader2 } from "lucide-react";
import { createDomTranslator, type DomTranslator } from "@/lib/dom-translator";
import {
  DEFAULT_INTAKE_LANGUAGE,
  INTAKE_LANGUAGES,
  getIntakeLanguage,
  isSupportedIntakeLanguage,
} from "@/lib/intake-languages";

const STORAGE_KEY = "hp_intake_language";
const CACHE_KEY_PREFIX = "hp_ui_translations_";

interface IntakeLanguageContextValue {
  language: string;
  setLanguage: (code: string) => void;
  /** Translates wording that is not on screen (e.g. interview questions that are read aloud). */
  translateText: (text: string) => Promise<string>;
  speechLang: string;
  /** True while wording for the chosen language is still being fetched. */
  translating: boolean;
}

const IntakeLanguageContext = createContext<IntakeLanguageContextValue>({
  language: DEFAULT_INTAKE_LANGUAGE,
  setLanguage: () => undefined,
  translateText: async (text) => text,
  speechLang: getIntakeLanguage(DEFAULT_INTAKE_LANGUAGE).speechLang,
  translating: false,
});

export function useIntakeLanguage(): IntakeLanguageContextValue {
  return useContext(IntakeLanguageContext);
}

function readStoredTranslations(language: string): Record<string, string> {
  try {
    return JSON.parse(window.localStorage.getItem(`${CACHE_KEY_PREFIX}${language}`) || "{}") as Record<
      string,
      string
    >;
  } catch {
    return {};
  }
}

function storeTranslations(language: string, translations: Record<string, string>): void {
  try {
    window.localStorage.setItem(`${CACHE_KEY_PREFIX}${language}`, JSON.stringify(translations));
  } catch {
    // storage full or blocked: translations are just refetched next visit
  }
}

async function fetchUiTranslations(
  language: string,
  strings: string[],
): Promise<Record<string, string>> {
  const stored = readStoredTranslations(language);
  const result: Record<string, string> = {};
  const missing: string[] = [];
  for (const s of strings) {
    if (stored[s] !== undefined) result[s] = stored[s];
    else missing.push(s);
  }
  if (missing.length === 0) return result;

  const res = await fetch("/api/intake/translate-ui", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, strings: missing }),
  });
  if (!res.ok) return result;
  const body = (await res.json()) as { translations?: Record<string, string> };
  const fetched = body.translations ?? {};
  storeTranslations(language, { ...stored, ...fetched });
  return { ...result, ...fetched };
}

export function LanguageSelect(): JSX.Element {
  const { language, setLanguage, translating } = useIntakeLanguage();
  return (
    <label
      translate="no"
      className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition px-2.5 py-1.5 text-xs font-semibold text-white"
    >
      {translating ? (
        <Loader2 size={14} className="animate-spin" aria-hidden="true" />
      ) : (
        <Globe size={14} aria-hidden="true" />
      )}
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        aria-label="Language"
        className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer [&>option]:text-gray-900"
      >
        {INTAKE_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}

export function IntakeLanguageProvider({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): JSX.Element {
  const [language, setLanguageState] = useState(DEFAULT_INTAKE_LANGUAGE);
  const [translating, setTranslating] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const translatorRef = useRef<DomTranslator | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const translator = createDomTranslator(root, fetchUiTranslations, setTranslating);
    translatorRef.current = translator;
    return () => {
      translator.destroy();
      translatorRef.current = null;
    };
  }, []);

  // Read after mount so the server-rendered page and first client render both start in English.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isSupportedIntakeLanguage(stored)) setLanguageState(stored);
    } catch {
      // storage blocked: stay on English
    }
  }, []);

  useEffect(() => {
    translatorRef.current?.setLanguage(language);
  }, [language]);

  const setLanguage = useCallback((code: string) => {
    if (!isSupportedIntakeLanguage(code)) return;
    setLanguageState(code);
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // storage blocked: the choice just won't persist
    }
  }, []);

  const translateText = useCallback(
    (text: string) => translatorRef.current?.translateText(text) ?? Promise.resolve(text),
    [],
  );

  const config = getIntakeLanguage(language);
  const value = useMemo<IntakeLanguageContextValue>(
    () => ({ language, setLanguage, translateText, speechLang: config.speechLang, translating }),
    [language, setLanguage, translateText, config.speechLang, translating],
  );

  return (
    <IntakeLanguageContext.Provider value={value}>
      <div
        ref={rootRef}
        dir={config.dir}
        lang={language}
        aria-busy={translating}
        className={className}
      >
        {children}
      </div>
    </IntakeLanguageContext.Provider>
  );
}
