import { type FC, memo, useEffect } from "react";
import type { HeidiTipsProps } from "./types";
import { HeidiTip } from "./HeidiTip";
import { useRandomTip } from "./hooks";
import { getDefaultHeidiLanguage, setHeidiTipsLanguage } from "./i18n";

export const HeidiTips: FC<HeidiTipsProps> = memo(({ collection, language }) => {
  const resolvedLanguage = language ?? getDefaultHeidiLanguage();

  useEffect(() => {
    setHeidiTipsLanguage(resolvedLanguage);
  }, [resolvedLanguage]);

  const [tip, dismiss, onLinkClick] = useRandomTip(collection, resolvedLanguage);

  return tip && <HeidiTip tip={tip} onDismiss={dismiss} onLinkClick={onLinkClick} />;
});