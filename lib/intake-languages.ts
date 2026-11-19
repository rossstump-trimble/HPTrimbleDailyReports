export interface IntakeLanguage {
  code: string;
  /** Name in English, used when prompting the translation model. */
  name: string;
  /** Name in the language itself, shown in the picker so speakers can find it. */
  nativeName: string;
  dir: 'ltr' | 'rtl';
  /** BCP-47 tag for browser speech recognition. */
  speechLang: string;
}

export const DEFAULT_INTAKE_LANGUAGE = 'en';

export const INTAKE_LANGUAGES: IntakeLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr', speechLang: 'en-US' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr', speechLang: 'es-US' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', speechLang: 'ar-SA' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr', speechLang: 'pt-BR' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', dir: 'ltr', speechLang: 'vi-VN' },
  { code: 'fil', name: 'Filipino (Tagalog)', nativeName: 'Filipino', dir: 'ltr', speechLang: 'fil-PH' },
  { code: 'zh', name: 'Simplified Chinese', nativeName: '中文（简体）', dir: 'ltr', speechLang: 'zh-CN' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', dir: 'ltr', speechLang: 'ko-KR' },
  { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr', speechLang: 'fr-FR' },
  { code: 'ht', name: 'Haitian Creole', nativeName: 'Kreyòl ayisyen', dir: 'ltr', speechLang: 'fr-HT' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', dir: 'ltr', speechLang: 'ru-RU' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr', speechLang: 'hi-IN' },
];

export function getIntakeLanguage(code: string | null | undefined): IntakeLanguage {
  return (
    INTAKE_LANGUAGES.find((lang) => lang.code === code) ??
    INTAKE_LANGUAGES[0]
  );
}

export function isSupportedIntakeLanguage(code: unknown): code is string {
  return typeof code === 'string' && INTAKE_LANGUAGES.some((lang) => lang.code === code);
}

/** Language code for requests that need translating; undefined when the report is already English. */
export function nonEnglishLanguageOrUndefined(code: unknown): string | undefined {
  return isSupportedIntakeLanguage(code) && code !== DEFAULT_INTAKE_LANGUAGE ? code : undefined;
}
