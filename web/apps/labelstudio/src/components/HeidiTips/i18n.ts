import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ja from "./locales/ja.json";

const resources = {
  en: { translation: en },
  ja: { translation: ja },
} as const;

export const DEFAULT_HEIDI_LANGUAGE = "en";

function readDjangoLanguageCookie() {
  if (typeof document === "undefined") return undefined;

  return document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("django_language="))
    ?.split("=")[1];
}

function readHtmlLanguage() {
  if (typeof document === "undefined") return undefined;

  return document.documentElement.lang;
}

function readAppSettingsLanguage() {
  if (typeof window === "undefined") return undefined;

  return (window as { APP_SETTINGS?: { language_code?: string } }).APP_SETTINGS?.language_code;
}

export function normalizeHeidiLanguage(language?: string) {
  if (!language) return DEFAULT_HEIDI_LANGUAGE;

  return language.toLowerCase().startsWith("ja") ? "ja" : "en";
}

export function getDefaultHeidiLanguage() {
  const djangoLanguage = readDjangoLanguageCookie();

  if (djangoLanguage) return normalizeHeidiLanguage(djangoLanguage);

  const appSettingsLanguage = readAppSettingsLanguage();

  if (appSettingsLanguage) return normalizeHeidiLanguage(appSettingsLanguage);

  const htmlLanguage = readHtmlLanguage();

  if (htmlLanguage) return normalizeHeidiLanguage(htmlLanguage);
  if (typeof navigator === "undefined") return DEFAULT_HEIDI_LANGUAGE;

  return normalizeHeidiLanguage(navigator.language);
}

if (!i18n.isInitialized) {
  const defaultLanguage = getDefaultHeidiLanguage();

  i18n.use(initReactI18next).init({
    resources,
    lng: defaultLanguage,
    fallbackLng: DEFAULT_HEIDI_LANGUAGE,
    interpolation: { escapeValue: false },
    returnObjects: true,
  });
}

export function setHeidiTipsLanguage(language: "en" | "ja") {
  i18n.changeLanguage(normalizeHeidiLanguage(language));
}

export { i18n };