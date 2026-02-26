import { Button } from "@humansignal/ui";
import { cn } from "apps/labelstudio/src/utils/bem";
import type { FC } from "react";
import "./EmptyList.scss";
import { HeidiAi } from "apps/labelstudio/src/assets/images";
import { useOrganizationI18n } from "../../i18n";

export const EmptyList: FC = () => {
  const runtimeLanguage =
    window.APP_SETTINGS?.language_code ??
    window.APP_SETTINGS?.user?.language ??
    window.APP_SETTINGS?.user?.language_code;
  const { t } = useOrganizationI18n(runtimeLanguage);

  return (
    <div className={cn("empty-models-list").toClassName()}>
      <div className={cn("empty-models-list").elem("content").toClassName()}>
        <div className={cn("empty-models-list").elem("heidy").toClassName()}>
          <HeidiAi />
        </div>
        <div className={cn("empty-models-list").elem("title").toClassName()}>{t("organization.models.emptyTitle")}</div>
        <div className={cn("empty-models-list").elem("caption").toClassName()}>
          {t("organization.models.emptyCaption")}
        </div>
        <Button aria-label={t("organization.models.createNewModel")}>{t("organization.models.emptyTitle")}</Button>
      </div>
    </div>
  );
};