import { observer } from "mobx-react";
import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "../../../utils/bem";
import { PanelBase, type PanelProps } from "../PanelBase";
import { OutlinerTree } from "./OutlinerTree";
import { ViewControls } from "./ViewControls";
import "./OutlinerPanel.scss";
import { IconInfo } from "@humansignal/icons";
import { IconLsLabeling } from "@humansignal/ui";
import { EmptyState } from "../Components/EmptyState";
import { getDocsUrl } from "../../../utils/docs";
import { getEnv } from "mobx-state-tree";
import messages from "../../../utils/messages";

// Local type definitions based on ViewControls and RegionStore
type GroupingOptions = "manual" | "label" | "type";
type OrderingOptions = "score" | "date" | "mediaStartTime";

interface OutlinerPanelProps extends PanelProps {
  regions: any;
}

interface OutlinerTreeComponentProps {
  regions: any;
}

const OutlinerFFClasses: string[] = [];

OutlinerFFClasses.push("ff_hide_all_regions");

const OutlinerPanelComponent: FC<OutlinerPanelProps> = ({ regions, ...props }) => {
  const panelMessages = getEnv(regions)?.messages ?? messages;
  const [group, setGroup] = useState<GroupingOptions>(regions.group);
  const onOrderingChange = useCallback(
    (value: OrderingOptions) => {
      regions.setSort(value);
    },
    [regions],
  );

  const onGroupingChange = useCallback(
    (value: GroupingOptions) => {
      regions.setGrouping(value);
      setGroup(value);
    },
    [regions],
  );

  useEffect(() => {
    setGroup(regions.group);
  }, []);

  regions.setGrouping(group);

  return (
    <PanelBase {...props} name="outliner" mix={OutlinerFFClasses} title={panelMessages.SIDE_PANEL_TAB_REGIONS}>
      <ViewControls
        ordering={regions.sort}
        regions={regions}
        orderingDirection={regions.sortOrder}
        onOrderingChange={onOrderingChange}
        onGroupingChange={onGroupingChange}
      />
      <OutlinerTreeComponent regions={regions} />
    </PanelBase>
  );
};

const OutlinerStandAlone: FC<OutlinerPanelProps> = ({ regions }) => {
  const onOrderingChange = useCallback(
    (value: OrderingOptions) => {
      regions.setSort(value);
    },
    [regions],
  );

  const onGroupingChange = useCallback(
    (value: GroupingOptions) => {
      regions.setGrouping(value);
    },
    [regions],
  );

  return (
    <div
      className={cn("outliner")
        .mix(...OutlinerFFClasses)
        .toClassName()}
    >
      <ViewControls
        ordering={regions.sort}
        regions={regions}
        orderingDirection={regions.sortOrder}
        onOrderingChange={onOrderingChange}
        onGroupingChange={onGroupingChange}
      />
      <OutlinerTreeComponent regions={regions} />
    </div>
  );
};

const OutlinerEmptyState = ({ panelMessages }) => (
  <EmptyState
    icon={<IconLsLabeling width={24} height={24} />}
    header={panelMessages.SIDE_PANEL_OUTLINER_EMPTY_HEADER}
    description={
      <>
        <span>{panelMessages.SIDE_PANEL_OUTLINER_EMPTY_DESCRIPTION}</span>
      </>
    }
    learnMore={{
      href: getDocsUrl("guide/labeling"),
      text: panelMessages.SIDE_PANEL_LEARN_MORE,
      testId: "regions-panel-learn-more",
    }}
  />
);

const OutlinerTreeComponent: FC<OutlinerTreeComponentProps> = observer(({ regions }) => {
  const panelMessages = getEnv(regions)?.messages ?? messages;
  const allRegionsHidden = regions?.regions?.length > 0 && regions?.filter?.length === 0;

  const hiddenRegions = useMemo(() => {
    if (!regions?.regions?.length || !regions.filter?.length) return 0;

    return regions?.regions?.length - regions?.filter?.length;
  }, [regions?.regions?.length, regions?.filter?.length]);

  return (
    <>
      {allRegionsHidden ? (
        <div className={cn("filters-info").toClassName()}>
          <IconInfo width={21} height={20} />
          <div className={cn("filters-info").elem("filters-title").toClassName()}>
            {panelMessages.SIDE_PANEL_OUTLINER_FILTERS_ALL_HIDDEN_TITLE}
          </div>
          <div className={cn("filters-info").elem("filters-description").toClassName()}>
            {panelMessages.SIDE_PANEL_OUTLINER_FILTERS_ALL_HIDDEN_DESCRIPTION}
          </div>
        </div>
      ) : regions?.regions?.length > 0 ? (
        <>
          <OutlinerTree
            regions={regions}
            footer={
              hiddenRegions > 0 && (
                <div className={cn("filters-info").toClassName()}>
                  <IconInfo width={21} height={20} />
                  <div className={cn("filters-info").elem("filters-title").toClassName()}>
                    {(hiddenRegions === 1
                      ? panelMessages.SIDE_PANEL_OUTLINER_FILTERS_HIDDEN_REGIONS_SINGLE
                      : panelMessages.SIDE_PANEL_OUTLINER_FILTERS_HIDDEN_REGIONS_PLURAL
                    ).replace("{count}", String(hiddenRegions))}
                  </div>
                  <div className={cn("filters-info").elem("filters-description").toClassName()}>
                    {panelMessages.SIDE_PANEL_OUTLINER_FILTERS_HIDDEN_REGIONS_DESCRIPTION}
                  </div>
                </div>
              )
            }
          />
        </>
      ) : (
        <OutlinerEmptyState panelMessages={panelMessages} />
      )}
    </>
  );
});

export const OutlinerComponent = observer(OutlinerStandAlone);

export const OutlinerPanel = observer(OutlinerPanelComponent);
