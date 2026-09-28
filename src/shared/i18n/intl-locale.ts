import type { AppLanguage } from "@/shared/model";

const INTL_LOCALES: Record<AppLanguage, string> = {
  uz: "uz-UZ",
  en: "en-US",
  ru: "ru-RU",
};

export function toIntlLocale(language: string): string {
  return INTL_LOCALES[language as AppLanguage] ?? INTL_LOCALES.uz;
}
