import { defaultTipsCollection } from "./content";
import { getDefaultHeidiLanguage, i18n } from "./i18n";
import type { RawTip, Tip, TipsCollection } from "./types";

const STORE_KEY = "heidi_ignored_tips";
const EVENT_NAMESPACE_KEY = "heidi_tips";
const CACHE_KEY = "heidi_live_tips_collection";
const CACHE_FETCHED_AT_KEY = "heidi_live_tips_collection_fetched_at";
const CACHE_STALE_TIME = 1000 * 60 * 60; // 1 hour
const MAX_TIMEOUT = 5000; // 5 seconds

const AUTH_TREATMENT_TO_I18N_KEY: Record<string, string> = {
  wrapped_webinar_2025_live: "heidiTips.authPage.wrappedEvent",
  prompts_auto_labeling_live: "heidiTips.authPage.promptsAutoLabeling",
  legalbench_live: "heidiTips.authPage.behindBenchmark",
  chat_live: "heidiTips.authPage.chatFeature",
  starter_cloud_live: "heidiTips.authPage.starterCloud",
  enterprise_platform_live: "heidiTips.authPage.enterpriseVersion",
  sync_cloud_data: "heidiTips.authPage.syncCloudData",
  enterprise_platform: "heidiTips.authPage.enterpriseVersion",
  templates: "heidiTips.authPage.templates",
  starter_cloud: "heidiTips.authPage.starterCloud",
};

function getTipI18nKey(collection: keyof TipsCollection, rawTip: RawTip) {
  if (rawTip.i18nKey) return rawTip.i18nKey;

  if (collection === "authPage") {
    const treatment = rawTip.link.params?.treatment;

    if (treatment) {
      return AUTH_TREATMENT_TO_I18N_KEY[treatment];
    }
  }

  return undefined;
}


function getKey(collection: string) {
  return `${STORE_KEY}:${collection}`;
}

export function getTipCollectionEvent(collection: string, event: string) {
  return `${EVENT_NAMESPACE_KEY}.${collection}.${event}`;
}

export function getTipEvent(collection: string, tip: Tip, event: string) {
  if (tip.link.params?.experiment && tip.link.params?.treatment) {
    return `${EVENT_NAMESPACE_KEY}.${collection}.${tip.link.params?.experiment}.${tip.link.params?.treatment}.${event}`;
  }
  if (tip.link.params?.experiment) {
    return `${EVENT_NAMESPACE_KEY}.${collection}.${tip.link.params?.experiment}.${event}`;
  }
  if (tip.link.params?.treatment) {
    return `${EVENT_NAMESPACE_KEY}.${collection}.${tip.link.params?.treatment}.${event}`;
  }

  return getTipCollectionEvent(collection, event);
}

function resolveTip(collection: keyof TipsCollection, rawTip: RawTip): Tip {
  const key = getTipI18nKey(collection, rawTip);
  const title = key ? i18n.t(`${key}.title`) : rawTip.title;
  const content = key ? i18n.t(`${key}.content`) : rawTip.content;
  const description = key ? i18n.t(`${key}.description`) : rawTip.description;
  const linkLabel = key ? i18n.t(`${key}.linkLabel`) : rawTip.link.label;

  return {
    ...rawTip,
    title: title === `${key}.title` ? (rawTip.title ?? "") : title,
    content: content === `${key}.content` ? rawTip.content : content,
    description: description === `${key}.description` ? rawTip.description : description,
    link: {
      ...rawTip.link,
      label: linkLabel === `${key}.linkLabel` ? (rawTip.link.label ?? "") : linkLabel,
    },
  };
}

export function getTipMetadata(tip: Tip) {
  const params = { ...(tip.link.params ?? {}) };

  delete params.experiment;
  delete params.treatment;

  return {
    ...params,
    content: tip.description ?? tip.content ?? "",
    title: tip.title,
    href: tip.link.url,
    label: tip.link.label,
  };
}

export const loadLiveTipsCollection = () => {
  const cachedData = localStorage.getItem(CACHE_KEY);
  const fetchedAt = localStorage.getItem(CACHE_FETCHED_AT_KEY);

  if (cachedData && fetchedAt && Date.now() - Number.parseInt(fetchedAt) < CACHE_STALE_TIME) {
    return JSON.parse(cachedData);
  }

  const abortController = new AbortController();
  const abortTimeout = setTimeout(abortController.abort, MAX_TIMEOUT);

  fetch("/heidi-tips", {
    headers: {
      "Cache-Control": "no-cache",
      "Content-Type": "application/json",
    },
    signal: abortController.signal,
  })
    .then(async (response) => {
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem(CACHE_FETCHED_AT_KEY, String(Date.now()));
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      }
    })
    .catch((e) => {
      console.warn("Failed to load live Heidi tips collection", e);
    })
    .finally(() => {
      clearTimeout(abortTimeout);
    });

  if (cachedData) {
    return JSON.parse(cachedData);
  }

  return defaultTipsCollection;
};

export function getRandomTip(collection: keyof TipsCollection): Tip | null {
  if (!i18n.resolvedLanguage) {
    i18n.changeLanguage(getDefaultHeidiLanguage());
  }

  const tipsCollection = loadLiveTipsCollection();

  if (!tipsCollection[collection] || isTipDismissed(collection)) return null;

  const tips = tipsCollection[collection];

  const index = Math.floor(Math.random() * tips.length);

  return resolveTip(collection, tips[index]);
}

export function dismissTip(collection: string) {
  const cookieExpiryTime = 1000 * 60 * 60 * 24 * 30;
  const cookieExpiryDate = new Date();

  cookieExpiryDate.setTime(cookieExpiryDate.getTime() + cookieExpiryTime);

  const finalKey = getKey(collection);
  const cookieValue = `${finalKey}=true`;
  const cookieExpiry = `expires=${cookieExpiryDate.toUTCString()}`;
  const cookiePath = "path=/";
  const cookieString = [cookieValue, cookieExpiry, cookiePath].join("; ");
  document.cookie = cookieString;

  __lsa(getTipCollectionEvent(collection, "dismiss"), {
    expires: cookieExpiryDate.getTime(),
  });
}

export function isTipDismissed(collection: string) {
  const cookies = Object.fromEntries(document.cookie.split(";").map((item) => item.trim().split("=")));
  const finalKey = getKey(collection);

  return cookies[finalKey] === "true";
}

export function createURL(url: string, params?: Record<string, string>): string {
  const base = new URL(url);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    base.searchParams.set(key, value);
  });

  const userID = APP_SETTINGS.user?.id;
  const serverID = APP_SETTINGS.server_id;

  if (serverID) base.searchParams.set("server_id", serverID);
  if (userID) base.searchParams.set("user_id", userID);

  return base.toString();
}
