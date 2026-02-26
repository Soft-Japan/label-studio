import { useTranslation } from "react-i18next";
import {
  getDefaultHeidiLanguage,
  i18n,
  normalizeHeidiLanguage,
} from "../../components/HeidiTips/i18n";
import en from "./locales/en.json";
import ja from "./locales/ja.json";

function syncProjectsResources() {
  i18n.addResourceBundle("en", "translation", en, true, true);
  i18n.addResourceBundle("ja", "translation", ja, true, true);
}

export function getProjectsT(language) {
  syncProjectsResources();

  const resolvedLanguage = normalizeHeidiLanguage(language ?? getDefaultHeidiLanguage());

  return i18n.getFixedT(resolvedLanguage, "translation");
}

export function useProjectsI18n(language) {
  syncProjectsResources();

  const resolvedLanguage = normalizeHeidiLanguage(language ?? getDefaultHeidiLanguage());
  const { i18n: translationInstance } = useTranslation();

  const t = translationInstance.getFixedT(resolvedLanguage, "translation");

  return { t, i18n: translationInstance };
}