import type { Screen } from "../navigation/screen";
import type { InputEvent } from "../input/keyBindings";
import type { DataService } from "../services/data/DataService";
import type { Logger } from "../utils/logger";
import type { Router } from "../navigation/router";
import { clamp } from "../utils/clamp";
import { buildListViewModel } from "../ui/components/ListView";
import type { ViewModel } from "../ui/render/renderPipeline";

export function createListScreen(
  listId: string,
  dataService: DataService,
  logger: Logger,
  router: Router
): Screen {
  let selectedIndex = 0;

  return {
    id: `list:${listId}`,
    onEnter() {
      logger.info(`Enter List ${listId}`);
    },
    onExit() {
      logger.info(`Exit List ${listId}`);
    },
    onInput(event: InputEvent) {
      const list = dataService.getList(listId);

      if (event.type === "Up") {
        selectedIndex = clamp(selectedIndex - 1, 0, list.items.length - 1);
      }

      if (event.type === "Down") {
        selectedIndex = clamp(selectedIndex + 1, 0, list.items.length - 1);
      }

      if (event.type === "Click") {
        const item = list.items[selectedIndex];
        if (item) {
          router.toDetail(item.id);
        }
      }

      if (event.type === "DoubleClick") {
        router.back();
      }
    },
    getViewModel(): ViewModel {
      const list = dataService.getList(listId);
      return buildListViewModel(list, selectedIndex);
    },
  };
}
