import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StaticContent } from "../../app/StaticContent/StaticContent";
import {
  IconBook,
  IconFolder,
  IconHome,
  IconHotkeys,
  IconPeople,
  IconPersonInCircle,
  IconPin,
  IconTerminal,
  IconDoor,
  IconGithub,
  IconSlack,
} from "@humansignal/icons";
import { LSLogo } from "../../assets/images";
import { Button, Userpic, ThemeToggle } from "@humansignal/ui";
//import { useConfig } from "../../providers/ConfigProvider";
import { useContextComponent, useFixedLocation } from "../../providers/RoutesProvider";
import { useAuth } from "@humansignal/core/providers/AuthProvider";
import { cn } from "../../utils/bem";
import { absoluteURL, isDefined } from "../../utils/helpers";
import { Breadcrumbs } from "../Breadcrumbs/Breadcrumbs";
import { Dropdown } from "@humansignal/ui";
import { Hamburger } from "../Hamburger/Hamburger";
import { Menu } from "../Menu/Menu";
import { VersionNotifier, VersionProvider } from "../VersionNotifier/VersionNotifier";
import "./Menubar.scss";
import "./MenuContent.scss";
import "./MenuSidebar.scss";
import { FF_HOMEPAGE } from "../../utils/feature-flags";
import { pages } from "@humansignal/app-common";
import { isFF } from "../../utils/feature-flags";
import { ff } from "@humansignal/core";
import { openHotkeyHelp } from "@humansignal/app-common/pages/AccountSettings/sections/Hotkeys/Help";

export const MenubarContext = createContext();

const LeftContextMenu = ({ className }) => (
  <StaticContent id="context-menu-left" className={className}>
    {(template) => <Breadcrumbs fromTemplate={template} />}
  </StaticContent>
);

const isJapaneseLocale = () => document.documentElement.lang?.toLowerCase().startsWith("ja");

const menuLabels = {
  accountSettings: { en: "Account & Settings", ja: "アカウントと設定" },
  logout: { en: "Log Out", ja: "ログアウト" },
  home: { en: "Home", ja: "ホーム" },
  projects: { en: "Projects", ja: "プロジェクト" },
  organization: { en: "Organization", ja: "組織" },
  api: { en: "API", ja: "API" },
  docs: { en: "Docs", ja: "ドキュメント" },
  github: { en: "GitHub", ja: "GitHub" },
  slackCommunity: { en: "Slack Community", ja: "Slack コミュニティ" },
  pinMenu: { en: "Pin menu", ja: "メニューを固定" },
  unpinMenu: { en: "Unpin menu", ja: "メニューの固定を解除" },
};

const getMenuLabel = (labelKey) => (isJapaneseLocale() ? menuLabels[labelKey].ja : menuLabels[labelKey].en);
const getLanguageFromCookie = () =>
  document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("django_language="))
    ?.split("=")[1];

const resolveCurrentLanguage = () => {
  const cookieLanguage = getLanguageFromCookie();

  if (cookieLanguage) {
    return cookieLanguage.toLowerCase().startsWith("ja") ? "ja" : "en";
  }

  const htmlLanguage = document.documentElement.lang;

  if (htmlLanguage) {
    return htmlLanguage.toLowerCase().startsWith("ja") ? "ja" : "en";
  }

  return "en";
};

const setLanguageCookie = (language) => {
  // biome-ignore lint/suspicious/noDocumentCookie: Django reads language preference from this cookie.
  document.cookie = `django_language=${language}; path=/; max-age=31536000; samesite=lax`;
};

const RightContextMenu = ({ className, ...props }) => {
  const { ContextComponent, contextProps } = useContextComponent();

  return ContextComponent ? (
    <div className={className}>
      <ContextComponent {...props} {...(contextProps ?? {})} />
    </div>
  ) : (
    <StaticContent id="context-menu-right" className={className} />
  );
};

export const Menubar = ({ enabled, defaultOpened, defaultPinned, children, onSidebarToggle, onSidebarPin }) => {
  const menuDropdownRef = useRef();
  const useMenuRef = useRef();
  const { user, isLoading } = useAuth();
  const location = useFixedLocation();

  //const config = useConfig();
  const [sidebarOpened, setSidebarOpened] = useState(defaultOpened ?? false);
  const [language, setLanguage] = useState(resolveCurrentLanguage);
  const [sidebarPinned, setSidebarPinned] = useState(defaultPinned ?? false);
  const [PageContext, setPageContext] = useState({
    Component: null,
    props: {},
  });

  const menubarClass = cn("menu-header");
  const menubarContext = menubarClass.elem("context");
  const sidebarClass = cn("sidebar");
  const contentClass = cn("content-wrapper");
  const contextItem = menubarClass.elem("context-item");
  const showNewsletterDot = !isDefined(user?.allow_newsletters);

  const sidebarPin = useCallback(
    (e) => {
      e.preventDefault();

      const newState = !sidebarPinned;

      setSidebarPinned(newState);
      onSidebarPin?.(newState);
    },
    [sidebarPinned],
  );

  const sidebarToggle = useCallback(
    (visible) => {
      const newState = visible;

      setSidebarOpened(newState);
      onSidebarToggle?.(newState);
    },
    [sidebarOpened],
  );

  const providerValue = useMemo(
    () => ({
      PageContext,

      setContext(ctx) {
        setTimeout(() => {
          setPageContext({
            ...PageContext,
            Component: ctx,
          });
        });
      },

      setProps(props) {
        setTimeout(() => {
          setPageContext({
            ...PageContext,
            props,
          });
        });
      },

      contextIsSet(ctx) {
        return PageContext.Component === ctx;
      },
    }),
    [PageContext],
  );

  useEffect(() => {
    if (!sidebarPinned) {
      menuDropdownRef?.current?.close();
    }
    useMenuRef?.current?.close();
  }, [location]);
  const switchLanguage = useCallback(() => {
    const nextLanguage = language === "ja" ? "en" : "ja";

    setLanguage(nextLanguage);
    setLanguageCookie(nextLanguage);
    document.documentElement.lang = nextLanguage;

    if (window.APP_SETTINGS) {
      window.APP_SETTINGS.language_code = nextLanguage;
    }

    window.location.reload();
  }, [language]);

  return (
    <div className={contentClass}>
      {enabled && (
        <div className={menubarClass}>
          <Dropdown.Trigger dropdown={menuDropdownRef} closeOnClickOutside={!sidebarPinned}>
            <div className={`${menubarClass.elem("trigger")} main-menu-trigger`}>
              <LSLogo className={`${menubarClass.elem("logo")}`} alt="Label Studio Logo" />
              <Hamburger opened={sidebarOpened} />
            </div>
          </Dropdown.Trigger>

          <div className={menubarContext}>
            <LeftContextMenu className={contextItem.mod({ left: true })} />
            <RightContextMenu className={contextItem.mod({ right: true })} />
          </div>

          <div className={menubarClass.elem("hotkeys")}>
            <div className={menubarClass.elem("hotkeys-button")}>
              <Button
                variant="neutral"
                look="outlined"
                tooltip="Keyboard Shortcuts"
                data-testid="hotkeys-button"
                size="small"
                onClick={() => {
                  openHotkeyHelp([
                    "annotation",
                    "data_manager",
                    "regions",
                    "tools",
                    "audio",
                    "video",
                    "timeseries",
                    "image_gallery",
                  ]);
                }}
                icon={<IconHotkeys />}
              />
            </div>
          </div>
          <div className={menubarClass.elem("language")}>
            <Button
              variant="neutral"
              look="outlined"
              size="small"
              onClick={switchLanguage}
              tooltip={language === "ja" ? "英語に切り替え" : "Switch to Japanese"}
            >
              {language === "ja" ? "EN" : "JP"}
            </Button>
          </div>
          {ff.isActive(ff.FF_THEME_TOGGLE) && <ThemeToggle />}

          <Dropdown.Trigger
            ref={useMenuRef}
            align="right"
            content={
              <Menu>
                <Menu.Item
                  icon={<IconPersonInCircle />}
                  label={getMenuLabel("accountSettings")}
                  href={pages.AccountSettingsPage.path}
                />
                {/* <Menu.Item label="Dark Mode"/> */}
                <Menu.Item
                  icon={<IconDoor />}
                  label={getMenuLabel("logout")}
                  href={absoluteURL("/logout")}
                  data-external
                />
                {showNewsletterDot && (
                  <>
                    <Menu.Divider />
                    <Menu.Item className={cn("newsletter-menu-item")} href={pages.AccountSettingsPage.path}>
                      <span>Please check new notification settings in the Account & Settings page</span>
                      <span className={cn("newsletter-menu-badge")} />
                    </Menu.Item>
                  </>
                )}
              </Menu>
            }
          >
            <div title={user?.email} className={menubarClass.elem("user")}>
              <Userpic user={user} isInProgress={isLoading} />
              {showNewsletterDot && <div className={menubarClass.elem("userpic-badge")} />}
            </div>
          </Dropdown.Trigger>
        </div>
      )}

      <VersionProvider>
        <div className={contentClass.elem("body")}>
          {enabled && (
            <Dropdown
              ref={menuDropdownRef}
              onToggle={sidebarToggle}
              onVisibilityChanged={() => window.dispatchEvent(new Event("resize"))}
              visible={sidebarOpened}
              className={[sidebarClass, sidebarClass.mod({ floating: !sidebarPinned })].join(" ")}
              style={{ width: 240 }}
            >
              <Menu>
                {isFF(FF_HOMEPAGE) && (
                  <Menu.Item label={getMenuLabel("home")} to="/" icon={<IconHome />} data-external exact />
                )}
                <Menu.Item label={getMenuLabel("projects")} to="/projects" icon={<IconFolder />} data-external exact />
                <Menu.Item
                  label={getMenuLabel("organization")}
                  to="/organization"
                  icon={<IconPeople />}
                  data-external
                  exact
                />

                <Menu.Spacer />

                <VersionNotifier showNewVersion />

                <Menu.Item
                  label={getMenuLabel("api")}
                  href="https://api.labelstud.io/api-reference/introduction/getting-started"
                  icon={<IconTerminal />}
                  target="_blank"
                />
                <Menu.Item
                  label={getMenuLabel("docs")}
                  href="https://labelstud.io/guide"
                  icon={<IconBook />}
                  target="_blank"
                />
                <Menu.Item
                  label={getMenuLabel("github")}
                  href="https://github.com/HumanSignal/label-studio"
                  icon={<IconGithub />}
                  target="_blank"
                  rel="noreferrer"
                />
                <Menu.Item
                  label={getMenuLabel("slackCommunity")}
                  href="https://slack.labelstud.io/?source=product-menu"
                  icon={<IconSlack />}
                  target="_blank"
                  rel="noreferrer"
                />

                <VersionNotifier showCurrentVersion />

                <Menu.Divider />

                <Menu.Item
                  icon={<IconPin />}
                  className={sidebarClass.elem("pin")}
                  onClick={sidebarPin}
                  active={sidebarPinned}
                >
                  {sidebarPinned ? getMenuLabel("unpinMenu") : getMenuLabel("pinMenu")}
                </Menu.Item>
              </Menu>
            </Dropdown>
          )}

          <MenubarContext.Provider value={providerValue}>
            <div className={contentClass.elem("content").mod({ withSidebar: sidebarPinned && sidebarOpened })}>
              {children}
            </div>
          </MenubarContext.Provider>
        </div>
      </VersionProvider>
    </div>
  );
};