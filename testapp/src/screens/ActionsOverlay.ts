import type { Screen } from "../navigation/screen";
import type { InputEvent } from "../input/keyBindings";
import type { DataService } from "../services/data/DataService";
import type { Logger } from "../utils/logger";
import type { Router } from "../navigation/router";
import { clamp } from "../utils/clamp";
import { buildActionsOverlayViewModel } from "../ui/components/ListView";
import type { ViewModel } from "../ui/render/renderPipeline";

export function createActionsOverlay(
  ownerId: string,
  dataService: DataService,
  logger: Logger,
  router: Router
): Screen {
  let selectedIndex = 0;

  return {
    id: `actions:${ownerId}`,
    onEnter() {
      logger.info(`Enter Actions ${ownerId}`);
    },
    onExit() {
      logger.info(`Exit Actions ${ownerId}`);
    },
    onInput(event: InputEvent) {
      const actions = dataService.getActions(ownerId);

      if (event.type === "Up") {
        selectedIndex = clamp(selectedIndex - 1, 0, actions.items.length - 1);
      }

      if (event.type === "Down") {
        selectedIndex = clamp(selectedIndex + 1, 0, actions.items.length - 1);
      }

      if (event.type === "Click") {
        const action = actions.items[selectedIndex];
        if (action) {
          logger.info(`Action: ${action.label}`);
          router.back();
        }
      }

      if (event.type === "DoubleClick") {
        router.back();
      }
    },
    getViewModel(): ViewModel {
      const actions = dataService.getActions(ownerId);
      const detail = dataService.getDetail(ownerId);
      return buildActionsOverlayViewModel(actions, detail, selectedIndex);
    },
  };
}
