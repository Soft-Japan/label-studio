import { useTranslation } from "react-i18next";
import { getDefaultHeidiLanguage, i18n, normalizeHeidiLanguage } from "../../components/HeidiTips/i18n";
import en from "./locales/en.json";
import ja from "./locales/ja.json";

i18n.addResourceBundle("en", "translation", en, true, true);
i18n.addResourceBundle("ja", "translation", ja, true, true);

export function useDataManagerI18n(language?: string) {
  const resolvedLanguage = normalizeHeidiLanguage(language ?? getDefaultHeidiLanguage());
  const { i18n: translationInstance } = useTranslation();

  const t = i18n.getFixedT(resolvedLanguage, "translation");

  return { t, i18n: translationInstance };
}
