import type { Screen } from "./screen";
import type { ScreenStack } from "./stack";
import type { DataService } from "../services/data/DataService";
import { createListScreen } from "../screens/ListScreen";
import { createDetailScreen } from "../screens/DetailScreen";
import { createActionsOverlay } from "../screens/ActionsOverlay";
import type { Logger } from "../utils/logger";

export interface Router {
  toList(listId: string): void;
  toDetail(itemId: string): void;
  toActions(ownerId: string): void;
  back(): void;
}

export function createRouter(
  stack: ScreenStack,
  dataService: DataService,
  logger: Logger
): Router {
  const router: Router = {
    toList(listId: string) {
      const screen = createListScreen(listId, dataService, logger, router);
      stack.push(screen);
    },
    toDetail(itemId: string) {
      const screen = createDetailScreen(itemId, dataService, logger, router);
      stack.push(screen);
    },
    toActions(ownerId: string) {
      const overlay = createActionsOverlay(ownerId, dataService, logger, router);
      stack.push(overlay);
    },
    back() {
      stack.pop();
    },
  };

  return router;
}
