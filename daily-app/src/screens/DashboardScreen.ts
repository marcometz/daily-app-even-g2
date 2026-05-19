import type { Screen } from "../navigation/screen";
import type { InputEvent } from "../input/keyBindings";
import type { DashboardItem, DataService } from "../services/data/DataService";
import { RSS_LIST_ID } from "../services/data/RssAppDataService";
import type { Logger } from "../utils/logger";
import type { Router } from "../navigation/router";
import { clamp } from "../utils/clamp";
import { buildDashboardViewModel } from "../ui/components/DashboardView";
import type { ViewModel } from "../ui/render/renderPipeline";
import { resolveDashboardSelection } from "./dashboard/resolveDashboardSelection";
import { readEventType, readSelectedIndex, readSelectedItemName } from "./shared/readSelectedIndex";

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
      selectedIndex = 0;
      const dashboard = dataService.getDashboard();
      const item = readDashboardItem(dashboard.items, selectedIndex);
      logger.debug(`Dashboard selection reset -> index:${selectedIndex} ${formatDashboardItem(item)}`);
    },
    onExit() {
      logger.info("Exit Dashboard");
    },
    onInput(event: InputEvent) {
      const dashboard = dataService.getDashboard();
      const previousSelectedIndex = selectedIndex;
      const payloadIndex = readSelectedIndex(event);
      const payloadName = readSelectedItemName(event);
      const payloadType = readEventType(event);
      const result = resolveDashboardSelection({
        items: dashboard.items,
        currentSelectedIndex: selectedIndex,
        event,
        logger,
      });
      selectedIndex = result.nextSelectedIndex;
      const previousItem = readDashboardItem(dashboard.items, previousSelectedIndex);
      const nextItem = readDashboardItem(dashboard.items, selectedIndex);
      logger.debug(
        `Dashboard input -> event:${event.type} ` +
          `payload(index:${payloadIndex ?? "-"}, name:${payloadName ?? "-"}, type:${String(payloadType)}) ` +
          `selected(prev:${previousSelectedIndex} ${formatDashboardItem(previousItem)} -> ` +
          `next:${selectedIndex} ${formatDashboardItem(nextItem)})`
      );

      if (event.type === "Up" || event.type === "Down") {
        logger.debug(`Dashboard ${event.type} marked -> index:${selectedIndex} ${formatDashboardItem(nextItem)}`);
      }

      if (event.type === "SelectionChange") {
        logger.debug(`Dashboard hover -> index:${selectedIndex} ${formatDashboardItem(nextItem)}`);
      }

      if (event.type === "Click") {
        if (
          isImplicitSelectionUpdateClick(
            event,
            previousSelectedIndex,
            selectedIndex,
            payloadIndex,
            payloadName
          )
        ) {
          logger.debug(
            `Dashboard click skipped (implicit selection update) -> prev:${previousSelectedIndex} ` +
              `next:${selectedIndex} ${formatDashboardItem(nextItem)}`
          );
          return;
        }
        const targetListId =
          result.targetListId ?? (dashboard.items.length > 0 ? RSS_LIST_ID : null);
        if (targetListId) {
          logger.debug(
            `Dashboard click target -> index:${selectedIndex} ${formatDashboardItem(nextItem)} list:${targetListId}`
          );
          logger.info(`Dashboard click -> list:${targetListId}`);
          router.toList(targetListId);
        }
      }

      if (event.type === "DoubleClick") {
        logger.info("Dashboard double click -> root back");
        router.back();
      }
    },
    getViewModel(): ViewModel {
      const dashboard = dataService.getDashboard();
      return buildDashboardViewModel(
        dashboard,
        clamp(selectedIndex, 0, Math.max(0, dashboard.items.length - 1))
      );
    },
  };
}

function isImplicitSelectionUpdateClick(
  event: InputEvent,
  previousSelectedIndex: number,
  nextSelectedIndex: number,
  payloadIndex: number | null,
  payloadName: string | null
): boolean {
  if (event.type !== "Click") {
    return false;
  }

  const rawType = readEventType(event);
  if (rawType !== undefined) {
    return false;
  }

  // If host provides explicit selection payload, treat as an intentional click target.
  if (payloadIndex !== null || payloadName !== null) {
    return false;
  }

  // If the selection did not move, this is a click on the currently highlighted row.
  if (previousSelectedIndex === nextSelectedIndex) {
    return false;
  }

  // Without explicit type + payload and with a selection jump, treat as implicit selection update.
  return previousSelectedIndex !== nextSelectedIndex;
}

function readDashboardItem(items: DashboardItem[], selectedIndex: number): DashboardItem | null {
  if (items.length === 0) {
    return null;
  }

  const bounded = clamp(selectedIndex, 0, Math.max(0, items.length - 1));
  return items[bounded] ?? null;
}

function formatDashboardItem(item: DashboardItem | null): string {
  if (!item) {
    return "item:-";
  }

  return `item:${item.id}|${item.label}|list:${item.listId}`;
}
