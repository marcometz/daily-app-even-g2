import type { Screen } from "../navigation/screen";
import type { InputEvent } from "../input/keyBindings";
import type { DataService, ListData } from "../services/data/DataService";
import type { Logger } from "../utils/logger";
import type { Router } from "../navigation/router";
import { clamp } from "../utils/clamp";
import { buildListViewModel } from "../ui/components/ListView";
import type { ViewModel } from "../ui/render/renderPipeline";

export function createDashboardScreen(
  router: Router,
  dataService: DataService,
  logger: Logger
): Screen {
  const id = "dashboard";
  let selectedIndex = 0;

  return {
    id,
    onEnter() {
      logger.info("Enter Dashboard");
    },
    onExit() {
      logger.info("Exit Dashboard");
    },
    onInput(event: InputEvent) {
      const dashboard = dataService.getDashboard();
      const maxIndex = Math.max(0, dashboard.items.length - 1);

      if (event.type === "Up" && dashboard.items.length > 0) {
        selectedIndex = clamp(selectedIndex - 1, 0, maxIndex);
      }

      if (event.type === "Down" && dashboard.items.length > 0) {
        selectedIndex = clamp(selectedIndex + 1, 0, maxIndex);
      }

      if (event.type === "Click") {
        const selected = dashboard.items[selectedIndex];
        const targetListId = selected?.listId ?? "rss";
        logger.info(`Dashboard click -> list:${targetListId}`);
        router.toList(targetListId);
      }
    },
    getViewModel(): ViewModel {
      const dashboard = dataService.getDashboard();
      const list: ListData = {
        id,
        title: dashboard.title,
        items: dashboard.items.map((item) => ({ id: item.id, label: item.label })),
      };

      return buildListViewModel(list, clamp(selectedIndex, 0, Math.max(0, list.items.length - 1)));
    },
  };
}
