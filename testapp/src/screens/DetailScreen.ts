import type { Screen } from "../navigation/screen";
import type { InputEvent } from "../input/keyBindings";
import type { DataService } from "../services/data/DataService";
import type { Logger } from "../utils/logger";
import type { Router } from "../navigation/router";
import { buildDetailViewModel } from "../ui/components/TextBlock";
import type { ViewModel } from "../ui/render/renderPipeline";

export function createDetailScreen(
  itemId: string,
  dataService: DataService,
  logger: Logger,
  router: Router
): Screen {
  return {
    id: `detail:${itemId}`,
    onEnter() {
      logger.info(`Enter Detail ${itemId}`);
    },
    onExit() {
      logger.info(`Exit Detail ${itemId}`);
    },
    onInput(event: InputEvent) {
      if (event.type === "Click") {
        router.toActions(itemId);
      }
      if (event.type === "DoubleClick") {
        router.back();
      }
    },
    getViewModel(): ViewModel {
      const detail = dataService.getDetail(itemId);
      return buildDetailViewModel(detail);
    },
  };
}
