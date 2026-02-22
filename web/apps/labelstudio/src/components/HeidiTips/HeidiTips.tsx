import { type FC, memo, useEffect } from "react";
import type { HeidiTipsProps } from "./types";
import { HeidiTip } from "./HeidiTip";
import { useRandomTip } from "./hooks";
import { getDefaultHeidiLanguage, setHeidiTipsLanguage } from "./i18n";

export const HeidiTips: FC<HeidiTipsProps> = memo(({ collection, language }) => {
  useEffect(() => {
    setHeidiTipsLanguage(language ?? getDefaultHeidiLanguage());
  }, [language]);

  const [tip, dismiss, onLinkClick] = useRandomTip(collection);

  return tip && <HeidiTip tip={tip} onDismiss={dismiss} onLinkClick={onLinkClick} />;
});