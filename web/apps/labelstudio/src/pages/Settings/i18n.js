import { useTranslation } from "react-i18next";
import { getDefaultHeidiLanguage, i18n, normalizeHeidiLanguage } from "../../components/HeidiTips/i18n";
import en from "./locales/en.json";
import ja from "./locales/ja.json";

const resources = { en, ja };

function syncSettingsResources() {
  i18n.addResourceBundle("en", "translation", en, true, true);
  i18n.addResourceBundle("ja", "translation", ja, true, true);
}

export function useSettingsI18n(language) {
  syncSettingsResources();

  const resolvedLanguage = normalizeHeidiLanguage(language ?? getDefaultHeidiLanguage());
  const { i18n: translationInstance } = useTranslation();

  const t = translationInstance.getFixedT(resolvedLanguage, "translation");

  return { t, i18n: translationInstance };
}

export function getSettingsText(key, language) {
  const resolvedLanguage = normalizeHeidiLanguage(language ?? getDefaultHeidiLanguage());
  const bundle = resources[resolvedLanguage] ?? resources.en;

  return bundle[key] ?? resources.en[key] ?? key;
}