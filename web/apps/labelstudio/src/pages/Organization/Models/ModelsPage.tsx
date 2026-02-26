import { buttonVariant, Space } from "@humansignal/ui";
import { useUpdatePageTitle } from "@humansignal/core";
import { cn } from "apps/labelstudio/src/utils/bem";
import { Link } from "react-router-dom";
import type { Page } from "../../types/Page";
import { EmptyList } from "./@components/EmptyList";
import { getOrganizationT, useOrganizationI18n } from "../i18n";

export const ModelsPage: Page = () => {
  const runtimeLanguage =
    window.APP_SETTINGS?.language_code ??
    window.APP_SETTINGS?.user?.language ??
    window.APP_SETTINGS?.user?.language_code;
  const { t } = useOrganizationI18n(runtimeLanguage);

  useUpdatePageTitle(t("organization.models.title"));

  return (
    <div className={cn("prompter").toClassName()}>
      <EmptyList />
    </div>
  );
};

const modelsLanguage =
  window.APP_SETTINGS?.language_code ??
  window.APP_SETTINGS?.user?.language ??
  window.APP_SETTINGS?.user?.language_code;

ModelsPage.title = () => getOrganizationT(modelsLanguage)("organization.models.title");
ModelsPage.titleRaw = getOrganizationT(modelsLanguage)("organization.models.title");
ModelsPage.path = "/models";

ModelsPage.context = () => {
  return (
    <Space size="small">
      <Link to="/prompt/settings" className={buttonVariant({ size: "small" })}>
        {getOrganizationT(modelsLanguage)("organization.models.createModel")}
      </Link>
    </Space>
  );
};