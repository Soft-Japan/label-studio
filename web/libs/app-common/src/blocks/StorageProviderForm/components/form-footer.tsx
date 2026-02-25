import { Button, cnm } from "@humansignal/ui";
import { useTranslation } from "react-i18next";

interface FormFooterProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSave?: () => void;
  isEditMode: boolean;
  connectionChecked: boolean;
  filesPreview: any[] | null;
  testConnection: {
    isLoading: boolean;
    mutate: () => void;
  };
  loadPreview: {
    isLoading: boolean;
    mutate: () => void;
  };
  createStorage: {
    isLoading: boolean;
  };
  saveStorage?: {
    isLoading: boolean;
  };
  target?: "import" | "export";
  isProviderDisabled?: boolean;
}

export const FormFooter = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSave,
  isEditMode,
  connectionChecked,
  filesPreview,
  testConnection,
  loadPreview,
  createStorage,
  saveStorage,
  target,
  isProviderDisabled = false,
}: FormFooterProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between p-wide border-t border-neutral-border bg-neutral-background">
      <Button look="outlined" onClick={onPrevious} disabled={currentStep === 0}>
        {t("storage.modal.previous", "Previous")}
      </Button>

      <div className="flex gap-tight items-center">
        {(isEditMode ? currentStep === 0 : currentStep === 1) && (
          <>
            <Button
              waiting={testConnection.isLoading}
              onClick={testConnection.mutate}
              variant={connectionChecked ? "positive" : "primary"}
              className={cnm({
                "border-none shadow-none bg-positive-surface-content-subtle text-positive-content pointer-events-none":
                  connectionChecked,
              })}
              style={connectionChecked ? { textShadow: "none" } : {}}
            >
              {connectionChecked
                ? t("storage.modal.connectionVerified", "Connection Verified")
                : t("storage.modal.testConnection", "Test Connection")}
            </Button>
          </>
        )}

        {(isEditMode ? currentStep === 1 : currentStep === 2) && (
          <Button waiting={loadPreview.isLoading} onClick={loadPreview.mutate} disabled={filesPreview !== null}>
            {filesPreview !== null
              ? t("storage.modal.previewLoaded", "✓ Preview Loaded")
              : t("storage.modal.loadPreview", "Load Preview")}
          </Button>
        )}

        <Button
          onClick={onNext}
          waiting={currentStep === totalSteps - 1 && createStorage.isLoading}
          disabled={
            (!isEditMode && currentStep === 1 && !connectionChecked) || (currentStep === 0 && isProviderDisabled)
          }
          look={currentStep === totalSteps - 1 && target !== "export" ? "outlined" : undefined}
          tooltip={
            currentStep === 1 && !connectionChecked
              ? t("storage.modal.testConnectionBeforeContinuing", "Test connection before continuing")
              : currentStep === 0 && isProviderDisabled
                ? t("storage.modal.providerNotAvailable", "This provider is not available in the current version")
                : undefined
          }
        >
          {currentStep < totalSteps - 1
            ? t("storage.modal.next", "Next")
            : target === "export"
              ? t("storage.modal.save", "Save")
              : t("storage.modal.saveSync", "Save & Sync")}
        </Button>

        {currentStep === totalSteps - 1 && target !== "export" && onSave && (
          <Button onClick={onSave} waiting={saveStorage?.isLoading}>
            {t("storage.modal.save", "Save")}
          </Button>
        )}
      </div>
    </div>
  );
};