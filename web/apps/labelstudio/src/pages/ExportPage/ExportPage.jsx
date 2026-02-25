import { useEffect, useRef, useState, useCallback } from "react";
import { useHistory } from "react-router";
import { Button } from "@humansignal/ui";
import {
  IconWarningCircleFilled,
  IconTerminal,
  IconCode,
  IconBook,
  IconExternal,
  IconCopyOutline,
} from "@humansignal/icons";
import { Form, Input } from "../../components/Form";
import { Modal } from "../../components/Modal/Modal";
import { Space } from "../../components/Space/Space";
import { useAPI } from "../../providers/ApiProvider";
import { useFixedLocation, useParams } from "../../providers/RoutesProvider";
import { cn } from "../../utils/bem";
import { isDefined, copyText } from "../../utils/helpers";
import { useDataManagerI18n } from "../DataManager/i18n";
import "./ExportPage.scss";

// Community Edition exports run synchronously in a single HTTP request.
// Large exports can exceed typical proxy timeouts, so we warn early and link to alternatives.
const LARGE_EXPORT_TASK_THRESHOLD = 1000;
const EXPORT_TIMEOUT_DOCS_URL = "https://labelstud.io/guide/export.html#Export-timeout-in-Community-Edition";
const EXPORT_CONSOLE_DOCS_URL = "https://labelstud.io/guide/export.html#Export-using-console-command";
const EXPORT_SNAPSHOT_SDK_URL = "https://api.labelstud.io/api-reference/api-reference/projects/exports/create";
const ENTERPRISE_URL = "https://docs.humansignal.com/guide/label_studio_compare";

// const formats = {
//   json: 'JSON',
//   csv: 'CSV',
// };

const downloadFile = (blob, filename) => {
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

const wait = () => new Promise((resolve) => setTimeout(resolve, 5000));

const isTimeoutLikeStatus = (status) => status === 408 || status === 502 || status === 504;

const localizeTag = (tag, t) => {
  const slug = String(tag)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return t(`datamanager.export.tags.${slug}`, tag);
};

const localizeFormat = (format, t) => {
  const name = format.name ?? format.title;

  return {
    title: t(`datamanager.export.formats.${name}.title`, format.title),
    description: format.description
      ? t(`datamanager.export.formats.${name}.description`, format.description)
      : format.description,
    tags: format.tags?.map?.((tag) => localizeTag(tag, t)) ?? format.tags,
  };
};


export const ExportPage = () => {
  const history = useHistory();
  const location = useFixedLocation();
  const pageParams = useParams();
  const api = useAPI();
  const { t } = useDataManagerI18n();
  const [previousExports, setPreviousExports] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const [downloadingMessage, setDownloadingMessage] = useState(false);
  const [availableFormats, setAvailableFormats] = useState([]);
  const [currentFormat, setCurrentFormat] = useState("JSON");
  const [projectTaskNumber, setProjectTaskNumber] = useState(null);
  const [exportIssue, setExportIssue] = useState(null);

  /** @type {import('react').RefObject<Form>} */
  const form = useRef();

  const proceedExport = async () => {
    setExportIssue(null);
    setDownloading(true);

    const messageTimer = window.setTimeout(() => {
      setDownloadingMessage(true);
    }, 1000);

    try {
      const params = form.current.assembleFormData({
        asJSON: true,
        full: true,
        booleansAsNumbers: true,
      });

      const response = await api.callApi("exportRaw", {
        params: {
          pk: pageParams.id,
          ...params,
        },
      });

      // The API proxy can return `null` for certain network errors; treat it as timeout-like
      // and show actionable guidance instead of a generic error.
      if (!response) {
        setExportIssue("timeout");
        return;
      }

      if (response.ok) {
        const blob = await response.blob();

        downloadFile(blob, response.headers.get("filename"));
        return;
      }

      if (isTimeoutLikeStatus(response.status)) {
        setExportIssue("timeout");
        return;
      }

      api.handleError(response);
    } finally {
      window.clearTimeout(messageTimer);
      setDownloading(false);
      setDownloadingMessage(false);
    }
  };

  useEffect(() => {
    if (isDefined(pageParams.id)) {
      let cancelled = false;

      api
        .callApi("previousExports", {
          params: {
            pk: pageParams.id,
          },
        })
        .then(({ export_files }) => {
          if (!cancelled) setPreviousExports(export_files.slice(0, 1));
        });

      api
        .callApi("exportFormats", {
          params: {
            pk: pageParams.id,
          },
        })
        .then((formats) => {
          if (cancelled) return;
          setAvailableFormats(formats);
          setCurrentFormat(formats[0]?.name);
        });

      // Fetch project metadata to show a proactive warning for large exports.
      // This is best-effort and should not trigger global error UI if it fails.
      api
        .callApi("project", {
          params: { pk: pageParams.id },
          errorFilter: () => true,
        })
        .then((project) => {
          if (cancelled) return;
          setProjectTaskNumber(project?.task_number ?? null);
        });

      return () => {
        cancelled = true;
      };
    }
  }, [pageParams.id]);

  return (
    <Modal
      onHide={() => {
        const path = location.pathname.replace(ExportPage.path, "");
        const search = location.search;

        history.replace(`${path}${search !== "?" ? search : ""}`);
      }}
      title={t("datamanager.export.title", "Export data")}
      style={{ width: 720 }}
      closeOnClickOutside={false}
      allowClose={!downloading}
      // footer="Read more about supported export formats in the Documentation."
      visible
    >
      <div className={cn("export-page").toClassName()}>
        <FormatInfo
          t={t}
          availableFormats={availableFormats}
          selected={currentFormat}
          onClick={(format) => setCurrentFormat(format.name)}
        />

        <ExportLargeProjectWarning taskCount={projectTaskNumber} />
        {exportIssue === "timeout" && (
          <ExportTimeoutGuidance projectId={pageParams.id} exportType={currentFormat} t={t} />
        )}

        <Form ref={form}>
          <Input type="hidden" name="exportType" value={currentFormat} />
        </Form>

        <div className={cn("export-page").elem("footer").toClassName()}>
          {downloadingMessage && (
            <div className={cn("export-page").elem("status-message").toClassName()}>
              {t("datamanager.export.preparing", "Files are being prepared. It might take long time.")}
            </div>
          )}
          <Space style={{ width: "100%" }} spread>
            <div className={cn("export-page").elem("recent").toClassName()}>
              <a className="no-go" href={EXPORT_TIMEOUT_DOCS_URL} target="_blank" rel="noreferrer">
                {t("datamanager.export.troubleshoot", "Having a timeout or trouble exporting large projects?")}
              </a>
            </div>
            <div className={cn("export-page").elem("actions").toClassName()}>
              <Button
                className="w-[135px]"
                onClick={proceedExport}
                waiting={downloading}
                aria-label={t("datamanager.export.aria.exportData", "Export data")}
              >
                {t("datamanager.export.actions.export", "Export")}
              </Button>
            </div>
          </Space>
        </div>
      </div>
    </Modal>
  );
};

const FormatInfo = ({ availableFormats, selected, onClick, t }) => {
  return (
    <div className={cn("formats").toClassName()}>
      <div className={cn("formats").elem("info").toClassName()}>
        {t("datamanager.export.formatInfo", "You can export dataset in one of the following formats:")}
      </div>
      <div className={cn("formats").elem("list").toClassName()}>
        {availableFormats.map((format) => {
          // API provides format metadata in English; localize known titles/descriptions/tags for active locale.
          // Fall back to backend values for unknown or future formats.
          const localized = localizeFormat(format, t);

          return (
            <div
              key={format.name}
              className={cn("formats")
                .elem("item")
                .mod({
                  active: !format.disabled,
                  selected: format.name === selected,
                })
                .toClassName()}
              onClick={!format.disabled ? () => onClick(format) : null}
            >
              <div className={cn("formats").elem("name").toClassName()}>
                {localized.title}

                <Space size="small">
                  {localized.tags?.map?.((tag, index) => (
                    <div key={index} className={cn("formats").elem("tag").toClassName()}>
                      {tag}
                    </div>
                  ))}
                </Space>
              </div>

              {localized.description && (
                <div className={cn("formats").elem("description").toClassName()}>{localized.description}</div>
              )}
            </div>
          );
        })}
      </div>
      <div className={cn("formats").elem("feedback").toClassName()}>
        {t("datamanager.export.feedback.title", "Can't find an export format?")}
        <br />
        {t("datamanager.export.feedback.prefix", "Please let us know in")}
        <a className="no-go" href="https://slack.labelstud.io/?source=product-export" target="_blank" rel="noreferrer">
          {t("datamanager.export.feedback.slack", "Slack")}
        </a>{" "}
        {t("datamanager.export.feedback.middle", "or submit an issue to the")}
        <a
          className="no-go"
          href="https://github.com/HumanSignal/label-studio-converter/issues"
          target="_blank"
          rel="noreferrer"
        >
          {t("datamanager.export.feedback.repository", "Repository")}
        </a>
      </div>
    </div>
  );
};

ExportPage.path = "/export";
ExportPage.modal = true;

const ExportLargeProjectWarning = ({ taskCount, t }) => {
  if (!Number.isFinite(taskCount) || taskCount < LARGE_EXPORT_TASK_THRESHOLD) return null;

  return (
    <div className={cn("export-page").elem("warning").toClassName()}>
      <div className={cn("export-page").elem("warning-title").toClassName()}>
        {t("datamanager.export.largeProject.title", "Large project detected ({{count}} tasks)", {
          count: taskCount.toLocaleString(),
        })}
      </div>
      <div className={cn("export-page").elem("warning-body").toClassName()}>
        {t(
          "datamanager.export.largeProject.prefix",
          "To avoid potential timeouts during large dataset exports in the Community Edition, use the",
        )}
        <a className="no-go" href={EXPORT_TIMEOUT_DOCS_URL} target="_blank" rel="noreferrer">
          {t("datamanager.export.largeProject.cliSdk", "CLI/SDK export options")}
        </a>{" "}
        {t("datamanager.export.largeProject.middle", "or consider")}
        <a className="no-go" href={ENTERPRISE_URL} target="_blank" rel="noreferrer">
          {t("datamanager.export.largeProject.enterprise", "Enterprise")}
        </a>{" "}
        {t("datamanager.export.largeProject.suffix", "for background exports at scale.")}
      </div>
    </div>
  );
};

const ExportTimeoutGuidance = ({ projectId, exportType, t }) => {
  const cliCommand = `label-studio export ${projectId} ${exportType} --export-path=<output-path>`;
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    copyText(cliCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [cliCommand]);

  return (
    <div className={cn("export-page").elem("timeout").toClassName()}>
      <div className={cn("export-page").elem("timeout-header").toClassName()}>
        <IconWarningCircleFilled className={cn("export-page").elem("timeout-icon").toClassName()} />
        <div className={cn("export-page").elem("timeout-title").toClassName()}>
          {t("datamanager.export.timeout.title", "Export timed out")}
        </div>
      </div>
      <div className={cn("export-page").elem("timeout-body").toClassName()}>
        {t(
          "datamanager.export.timeout.body",
          "This export is processed synchronously in the Community Edition UI and can exceed typical reverse-proxy timeouts (often around 90 seconds) for large datasets.",
        )}
      </div>

      <div className={cn("export-page").elem("timeout-actions").toClassName()}>
        <div className={cn("export-page").elem("timeout-actions-title").toClassName()}>
          {t("datamanager.export.timeout.recommended", "Recommended options:")}
        </div>
        <ul className={cn("export-page").elem("timeout-actions-list").toClassName()}>
          <li>
            <div className={cn("export-page").elem("timeout-action-item").toClassName()}>
              <IconTerminal className={cn("export-page").elem("timeout-action-icon").toClassName()} />
              <div className={cn("export-page").elem("timeout-action-content").toClassName()}>
                <span>
                  {t("datamanager.export.timeout.exportUsing", "Export using the")}
                  <a className="no-go" href={EXPORT_CONSOLE_DOCS_URL} target="_blank" rel="noreferrer">
                    {t("datamanager.export.timeout.consoleCommand", "console command")}
                    <IconExternal className={cn("export-page").elem("timeout-link-icon").toClassName()} />
                  </a>
                  :
                </span>
                <div className={cn("export-page").elem("timeout-code-wrapper").toClassName()}>
                  <pre className={cn("export-page").elem("timeout-code").toClassName()}>
                    <code>{cliCommand}</code>
                  </pre>
                  <button
                    type="button"
                    className={cn("export-page").elem("timeout-copy-button").toClassName()}
                    onClick={handleCopy}
                    aria-label={t("datamanager.export.timeout.copyCommand", "Copy command")}
                    title={
                      copied
                        ? t("datamanager.export.timeout.copiedWithBang", "Copied!")
                        : t("datamanager.export.timeout.copyCommand", "Copy command")
                    }
                  >
                    <IconCopyOutline className={cn("export-page").elem("timeout-copy-icon").toClassName()} />
                    {copied && (
                      <span className={cn("export-page").elem("timeout-copy-text").toClassName()}>
                        {t("datamanager.export.timeout.copied", "Copied")}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </li>
          <li>
            <div className={cn("export-page").elem("timeout-action-item").toClassName()}>
              <IconCode className={cn("export-page").elem("timeout-action-icon").toClassName()} />
              <div className={cn("export-page").elem("timeout-action-content").toClassName()}>
                {t("datamanager.export.timeout.use", "Use")}
                <a className="no-go" href={EXPORT_SNAPSHOT_SDK_URL} target="_blank" rel="noreferrer">
                  {t("datamanager.export.timeout.sdkSnapshots", "export snapshots via the SDK")}
                  <IconExternal className={cn("export-page").elem("timeout-link-icon").toClassName()} />
                </a>{" "}
                {t(
                  "datamanager.export.timeout.sdkSuffix",
                  "to create and download a snapshot without relying on a single UI request.",
                )}
              </div>
            </div>
          </li>
          <li>
            <div className={cn("export-page").elem("timeout-action-item").toClassName()}>
              <IconWarningCircleFilled className={cn("export-page").elem("timeout-action-icon").toClassName()} />
              <div className={cn("export-page").elem("timeout-action-content").toClassName()}>
                {t("datamanager.export.timeout.enterprisePrefix", "For large-scale exports in the UI, consider")}
                <a className="no-go" href={ENTERPRISE_URL} target="_blank" rel="noreferrer">
                  {t("datamanager.export.timeout.enterprise", "Label Studio Enterprise")}
                  <IconExternal className={cn("export-page").elem("timeout-link-icon").toClassName()} />
                </a>{" "}
                {t(
                  "datamanager.export.timeout.enterpriseSuffix",
                  "since it is designed for large-scale projects and asynchronous exports.",
                )}
              </div>
            </div>
          </li>
        </ul>
        <div className={cn("export-page").elem("timeout-footer").toClassName()}>
          <IconBook className={cn("export-page").elem("timeout-footer-icon").toClassName()} />
          <span>
            {t("datamanager.export.timeout.moreDetails", "More details in the documentation:")}
            <a className="no-go" href={EXPORT_TIMEOUT_DOCS_URL} target="_blank" rel="noreferrer">
              {t("datamanager.export.timeout.communityEdition", "Export timeout in Community Edition")}
              <IconExternal className={cn("export-page").elem("timeout-link-icon").toClassName()} />
            </a>
          </span>
        </div>
      </div>
    </div>
  );
};
