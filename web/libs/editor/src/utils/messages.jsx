import { htmlEscape } from "./html";

const URL_CORS_DOCS = "https://labelstud.io/guide/storage.html#Troubleshoot-CORS-and-access-problems";
const URL_TAGS_DOCS = "https://labelstud.io/tags";

export default {
  DONE: "Done!",
  NO_COMP_LEFT: "No more annotations",
  NO_NEXT_TASK: "No More Tasks Left in Queue",
  NO_ACCESS: "You don't have access to this task",

  CONFIRM_TO_DELETE_ALL_REGIONS: "Please confirm you want to delete all labeled regions",

  SIDE_PANEL_TAB_REGIONS: "Regions",
  SIDE_PANEL_TAB_HISTORY: "History",
  SIDE_PANEL_TAB_RELATIONS: "Relations",
  SIDE_PANEL_TAB_INFO: "Info",
  SIDE_PANEL_TAB_COMMENTS: "Comments",
  SIDE_PANEL_TAB_CUSTOM: "Custom",
  SIDE_PANEL_EXPAND_BOTTOM_PANEL: "Expand Bottom Panel",
  SIDE_PANEL_COLLAPSE_BOTTOM_PANEL: "Collapse Bottom Panel",
  SIDE_PANEL_INFO_EMPTY_HEADER: "View region details",
  SIDE_PANEL_INFO_EMPTY_DESCRIPTION: "Select a region to view its properties, metadata and available actions",
  SIDE_PANEL_OUTLINER_EMPTY_HEADER: "Labeled regions will appear here",
  SIDE_PANEL_OUTLINER_EMPTY_DESCRIPTION: "Start labeling and track your results using this panel",
  SIDE_PANEL_OUTLINER_GROUP_MANUALLY: "Group Manually",
  SIDE_PANEL_OUTLINER_MANUAL: "Manual",
  SIDE_PANEL_OUTLINER_MANUAL_GROUPING: "Manual Grouping",
  SIDE_PANEL_OUTLINER_MANUALLY_GROUPED: "Manually Grouped",
  SIDE_PANEL_OUTLINER_GROUP_BY_LABEL: "Group by Label",
  SIDE_PANEL_OUTLINER_BY_LABEL: "By Label",
  SIDE_PANEL_OUTLINER_GROUPED_BY_LABEL: "Grouped by Label",
  SIDE_PANEL_OUTLINER_GROUP_BY_TOOL: "Group by Tool",
  SIDE_PANEL_OUTLINER_BY_TOOL: "By Tool",
  SIDE_PANEL_OUTLINER_GROUPED_BY_TOOL: "Grouped by Tool",
  SIDE_PANEL_OUTLINER_ORDER_BY_TIME: "Order by Time",
  SIDE_PANEL_OUTLINER_BY_TIME: "By Time",
  SIDE_PANEL_OUTLINER_ORDER_BY_SCORE: "Order by Score",
  SIDE_PANEL_OUTLINER_BY_SCORE: "By Score",
  SIDE_PANEL_OUTLINER_ORDER_BY_MEDIA_START_TIME: "Order by Media Start Time",
  SIDE_PANEL_OUTLINER_BY_MEDIA_START_TIME: "By Media Start Time",
  SIDE_PANEL_LEARN_MORE: "Learn more",
  ANNOTATIONS_COMPARE_ALL: "Compare All",
  ANNOTATIONS_COMPARE_ALL_ARIA: "Compare all annotations",
  SUBMIT: "Submit",
  UPDATE: "Update",
  SUBMIT_AND_EXIT: "Submit and exit",
  UPDATE_AND_EXIT: "Update and exit",
  SUBMIT_CURRENT_ANNOTATION: "Submit current annotation",
  SUBMIT_ANNOTATION: "Submit annotation",
  UPDATE_ANNOTATION: "Update annotation",
  IMAGE_TOOL_MOVE: "Move",
  IMAGE_TOOL_PAN_IMAGE: "Pan Image",
  IMAGE_TOOL_ZOOM_IN: "Zoom In",
  IMAGE_TOOL_ZOOM_OUT: "Zoom Out",
  IMAGE_TOOL_ZOOM_TO_FIT: "Zoom to fit",
  IMAGE_TOOL_ZOOM_TO_ACTUAL_SIZE: "Zoom to actual size",

  // Tree validation messages
  ERR_REQUIRED: ({ modelName, field }) => {
    return `Attribute <b>${field}</b> is required for <b>${modelName}</b>`;
  },

  ERR_UNKNOWN_TAG: ({ modelName, field, value }) => {
    return `Tag with name <b>${value}</b> is not registered. Referenced by <b>${modelName}#${field}</b>.`;
  },

  ERR_TAG_NOT_FOUND: ({ modelName, field, value }) => {
    return `Tag with name <b>${value}</b> does not exist in the config. Referenced by <b>${modelName}#${field}</b>.`;
  },

  ERR_TAG_UNSUPPORTED: ({ modelName, field, value, validType }) => {
    return `Invalid attribute <b>${field}</b> for <b>${modelName}</b>: referenced tag is <b>${value}</b>, but <b>${modelName}</b> can only control <b>${[]
      .concat(validType)
      .join(", ")}</b>`;
  },

  ERR_PARENT_TAG_UNEXPECTED: ({ validType, value }) => {
    return `Tag <b>${value}</b> must be a child of one of the tags <b>${[].concat(validType).join(", ")}</b>.`;
  },

  ERR_BAD_TYPE: ({ modelName, field, validType }) => {
    return `Attribute <b>${field}</b> of tag <b>${modelName}</b> has invalid type. Valid types are: <b>${validType}</b>.`;
  },

  ERR_INTERNAL: ({ value }) => {
    return `Internal error. See browser console for more info. Try again or contact developers.<br/>${value}`;
  },

  ERR_GENERAL: ({ value }) => {
    return value;
  },

  // Object loading errors
  URL_CORS_DOCS,
  URL_TAGS_DOCS,

  ERR_LOADING_AUDIO({ attr, url, error }) {
    return (
      <div data-testid="error:audio">
        <p>
          Error while loading audio. Check <code>{attr}</code> field in task.
        </p>
        <p>Technical description: {error}</p>
        <p>URL: {htmlEscape(url)}</p>
      </div>
    );
  },

  ERR_LOADING_S3({ attr, url }) {
    return `
    <div>
      <p>
        There was an issue loading URL from <code>${attr}</code> value.
        The request parameters are invalid.
        If you are using S3, make sure you’ve specified the right bucket region name.
      </p>
      <p>URL: <code><a href="${encodeURI(url)}" target="_blank" rel="noreferrer">${htmlEscape(url)}</a></code></p>
    </div>`;
  },

  ERR_LOADING_CORS({ attr, url }) {
    return `
    <div>
      <p>
        There was an issue loading URL from <code>${attr}</code> value.
        Most likely that's because static server has wide-open CORS.
        <a href="${URL_CORS_DOCS}" target="_blank">Read more on that here.</a>
      </p>
      <p>
        Also check that:
        <ul>
          <li>URL is valid</li>
          <li>Network is reachable</li>
        </ul>
      </p>
      <p>URL: <code><a href="${encodeURI(url)}" target="_blank" rel="noreferrer">${htmlEscape(url)}</a></code></p>
    </div>`;
  },

  ERR_LOADING_HTTP({ attr, url, error }) {
    return `
    <div data-testid="error:http">
      <p>
        There was an issue loading URL from <code>${attr}</code> value
      </p>
      <p>
        Things to look out for:
        <ul>
          <li>URL is valid</li>
          <li>URL scheme matches the service scheme, i.e. https and https</li>
          <li>
            The static server has wide-open CORS,
            <a href=${URL_CORS_DOCS} target="_blank">more on that here</a>
          </li>
        </ul>
      </p>
      <p>
        Technical description: <code>${error}</code>
        <br />
        URL: <code><a href="${encodeURI(url)}" target="_blank" rel="noreferrer">${htmlEscape(url)}</a></code>
      </p>
    </div>`;
  },
};
