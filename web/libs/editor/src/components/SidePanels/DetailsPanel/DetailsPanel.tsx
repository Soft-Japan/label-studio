import { inject, observer } from "mobx-react";
import type { FC } from "react";
import { cn } from "../../../utils/bem";
import { Comments as CommentsComponent } from "../../Comments/Comments";
import { AnnotationHistory } from "../../CurrentEntity/AnnotationHistory";
import { PanelBase, type PanelProps } from "../PanelBase";
import "./DetailsPanel.scss";
import { RegionDetailsMain, RegionDetailsMeta } from "./RegionDetails";
import { RegionItem } from "./RegionItem";
import { Relations as RelationsComponent } from "./Relations";
// eslint-disable-next-line
// @ts-ignore
import { RelationsControls } from "./RelationsControls";
import { EmptyState } from "../Components/EmptyState";
import { IconCursor, IconRelationLink } from "@humansignal/icons";
import { getDocsUrl } from "../../../utils/docs";
import { getEnv } from "mobx-state-tree";
import messages from "../../../utils/messages";

interface DetailsPanelProps extends PanelProps {
  regions: any;
  selection: any;
}

const DetailsPanelComponent: FC<DetailsPanelProps> = ({ currentEntity, regions, ...props }) => {
  const selectedRegions = regions.selection;
  const panelMessages = getEnv(currentEntity)?.messages ?? messages;

  return (
    <PanelBase {...props} currentEntity={currentEntity} name="details" title={panelMessages.SIDE_PANEL_TAB_INFO}>
      <Content selection={selectedRegions} currentEntity={currentEntity} />
    </PanelBase>
  );
};

const DetailsComponent: FC<DetailsPanelProps> = ({ currentEntity, regions }) => {
  const selectedRegions = regions.selection;

  return (
    <div className={cn("details-tab").toClassName()}>
      <Content selection={selectedRegions} currentEntity={currentEntity} />
    </div>
  );
};

const Content: FC<any> = observer(function Content({ selection, currentEntity }: any): JSX.Element {
  return <>{selection.size ? <RegionsPanel regions={selection} /> : <GeneralPanel currentEntity={currentEntity} />}</>;
});

const CommentsTab: FC<any> = inject("store")(
  observer(function CommentsTab({ store }: any): JSX.Element {
    return (
      <>
        {store.hasInterface("annotations:comments") && store.commentStore.isCommentable && (
          <div className={cn("comments-panel").toClassName()}>
            <div className={cn("comments-panel").elem("section-tab").toClassName()}>
              <div className={cn("comments-panel").elem("section-content").toClassName()}>
                <CommentsComponent
                  annotationStore={store.annotationStore}
                  commentStore={store.commentStore}
                  cacheKey={`task.${store.task.id}`}
                />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }),
);

const RelationsTab: FC<any> = inject("store")(
  observer(function RelationsTab({ currentEntity, store }: any): JSX.Element {
    const { relationStore } = currentEntity;
    const hasRelations = relationStore.size > 0;
    const panelMessages = getEnv(store)?.messages ?? messages;
    
    return (
      <>
        <div className={cn("relations").toClassName()}>
          <div className={cn("relations").elem("section-tab").toClassName()}>
            {hasRelations ? (
              <>
                <div className={cn("relations").elem("view-control").toClassName()}>
                  <div className={cn("relations").elem("section-head").toClassName()}>
                    {panelMessages.SIDE_PANEL_SECTION_RELATIONS} ({relationStore.size})
                  </div>
                  <RelationsControls relationStore={relationStore} />
                </div>
                <div className={cn("relations").elem("section-content").toClassName()}>
                  <RelationsComponent relationStore={relationStore} />
                </div>
              </>
            ) : (
              <EmptyState
                icon={<IconRelationLink width={24} height={24} />}
                header={panelMessages.SIDE_PANEL_RELATIONS_EMPTY_HEADER}
                description={<>{panelMessages.SIDE_PANEL_RELATIONS_EMPTY_DESCRIPTION}</>}
                learnMore={{
                  href: getDocsUrl("guide/labeling#Add-relations-between-annotations"),
                  text: panelMessages.SIDE_PANEL_LEARN_MORE,
                  testId: "relations-panel-learn-more",
                }}
              />
            )}
          </div>
        </div>
      </>
    );
  }),
);

const HistoryTab: FC<any> = inject("store")(
  observer(function HistoryTab({ store, currentEntity }: any): JSX.Element {
    const showAnnotationHistory = store.hasInterface("annotations:history");
    const panelMessages = getEnv(store)?.messages ?? messages;
    
    return (
      <>
        <div className={cn("history").toClassName()}>
          <div className={cn("history").elem("section-tab").toClassName()}>
            <AnnotationHistory
              inline
              enabled={showAnnotationHistory}
              sectionHeader={
                <>
                  {panelMessages.SIDE_PANEL_SECTION_ANNOTATION_HISTORY}
                  <span>#{currentEntity.pk ?? currentEntity.id}</span>
                </>
              }
            />
          </div>
        </div>
      </>
    );
  }),
);

const InfoTab: FC<any> = inject("store")(
  observer(function InfoTab({ selection, store }: any): JSX.Element {
    const nothingSelected = !selection || selection.size === 0;
    const panelMessages = getEnv(store)?.messages ?? messages;
    return (
      <>
        <div className={cn("info").toClassName()}>
          <div className={cn("info").elem("section-tab").toClassName()}>
            {nothingSelected ? (
              <EmptyState
                icon={<IconCursor width={24} height={24} />}
                header={panelMessages.SIDE_PANEL_INFO_EMPTY_HEADER}
                description={<>{panelMessages.SIDE_PANEL_INFO_EMPTY_DESCRIPTION}</>}
              />
            ) : (
              <>
                <RegionsPanel regions={selection} />
              </>
            )}
          </div>
        </div>
      </>
    );
  }),
);

/**
 * Custom panel - a placeholder for rendering custom content via React portals.
 * Used by ReactCode tag with sidebar=true to render iframe content in the side panel.
 */
const CustomTab: FC<any> = function CustomTab(): JSX.Element {
  return (
    <div className={cn("custom").toClassName()}>
      <div id="react-code-sidebar-portal" className={cn("custom").elem("section-tab").toClassName()} />
    </div>
  );
};

const GeneralPanel: FC<any> = inject("store")(
  observer(function GeneralPanel({ store, currentEntity }: any): JSX.Element {
    const { relationStore } = currentEntity;
    const showAnnotationHistory = store.hasInterface("annotations:history");
    const panelMessages = getEnv(store)?.messages ?? messages;
    return (
      <>
        <div className={cn("details").elem("section").toClassName()}>
          <AnnotationHistory
            inline
            enabled={showAnnotationHistory}
            sectionHeader={
              <>
                {panelMessages.SIDE_PANEL_SECTION_ANNOTATION_HISTORY}
                <span>#{currentEntity.pk ?? currentEntity.id}</span>
              </>
            }
          />
        </div>
        <div className={cn("details").elem("section").toClassName()}>
          <div className={cn("details").elem("view-control").toClassName()}>
            <div className={cn("details").elem("section-head").toClassName()}>
              {panelMessages.SIDE_PANEL_SECTION_RELATIONS} ({relationStore.size})
            </div>
            <RelationsControls relationStore={relationStore} />
          </div>
          <div className={cn("details").elem("section-content").toClassName()}>
            <RelationsComponent relationStore={relationStore} />
          </div>
        </div>
        {store.hasInterface("annotations:comments") && store.commentStore.isCommentable && (
          <div className={cn("details").elem("section").toClassName()}>
            <div className={cn("details").elem("section-head").toClassName()}>
              {panelMessages.SIDE_PANEL_SECTION_COMMENTS}
            </div>
            <div className={cn("details").elem("section-content").toClassName()}>
              <CommentsComponent
                annotationStore={store.annotationStore}
                commentStore={store.commentStore}
                cacheKey={`task.${store.task.id}`}
              />
            </div>
          </div>
        )}
      </>
    );
  }),
);

GeneralPanel.displayName = "GeneralPanel";

const RegionsPanel: FC<{ regions: any }> = observer(function RegionsPanel({ regions }: { regions: any }): JSX.Element {
  return (
    <div>
      {regions.list.map((reg: any) => {
        return <SelectedRegion key={reg.id} region={reg} />;
      })}
    </div>
  );
});

const SelectedRegion: FC<{ region: any }> = observer(function SelectedRegion({ region }: { region: any }): JSX.Element {
  return <RegionItem region={region} mainDetails={RegionDetailsMain} metaDetails={RegionDetailsMeta} />;
});

export const Comments = CommentsTab;
export const History = HistoryTab;
export const Relations = RelationsTab;
export const Info = InfoTab;
export const Custom = CustomTab;
export const Details = observer(DetailsComponent);
export const DetailsPanel = observer(DetailsPanelComponent);
