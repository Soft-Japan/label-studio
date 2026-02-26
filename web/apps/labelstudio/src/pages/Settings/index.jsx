import { SidebarMenu } from "../../components/SidebarMenu/SidebarMenu";
import { WebhookPage } from "../WebhookPage/WebhookPage";
import { DangerZone } from "./DangerZone";
import { GeneralSettings } from "./GeneralSettings";
import { AnnotationSettings } from "./AnnotationSettings";
import { LabelingSettings } from "./LabelingSettings";
import { MachineLearningSettings } from "./MachineLearningSettings/MachineLearningSettings";
import { PredictionsSettings } from "./PredictionsSettings/PredictionsSettings";
import { StorageSettings } from "./StorageSettings/StorageSettings";
import { getSettingsText } from "./i18n";
import "./settings.scss";

export const MenuLayout = ({ children, ...routeProps }) => {
  return (
    <SidebarMenu
      menuItems={[
        [GeneralSettings.path, getSettingsText("settings.menu.general")],
        [LabelingSettings.path, getSettingsText("settings.menu.labeling")],
        [AnnotationSettings.path, getSettingsText("settings.menu.annotation")],
        [MachineLearningSettings.path, getSettingsText("settings.menu.model")],
        [PredictionsSettings.path, getSettingsText("settings.menu.predictions")],
        [StorageSettings.path, getSettingsText("settings.menu.storage")],
        [WebhookPage.path, getSettingsText("settings.menu.webhooks")],
        [DangerZone.path, getSettingsText("settings.menu.danger")],
      ].filter(Boolean)}
      path={routeProps.match.url}
      children={children}
    />
  );
};

const pages = {
  AnnotationSettings,
  LabelingSettings,
  MachineLearningSettings,
  PredictionsSettings,
  StorageSettings,
  WebhookPage,
  DangerZone,
};

export const SettingsPage = {
  title: () => getSettingsText("settings.page.title"),
  path: "/settings",
  exact: true,
  layout: MenuLayout,
  component: GeneralSettings,
  pages,
};