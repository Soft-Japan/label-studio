export type TipLinkParams = Record<string, string> & {
  experiment?: string;
  treatment?: string;
};

export type Tip = {
  i18nKey?: string;
  title: string;
  content?: string;
  description?: string;
  closable?: boolean;
  link: {
    url: string;
    label: string;
    params?: TipLinkParams;
  };
};

export type RawTip = Omit<Tip, "title" | "link"> & {
  title?: string;
  link: {
    url: string;
    label?: string;
    params?: TipLinkParams;
  };
};

export type TipCollectionKey = "projectCreation" | "organizationPage" | "projectSettings" | "authPage";

export type TipsCollection = Record<TipCollectionKey, RawTip[]>;

export type HeidiTipsProps = {
  collection: keyof TipsCollection;
  language?: "en" | "ja";
};

export type HeidiTipProps = {
  tip: Tip;
  onDismiss: () => void;
  onLinkClick: () => void;
};