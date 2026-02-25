import { Button, Checkbox, Dropdown, EnterpriseBadge } from "@humansignal/ui";
import { inject, observer } from "mobx-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../../utils/bem";
import { Menu } from "./Menu/Menu";

export const SYSTEM_COLUMN_TITLE_KEYS = {
  "ID": "datamanager.columns.id",
  "Inner ID": "datamanager.columns.innerId",
  "Completed": "datamanager.columns.completed",
  "Annotations": "datamanager.columns.annotations",
  "Cancelled": "datamanager.columns.cancelled",
  "Canceled": "datamanager.columns.cancelled",
  "Predictions": "datamanager.columns.predictions",
  "Annotated by": "datamanager.columns.annotatedBy",
  "Annotation results": "datamanager.columns.annotationResults",
  "Annotation IDs": "datamanager.columns.annotationIds",
  "Prediction score": "datamanager.columns.predictionScore",
  "Prediction Score": "datamanager.columns.predictionScore",
  "Prediction model versions": "datamanager.columns.predictionModelVersions",
  "Prediction model version": "datamanager.columns.predictionModelVersions",
  "Prediction Model Versions": "datamanager.columns.predictionModelVersions",
  "Prediction results": "datamanager.columns.predictionResults",
  "Prediction Results": "datamanager.columns.predictionResults",
  "Upload filename": "datamanager.columns.uploadFilename",
  "Upload Filename": "datamanager.columns.uploadFilename",
  "Storage filename": "datamanager.columns.storageFilename",
  "Storage Filename": "datamanager.columns.storageFilename",
  "Created at": "datamanager.columns.createdAt",
  "Created At": "datamanager.columns.createdAt",
  "Updated at": "datamanager.columns.updatedAt",
  "Updated At": "datamanager.columns.updatedAt",
  "Updated by": "datamanager.columns.updatedBy",
  "Updated By": "datamanager.columns.updatedBy",
  "Lead Time": "datamanager.columns.leadTime",
  "Lead time": "datamanager.columns.leadTime",
  "Draft": "datamanager.columns.draft",
  "Drafts": "datamanager.columns.draft",
  "prediction_score": "datamanager.columns.predictionScore",
  "prediction_model_versions": "datamanager.columns.predictionModelVersions",
  "prediction_results": "datamanager.columns.predictionResults",
  "upload_filename": "datamanager.columns.uploadFilename",
  "storage_filename": "datamanager.columns.storageFilename",
  "created_at": "datamanager.columns.createdAt",
  "updated_at": "datamanager.columns.updatedAt",
  "updated_by": "datamanager.columns.updatedBy",
  "lead_time": "datamanager.columns.leadTime",
  "draft": "datamanager.columns.draft",
  "data": "datamanager.columns.data",
  "Data": "datamanager.columns.data",
  "image": "datamanager.columns.image",
  "Image": "datamanager.columns.image",
};

export const translateColumnTitle = (t, title) => {
  const normalizedTitle = String(title);
  const key =
    SYSTEM_COLUMN_TITLE_KEYS[normalizedTitle] ??
    SYSTEM_COLUMN_TITLE_KEYS[normalizedTitle.toLowerCase()] ??
    SYSTEM_COLUMN_TITLE_KEYS[normalizedTitle.replace(/\s+/g, "_").toLowerCase()];

  return key ? t(key, normalizedTitle) : normalizedTitle;
};


const injector = inject(({ store }) => {
  return {
    columns: Array.from(store.currentView?.targetColumns ?? []),
  };
});

const FieldsMenu = observer(({ columns, WrapperComponent, onClick, onReset, selected, resetTitle }) => {
  const { t } = useTranslation();
  const MenuItem = (col, onClick) => {
    const enterpriseBadge = col.enterprise_badge ?? col.original?.enterprise_badge;
    const shouldDisable = col.disabled || enterpriseBadge;

    const titleContent = <span>{translateColumnTitle(t, col.title)}</span>;

    return (
      <Menu.Item key={col.key} name={col.key} onClick={onClick} disabled={shouldDisable}>
        {WrapperComponent && col.wra !== false ? (
          <WrapperComponent column={col} disabled={shouldDisable} enterpriseBadge={enterpriseBadge}>
            {titleContent}
          </WrapperComponent>
        ) : (
          <span className="flex items-center justify-between w-full gap-base">
            {titleContent}
            {enterpriseBadge && <EnterpriseBadge ghost />}
          </span>
        )}
      </Menu.Item>
    );
  };

  return (
    <Menu size="small" selectedKeys={selected ? [selected] : ["none"]} closeDropdownOnItemClick={false}>
      {onReset &&
        MenuItem(
          {
            key: "none",
            title: resetTitle ?? t("datamanager.toolbar.default", "Default"),
            wrap: false,
          },
          onReset,
        )}

      {columns.map((col) => {
        if (col.children) {
          return (
            <Menu.Group key={col.key} title={translateColumnTitle(t, col.title)}>
              {col.children.map((col) => MenuItem(col, () => onClick?.(col)))}
            </Menu.Group>
          );
        }
        if (!col.parent) {
          return MenuItem(col, () => onClick?.(col));
        }

        return null;
      })}
    </Menu>
  );
});

export const FieldsButton = injector(
  ({
    columns,
    size,
    style,
    wrapper,
    title,
    icon,
    className,
    trailingIcon,
    onClick,
    onReset,
    resetTitle,
    filter,
    selected,
    tooltip,
    tooltipTheme = "dark",
    openUpwardForShortViewport = true,
    "data-testid": dataTestId,
  }) => {
    const content = [];

    if (title) content.push(<React.Fragment key="f-button-title">{title}</React.Fragment>);

    const renderButton = () => {
      return (
        <Button
          variant="neutral"
          size="small"
          look="outlined"
          leading={icon}
          trailing={trailingIcon}
          data-testid={dataTestId}
        >
          {content.length ? content : null}
        </Button>
      );
    };

    return (
      <Dropdown.Trigger
        content={
          <FieldsMenu
            columns={filter ? columns.filter(filter) : columns}
            WrapperComponent={wrapper}
            onClick={onClick}
            size={size}
            onReset={onReset}
            selected={selected}
            resetTitle={resetTitle}
          />
        }
        style={{ maxHeight: 280, overflow: "auto" }}
        openUpwardForShortViewport={openUpwardForShortViewport}
      >
        {tooltip ? (
          <div className={`${cn("field-button").toClassName()} h-[40px] flex items-center`} style={{ zIndex: 1000 }}>
            <Button
              tooltip={tooltip}
              variant="neutral"
              size={size}
              look="outlined"
              leading={icon}
              trailing={trailingIcon}
              data-testid={dataTestId}
            >
              {content.length ? content : null}
            </Button>
          </div>
        ) : (
          renderButton()
        )}
      </Dropdown.Trigger>
    );
  },
);

FieldsButton.Checkbox = observer(({ column, children, disabled, enterpriseBadge }) => {
  const shouldDisable = disabled;

  return (
    <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
        <Checkbox size="small" checked={!column.is_hidden} onChange={column.toggleVisibility} disabled={shouldDisable}>
          {children}
        </Checkbox>
      </div>
      {enterpriseBadge && (
        <div style={{ flexShrink: 0 }}>
          <EnterpriseBadge ghost />
        </div>
      )}
    </div>
  );
});
