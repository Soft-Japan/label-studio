import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Spinner } from "../../../components";
import { cn } from "../../../utils/bem";
import "./Config.scss";
import { EMPTY_CONFIG } from "./Template";
import { API_CONFIG } from "../../../config/ApiConfig";
import { useAPI } from "../../../providers/ApiProvider";
import { useCreateProjectI18n } from "../i18n";

const configClass = cn("configure");

// Lazy load Label Studio with a single promise to avoid multiple loads
// and enable as early as possible to load the dependencies once this component is mounted for the first time
let dependencies;
const loadDependencies = async () => {
  if (!dependencies) {
    dependencies = import("@humansignal/editor");
  }
  return dependencies;
};

export const Preview = ({ config, data, error, loading, project }) => {
  const { t } = useCreateProjectI18n();
  // @see comment about dependencies above
  loadDependencies();

  const [storeReady, setStoreReady] = useState(false);
  const lsf = useRef(null);
  const rootRef = useRef();
  const api = useAPI();
  const projectRef = useRef(project);
  projectRef.current = project;

  const currentTask = useMemo(() => {
    return {
      id: 1,
      annotations: [],
      predictions: [],
      data,
    };
  }, [data]);
  
  const localizedEditorMessages = useMemo(
    () => ({
      SIDE_PANEL_TAB_REGIONS: t("createProject.config.preview.sidePanel.tabs.regions", "Regions"),
      SIDE_PANEL_TAB_HISTORY: t("createProject.config.preview.sidePanel.tabs.history", "History"),
      SIDE_PANEL_TAB_RELATIONS: t("createProject.config.preview.sidePanel.tabs.relations", "Relations"),
      SIDE_PANEL_TAB_INFO: t("createProject.config.preview.sidePanel.tabs.info", "Info"),
      SIDE_PANEL_TAB_COMMENTS: t("createProject.config.preview.sidePanel.tabs.comments", "Comments"),
      SIDE_PANEL_TAB_CUSTOM: t("createProject.config.preview.sidePanel.tabs.custom", "Custom"),
      SIDE_PANEL_SECTION_ANNOTATION_HISTORY: t(
        "createProject.config.preview.sidePanel.sections.annotationHistory",
        "Annotation History",
      ),
      SIDE_PANEL_SECTION_RELATIONS: t("createProject.config.preview.sidePanel.sections.relations", "Relations"),
      SIDE_PANEL_SECTION_COMMENTS: t("createProject.config.preview.sidePanel.sections.comments", "Comments"),
      SIDE_PANEL_RELATIONS_EMPTY_HEADER: t(
        "createProject.config.preview.sidePanel.relations.empty.header",
        "Create relations between regions",
      ),
      SIDE_PANEL_RELATIONS_EMPTY_DESCRIPTION: t(
        "createProject.config.preview.sidePanel.relations.empty.description",
        "Link regions to define relationships between them",
      ),
      SIDE_PANEL_HISTORY_EMPTY_HEADER: t(
        "createProject.config.preview.sidePanel.history.empty.header",
        "View annotation activity",
      ),
      SIDE_PANEL_HISTORY_EMPTY_DESCRIPTION: t(
        "createProject.config.preview.sidePanel.history.empty.description",
        "See a log of user actions for this annotation",
      ),
      SIDE_PANEL_INFO_EMPTY_HEADER: t(
        "createProject.config.preview.sidePanel.info.empty.header",
        "View region details",
      ),
      SIDE_PANEL_INFO_EMPTY_DESCRIPTION: t(
        "createProject.config.preview.sidePanel.info.empty.description",
        "Select a region to view its properties, metadata and available actions",
      ),
      SIDE_PANEL_OUTLINER_EMPTY_HEADER: t(
        "createProject.config.preview.sidePanel.outliner.empty.header",
        "Labeled regions will appear here",
      ),
      SIDE_PANEL_OUTLINER_EMPTY_DESCRIPTION: t(
        "createProject.config.preview.sidePanel.outliner.empty.description",
        "Start labeling and track your results using this panel",
      ),
      SIDE_PANEL_OUTLINER_FILTERS_ALL_HIDDEN_TITLE: t(
        "createProject.config.preview.sidePanel.outliner.filters.allHidden.title",
        "All regions hidden",
      ),
      SIDE_PANEL_OUTLINER_FILTERS_ALL_HIDDEN_DESCRIPTION: t(
        "createProject.config.preview.sidePanel.outliner.filters.allHidden.description",
        "Adjust or remove the filters to view",
      ),
      SIDE_PANEL_OUTLINER_FILTERS_HIDDEN_REGIONS_SINGLE: t(
        "createProject.config.preview.sidePanel.outliner.filters.hiddenRegions.single",
        "There is {count} hidden region",
      ),
      SIDE_PANEL_OUTLINER_FILTERS_HIDDEN_REGIONS_PLURAL: t(
        "createProject.config.preview.sidePanel.outliner.filters.hiddenRegions.plural",
        "There are {count} hidden regions",
      ),
      SIDE_PANEL_OUTLINER_FILTERS_HIDDEN_REGIONS_DESCRIPTION: t(
        "createProject.config.preview.sidePanel.outliner.filters.hiddenRegions.description",
        "Adjust or remove filters to view",
      ),
      SIDE_PANEL_OUTLINER_GROUP_MANUALLY: t(
        "createProject.config.preview.sidePanel.outliner.group.manually",
        "Group Manually",
      ),
      SIDE_PANEL_OUTLINER_MANUAL: t("createProject.config.preview.sidePanel.outliner.group.manual", "Manual"),
      SIDE_PANEL_OUTLINER_MANUAL_GROUPING: t(
        "createProject.config.preview.sidePanel.outliner.group.manualGrouping",
        "Manual Grouping",
      ),
      SIDE_PANEL_OUTLINER_MANUALLY_GROUPED: t(
        "createProject.config.preview.sidePanel.outliner.group.manuallyGrouped",
        "Manually Grouped",
      ),
      SIDE_PANEL_OUTLINER_GROUP_BY_LABEL: t(
        "createProject.config.preview.sidePanel.outliner.group.byLabel",
        "Group by Label",
      ),
      SIDE_PANEL_OUTLINER_BY_LABEL: t("createProject.config.preview.sidePanel.outliner.group.label", "By Label"),
      SIDE_PANEL_OUTLINER_GROUPED_BY_LABEL: t(
        "createProject.config.preview.sidePanel.outliner.group.groupedByLabel",
        "Grouped by Label",
      ),
      SIDE_PANEL_OUTLINER_GROUP_BY_TOOL: t(
        "createProject.config.preview.sidePanel.outliner.group.byTool",
        "Group by Tool",
      ),
      SIDE_PANEL_OUTLINER_BY_TOOL: t("createProject.config.preview.sidePanel.outliner.group.tool", "By Tool"),
      SIDE_PANEL_OUTLINER_GROUPED_BY_TOOL: t(
        "createProject.config.preview.sidePanel.outliner.group.groupedByTool",
        "Grouped by Tool",
      ),
      SIDE_PANEL_OUTLINER_ORDER_BY_TIME: t(
        "createProject.config.preview.sidePanel.outliner.order.byTime",
        "Order by Time",
      ),
      SIDE_PANEL_OUTLINER_BY_TIME: t("createProject.config.preview.sidePanel.outliner.order.time", "By Time"),
      SIDE_PANEL_OUTLINER_ORDER_BY_SCORE: t(
        "createProject.config.preview.sidePanel.outliner.order.byScore",
        "Order by Score",
      ),
      SIDE_PANEL_OUTLINER_BY_SCORE: t("createProject.config.preview.sidePanel.outliner.order.score", "By Score"),
      SIDE_PANEL_OUTLINER_ORDER_BY_MEDIA_START_TIME: t(
        "createProject.config.preview.sidePanel.outliner.order.byMediaStartTime",
        "Order by Media Start Time",
      ),
      SIDE_PANEL_OUTLINER_BY_MEDIA_START_TIME: t(
        "createProject.config.preview.sidePanel.outliner.order.mediaStartTime",
        "By Media Start Time",
      ),
      SIDE_PANEL_LEARN_MORE: t("createProject.config.preview.sidePanel.learnMore", "Learn more"),
    }),
    [t],
  );

  /**
   * Proxy urls to presign them if storage is connected
   * @param {*} _ LS instance
   * @param {string} url http/https are not proxied and returned as is
   */
  const onPresignUrlForProject = async (_, url) => {
    // if URL is a relative, presigned url (url matches /tasks|projects/:id/resolve/.*) make it absolute
    const presignedUrlPattern = /^\/(?:tasks|projects)\/\d+\/resolve\/?/;
    if (presignedUrlPattern.test(url)) {
      url = new URL(url, document.location.origin).toString();
    }

    const parsedUrl = new URL(url);

    // return same url if http(s)
    if (["http:", "https:"].includes(parsedUrl.protocol)) return url;

    const projectId = projectRef.current.id;

    const fileuri = btoa(url);

    return api.api.createUrl(API_CONFIG.endpoints.presignUrlForProject, { projectId, fileuri }).url;
  };

  const currentConfig = useMemo(() => {
    // empty string causes error in LSF
    return config ?? EMPTY_CONFIG;
  }, [config]);

  const initLabelStudio = useCallback(
    async (config, task) => {
      // wait for dependencies to load, the promise is resolved only once
      // and is started when the component is mounted for the first time
      await loadDependencies();

      if (lsf.current || !task.data) return;

      try {
        lsf.current = new window.LabelStudio(rootRef.current, {
          config,
          task,
          interfaces: ["side-column"],
          messages: localizedEditorMessages,
          // with SharedStore we should use more late event
          onStorageInitialized(LS) {
            LS.settings.bottomSidePanel = true;

            const initAnnotation = () => {
              const as = LS.annotationStore;
              const c = as.createAnnotation();

              as.selectAnnotation(c.id);
              setStoreReady(true);
            };

            // and even then we need to wait a little even after the store is initialized
            setTimeout(initAnnotation);
          },
        });

        lsf.current.on("presignUrlForProject", onPresignUrlForProject);
      } catch (err) {
        console.error(err);
      }
    },
    [localizedEditorMessages],
  );

  useEffect(() => {
    const opacity = loading || error ? 0.6 : 1;
    // to avoid rerenders and data loss we do it this way

    document.getElementById("label-studio").style.opacity = opacity;
  }, [loading, error]);

  useEffect(() => {
    initLabelStudio(currentConfig, currentTask).then(() => {
      if (storeReady && lsf.current?.store) {
        const store = lsf.current.store;

        store.resetState();
        store.assignTask(currentTask);
        store.assignConfig(currentConfig);
        store.initializeStore(currentTask);

        const c = store.annotationStore.addAnnotation({
          userGenerate: true,
        });

        store.annotationStore.selectAnnotation(c.id);
        console.log("LSF updated");
      }
    });
  }, [currentConfig, currentTask, storeReady]);

  useEffect(() => {
    return () => {
      if (lsf.current) {
        console.info("Destroying LSF");
        lsf.current.destroy();
        lsf.current = null;
      }
    };
  }, []);

  return (
    <div className={configClass.elem("preview")}>
      <h3>{t("createProject.config.preview.title", "Preview")}</h3>
      {error && (
        <div className={configClass.elem("preview-error")}>
          <h2>
            {error.detail} {error.id}
          </h2>
          {error.validation_errors?.non_field_errors?.map?.((err) => (
            <p key={err}>{err}</p>
          ))}
          {error.validation_errors?.label_config?.map?.((err) => (
            <p key={err}>{err}</p>
          ))}
          {error.validation_errors?.map?.((err) => (
            <p key={err}>{err}</p>
          ))}
        </div>
      )}
      {!data && loading && <Spinner style={{ width: "100%", height: "50vh" }} />}
      <div id="label-studio" className={configClass.elem("preview-ui")} ref={rootRef} />
    </div>
  );
};
