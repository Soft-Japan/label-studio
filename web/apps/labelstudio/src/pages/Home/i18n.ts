import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  getDefaultHeidiLanguage,
  i18n,
  normalizeHeidiLanguage,
  setHeidiTipsLanguage,
} from "../../components/HeidiTips/i18n";
import en from "./locales/en.json";
import ja from "./locales/ja.json";

function syncHomeResources() {
  i18n.addResourceBundle("en", "translation", en, true, true);
  i18n.addResourceBundle("ja", "translation", ja, true, true);
}

export function useHomepageI18n(language?: string) {
  syncHomeResources();

  const resolvedLanguage = normalizeHeidiLanguage(language ?? getDefaultHeidiLanguage());
  const { i18n: translationInstance } = useTranslation();

  useEffect(() => {
    setHeidiTipsLanguage(resolvedLanguage);
  }, [resolvedLanguage]);

  const t = translationInstance.getFixedT(resolvedLanguage, "translation");

  return { t, i18n: translationInstance };
}