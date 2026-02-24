import { useMemo, useState } from "react";
import { useHistory } from "react-router";
import { Button, Typography, useToast } from "@humansignal/ui";
import { useUpdatePageTitle, createTitleFromSegments } from "@humansignal/core";
import { Label } from "../../components/Form";
import { modal } from "../../components/Modal/Modal";
import { useModalControls } from "../../components/Modal/ModalPopup";
import Input from "../../components/Form/Elements/Input/Input";
import { Space } from "../../components/Space/Space";
import { Spinner } from "../../components/Spinner/Spinner";
import { useAPI } from "../../providers/ApiProvider";
import { useProject } from "../../providers/ProjectProvider";
import { cn } from "../../utils/bem";
import { getSettingsText, useSettingsI18n } from "./i18n";

export const DangerZone = () => {
  const { project } = useProject();
  const api = useAPI();
  const history = useHistory();
  const toast = useToast();
  const [processing, setProcessing] = useState(null);
  const { t } = useSettingsI18n();

  useUpdatePageTitle(createTitleFromSegments([project?.title, t("settings.danger.title")]));

  const showDangerConfirmation = ({ title, message, requiredWord, buttonText, onConfirm }) => {
    const isDev = process.env.NODE_ENV === "development";

    return modal({
      title,
      width: 600,
      allowClose: false,
      body: () => {
        const ctrl = useModalControls();
        const inputValue = ctrl?.state?.inputValue || "";

        return (
          <div>
            <Typography variant="body" size="medium" className="mb-tight">
              {message}
            </Typography>
            <Input
              label={t("settings.danger.confirmInput", { word: requiredWord })}
              value={inputValue}
              onChange={(e) => ctrl?.setState({ inputValue: e.target.value })}
              autoFocus
              data-testid="danger-zone-confirmation-input"
              autoComplete="off"
            />
          </div>
        );
      },
      footer: () => {
        const ctrl = useModalControls();
        const inputValue = (ctrl?.state?.inputValue || "").trim().toLowerCase();
        const isValid = isDev || inputValue === requiredWord.toLowerCase();

        return (
          <Space align="end">
            <Button
              variant="neutral"
              look="outline"
              onClick={() => ctrl?.hide()}
              data-testid="danger-zone-cancel-button"
            >
              {t("settings.danger.cancel")}
            </Button>
            <Button
              variant="negative"
              disabled={!isValid}
              onClick={async () => {
                await onConfirm();
                ctrl?.hide();
              }}
              data-testid="danger-zone-confirm-button"
            >
              {buttonText}
            </Button>
          </Space>
        );
      },
    });
  };

  const handleOnClick = (type) => () => {
    const actionConfig = {
      reset_cache: {
        title: t("settings.danger.resetCache"),
        message: (
          <>
            {t("settings.danger.confirmReset", { projectTitle: project.title })}
          </>
        ),
        requiredWord: "cache",
        buttonText: t("settings.danger.resetCache"),
      },
      tabs: {
        title: t("settings.danger.dropTabs"),
        message: (
          <>
            {t("settings.danger.confirmTabs", { projectTitle: project.title })}
          </>
        ),
        requiredWord: "tabs",
        buttonText: t("settings.danger.dropTabs"),
      },
      project: {
        title: t("settings.danger.deleteProject"),
        message: (
          <>
            {t("settings.danger.confirmProject", { projectTitle: project.title })}
          </>
        ),
        requiredWord: "delete",
        buttonText: t("settings.danger.deleteProject"),
      },
    };

    const config = actionConfig[type];

    if (!config) {
      return;
    }

    showDangerConfirmation({
      ...config,
      onConfirm: async () => {
        setProcessing(type);
        try {
          if (type === "reset_cache") {
            await api.callApi("projectResetCache", {
              params: {
                pk: project.id,
              },
            });
            toast.show({ message: t("settings.danger.cacheResetSuccess") });
          } else if (type === "tabs") {
            await api.callApi("deleteTabs", {
              body: {
                project: project.id,
              },
            });
            toast.show({ message: t("settings.danger.tabsDroppedSuccess") });
          } else if (type === "project") {
            await api.callApi("deleteProject", {
              params: {
                pk: project.id,
              },
            });
            toast.show({ message: t("settings.danger.projectDeletedSuccess") });
            history.replace("/projects");
          }
        } catch (error) {
          toast.show({ message: t("settings.danger.error", { message: error.message }), type: "error" });
        } finally {
          setProcessing(null);
        }
      },
    });
  };

  const buttons = useMemo(
    () => [
      {
        type: "annotations",
        disabled: true, //&& !project.total_annotations_number,
        label: `Delete ${project.total_annotations_number} Annotations`,
      },
      {
        type: "tasks",
        disabled: true, //&& !project.task_number,
        label: `Delete ${project.task_number} Tasks`,
      },
      {
        type: "predictions",
        disabled: true, //&& !project.total_predictions_number,
        label: `Delete ${project.total_predictions_number} Predictions`,
      },
      {
        type: "reset_cache",
        help: t("settings.danger.resetCacheHelp"),
        label: t("settings.danger.resetCache"),
      },
      {
        type: "tabs",
        help: t("settings.danger.dropTabsHelp"),
        label: t("settings.danger.dropTabs"),
      },
      {
        type: "project",
        help: t("settings.danger.deleteProjectHelp"),
        label: t("settings.danger.deleteProject"),
      },
    ],
    [project, t],
  );

  return (
    <div className={cn("simple-settings")}>
      <Typography variant="headline" size="medium" className="mb-tighter">
        {t("settings.danger.title")}
      </Typography>
      <Typography variant="body" size="medium" className="text-neutral-content-subtler !mb-base">
        {t("settings.danger.desc")}
      </Typography>

      {project.id ? (
        <div style={{ marginTop: 16 }}>
          {buttons.map((btn) => {
            const waiting = processing === btn.type;
            const disabled = btn.disabled || (processing && !waiting);

            return (
              btn.disabled !== true && (
                <div className={cn("settings-wrapper")} key={btn.type}>
                  <Typography variant="title" size="large">
                    {btn.label}
                  </Typography>
                  {btn.help && <Label description={btn.help} style={{ width: 600, display: "block" }} />}
                  <Button
                    key={btn.type}
                    variant="negative"
                    look="outlined"
                    disabled={disabled}
                    waiting={waiting}
                    onClick={handleOnClick(btn.type)}
                    style={{ marginTop: 16 }}
                  >
                    {btn.label}
                  </Button>
                </div>
              )
            );
          })}
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
          <Spinner size={32} />
        </div>
      )}
    </div>
  );
};

DangerZone.title = () => getSettingsText("settings.menu.danger");
DangerZone.path = "/danger-zone";
