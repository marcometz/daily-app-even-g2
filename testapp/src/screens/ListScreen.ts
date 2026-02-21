import type { Screen } from "../navigation/screen";
import type { InputEvent } from "../input/keyBindings";
import type { DataService, ListData, ListItem } from "../services/data/DataService";
import type { Logger } from "../utils/logger";
import type { Router } from "../navigation/router";
import { clamp } from "../utils/clamp";
import { buildListViewModel } from "../ui/components/ListView";
import type { ViewModel } from "../ui/render/renderPipeline";

const STATUS_ITEM_ID = "__status__";

export function createListScreen(
  listId: string,
  dataService: DataService,
  logger: Logger,
  router: Router,
  requestRender: () => void
): Screen {
  let selectedIndex = 0;
  let isLoading = false;
  let loadError: string | null = null;
  let refreshSequence = 0;

  async function refresh(): Promise<void> {
    const sequence = refreshSequence + 1;
    refreshSequence = sequence;

    isLoading = true;
    loadError = null;
    requestRender();

    try {
      await dataService.refreshList(listId);
      if (sequence !== refreshSequence) {
        return;
      }

      const list = dataService.getList(listId);
      selectedIndex = clamp(selectedIndex, 0, Math.max(0, list.items.length - 1));
    } catch (error) {
      if (sequence !== refreshSequence) {
        return;
      }
      loadError = error instanceof Error ? error.message : "Unbekannter RSS-Fehler";
    } finally {
      if (sequence !== refreshSequence) {
        return;
      }
      isLoading = false;
      requestRender();
    }
  }

  return {
    id: `list:${listId}`,
    onEnter() {
      logger.info(`Enter List ${listId}`);
      void refresh();
    },
    onExit() {
      refreshSequence += 1;
      logger.info(`Exit List ${listId}`);
    },
    onInput(event: InputEvent) {
      const list = dataService.getList(listId);
      const hasItems = list.items.length > 0;
      const maxIndex = Math.max(0, list.items.length - 1);
      const eventIndex = readSelectedIndex(event);

      if (eventIndex !== null && hasItems) {
        selectedIndex = clamp(eventIndex, 0, maxIndex);
      }

      if (event.type === "Up" && hasItems) {
        selectedIndex = clamp(selectedIndex - 1, 0, maxIndex);
      }

      if (event.type === "Down" && hasItems) {
        selectedIndex = clamp(selectedIndex + 1, 0, maxIndex);
      }

      if (event.type === "Click" && hasItems) {
        const item = list.items[selectedIndex];
        if (item && item.id !== STATUS_ITEM_ID) {
          logger.info(`Open Detail: ${item.id} (index ${selectedIndex})`);
          router.toDetail(item.id);
        }
      }

      if (event.type === "DoubleClick") {
        router.back();
      }
    },
    getViewModel(): ViewModel {
      const list = dataService.getList(listId);
      const visible = withStatusState(list, isLoading, loadError);
      const maxIndex = Math.max(0, visible.items.length - 1);
      const boundedIndex = clamp(selectedIndex, 0, maxIndex);

      return buildListViewModel(visible, boundedIndex);
    },
  };
}

function readSelectedIndex(event: InputEvent): number | null {
  const raw = event.raw;
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  const listEvent = record.listEvent;
  if (listEvent && typeof listEvent === "object") {
    const listRecord = listEvent as Record<string, unknown>;
    const index = listRecord.currentSelectItemIndex;
    if (typeof index === "number" && Number.isFinite(index)) {
      return index;
    }
  }

  const jsonData = record.jsonData;
  if (jsonData && typeof jsonData === "object") {
    const jsonRecord = jsonData as Record<string, unknown>;
    const index = jsonRecord.currentSelectItemIndex;
    if (typeof index === "number" && Number.isFinite(index)) {
      return index;
    }
  }

  return null;
}

function withStatusState(list: ListData, isLoading: boolean, loadError: string | null): ListData {
  if (list.items.length > 0) {
    if (isLoading) {
      return { ...list, title: `${list.title} (laedt...)` };
    }

    if (loadError) {
      return { ...list, title: `${list.title} (letzter Stand)` };
    }

    return list;
  }

  const message = isLoading
    ? "RSS-Feeds werden geladen..."
    : loadError
      ? `Fehler: ${loadError}`
      : "Keine RSS-Eintraege gefunden.";

  const stateItem: ListItem = {
    id: STATUS_ITEM_ID,
    label: message,
  };

  return {
    ...list,
    items: [stateItem],
  };
}
