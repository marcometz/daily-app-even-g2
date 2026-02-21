import type { ScreenStack } from "./stack";
import type { DataService } from "../services/data/DataService";
import { createListScreen } from "../screens/ListScreen";
import { createDetailScreen } from "../screens/DetailScreen";
import type { Logger } from "../utils/logger";

export interface Router {
  toList(listId: string): void;
  toDetail(itemId: string): void;
  back(): void;
}

export function createRouter(stack: ScreenStack, dataService: DataService, logger: Logger): Router {
  const requestRender = () => stack.render();

  const router: Router = {
    toList(listId: string) {
      const screen = createListScreen(listId, dataService, logger, router, requestRender);
      stack.push(screen);
    },
    toDetail(itemId: string) {
      const screen = createDetailScreen(itemId, dataService, logger, router, requestRender);
      stack.push(screen);
    },
    back() {
      stack.pop();
    },
  };

  return router;
}
