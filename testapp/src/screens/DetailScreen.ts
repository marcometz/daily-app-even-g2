import type { Screen } from "../navigation/screen";
import type { InputEvent } from "../input/keyBindings";
import type { DataService } from "../services/data/DataService";
import type { Logger } from "../utils/logger";
import type { Router } from "../navigation/router";
import { buildDetailViewModel } from "../ui/components/TextBlock";
import type { ViewModel } from "../ui/render/renderPipeline";

const AUTOSCROLL_INTERVAL_MS = 2500;

export function createDetailScreen(
  itemId: string,
  dataService: DataService,
  logger: Logger,
  router: Router,
  requestRender: () => void
): Screen {
  let currentItemId = itemId;
  let pageIndex = 0;
  let autoScrollEnabled = false;
  let timerId: number | null = null;

  const stopAutoScroll = () => {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
    autoScrollEnabled = false;
  };

  const startAutoScroll = () => {
    const detail = dataService.getDetail(currentItemId);
    if (detail.pages.length <= 1) {
      autoScrollEnabled = false;
      requestRender();
      return;
    }

    stopAutoScroll();
    autoScrollEnabled = true;
    timerId = window.setInterval(() => {
      const latest = dataService.getDetail(currentItemId);
      if (latest.pages.length <= 1) {
        stopAutoScroll();
        requestRender();
        return;
      }

      pageIndex = (pageIndex + 1) % latest.pages.length;
      requestRender();
    }, AUTOSCROLL_INTERVAL_MS);
  };

  const toggleAutoScroll = () => {
    if (autoScrollEnabled) {
      stopAutoScroll();
      requestRender();
      return;
    }

    startAutoScroll();
    requestRender();
  };

  const navigateToAdjacent = (direction: "up" | "down") => {
    const adjacentItemId = dataService.getAdjacentItemId(currentItemId, direction);
    if (!adjacentItemId) {
      router.back();
      return;
    }

    currentItemId = adjacentItemId;
    pageIndex = 0;
    requestRender();
  };

  return {
    id: `detail:${itemId}`,
    onEnter() {
      logger.info(`Enter Detail ${itemId}`);
    },
    onExit() {
      stopAutoScroll();
      logger.info(`Exit Detail ${itemId}`);
    },
    onInput(event: InputEvent) {
      if (event.type === "Click") {
        toggleAutoScroll();
      }

      if (event.type === "Up") {
        navigateToAdjacent("up");
      }

      if (event.type === "Down") {
        navigateToAdjacent("down");
      }

      if (event.type === "DoubleClick") {
        router.back();
      }
    },
    getViewModel(): ViewModel {
      const detail = dataService.getDetail(currentItemId);
      const pageCount = Math.max(1, detail.pages.length);
      if (pageIndex >= pageCount) {
        pageIndex = 0;
      }

      return buildDetailViewModel(detail, { pageIndex, autoScrollEnabled });
    },
  };
}
