import type { Screen } from "../navigation/screen";
import type { InputEvent } from "../input/keyBindings";
import type { DataService } from "../services/data/DataService";
import type { Logger } from "../utils/logger";
import type { Router } from "../navigation/router";
import { buildDashboardViewModel } from "../ui/components/TextBlock";
import type { ViewModel } from "../ui/render/renderPipeline";

export function createDashboardScreen(
  router: Router,
  dataService: DataService,
  logger: Logger
): Screen {
  const id = "dashboard";

  return {
    id,
    onEnter() {
      logger.info("Enter Dashboard");
    },
    onExit() {
      logger.info("Exit Dashboard");
    },
    onInput(event: InputEvent) {
      if (event.type === "Click") {
        router.toList("default");
      }
    },
    getViewModel(): ViewModel {
      const data = dataService.getDashboard();
      return buildDashboardViewModel(data);
    },
  };
}
