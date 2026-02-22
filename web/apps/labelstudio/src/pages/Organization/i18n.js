import { useTranslation } from "react-i18next";
import {
  getDefaultHeidiLanguage,
  i18n,
  normalizeHeidiLanguage,
} from "../../components/HeidiTips/i18n";
import en from "./locales/en.json";
import ja from "./locales/ja.json";

function syncOrganizationResources() {
  i18n.addResourceBundle("en", "translation", en, true, true);
  i18n.addResourceBundle("ja", "translation", ja, true, true);
}

export function getOrganizationT(language) {
  syncOrganizationResources();

  const resolvedLanguage = normalizeHeidiLanguage(language ?? getDefaultHeidiLanguage());

  return i18n.getFixedT(resolvedLanguage, "translation");
}

export function useOrganizationI18n(language) {
  syncOrganizationResources();

  const resolvedLanguage = normalizeHeidiLanguage(language ?? getDefaultHeidiLanguage());
  const { i18n: translationInstance } = useTranslation();

  const t = translationInstance.getFixedT(resolvedLanguage, "translation");

  return { t, i18n: translationInstance };
}