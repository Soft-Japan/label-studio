import { getEnv, isStateTreeNode } from "mobx-state-tree";
import { observer } from "mobx-react";
import { IconViewAll } from "@humansignal/icons";
import { Typography } from "@humansignal/ui";
import { cn } from "../../utils/bem";
import "./ViewAllToggle.scss";
import messages from "../../utils/messages";

interface ViewAllToggleProps {
  isActive: boolean;
  onClick: () => void;
  store?: any;
}

export const ViewAllToggle = observer(({ isActive, onClick, store }: ViewAllToggleProps) => {
  const panelMessages = (isStateTreeNode(store) ? getEnv(store)?.messages : null) ?? messages;
  return (
    <button
      type="button"
      className={cn("view-all-toggle").mod({ selected: isActive }).toClassName()}
      onClick={onClick}
      aria-label={panelMessages.ANNOTATIONS_COMPARE_ALL_ARIA}
      aria-pressed={isActive}
      data-testid="compare-all-toggle"
    >
      <div className={cn("view-all-toggle").elem("mainSection").toClassName()}>
        <div className={cn("view-all-toggle").elem("iconContainer").toClassName()}>
          <IconViewAll />
        </div>
        <div className={cn("view-all-toggle").elem("content").toClassName()}>
          <Typography variant="label" size="small" className={cn("view-all-toggle").elem("label").toClassName()}>
            {panelMessages.ANNOTATIONS_COMPARE_ALL}
          </Typography>
        </div>
      </div>
    </button>
  );
});
