import { describe, expect, it, vi } from "vitest";
import { createShoppingListScreen } from "../../../src/screens/shopping/ShoppingListScreen";
import type { DataService, DashboardData, DetailData, ListData } from "../../../src/services/data/DataService";
import { SHOPPING_DIVIDER_ITEM_ID, SHOPPING_LIST_ID } from "../../../src/services/data/RssAppDataService";
import type { ViewModel } from "../../../src/ui/render/renderPipeline";

describe("ShoppingListScreen", () => {
  it("toggles selected shopping item on click", async () => {
    const dataService = createDataService({
      id: SHOPPING_LIST_ID,
      title: "Shopping List",
      items: [{ id: "milk", label: "[ ] Milch" }],
    });
    const router = { toList: vi.fn(), toDetail: vi.fn(), back: vi.fn() };
    const logger = createLogger();
    const requestRender = vi.fn();

    const screen = createShoppingListScreen(
      SHOPPING_LIST_ID,
      dataService,
      logger,
      router,
      requestRender
    );
    screen.onEnter();
    await flushAsync();

    screen.onInput({ type: "Click" });
    await flushAsync();

    expect(dataService.toggleShoppingItem).toHaveBeenCalledWith("milk");
  });

  it("clamps selection for up/down navigation", async () => {
    const dataService = createDataService({
      id: SHOPPING_LIST_ID,
      title: "Shopping List",
      items: [
        { id: "milk", label: "[ ] Milch" },
        { id: "bread", label: "[ ] Brot" },
      ],
    });
    const screen = createShoppingListScreen(
      SHOPPING_LIST_ID,
      dataService,
      createLogger(),
      createRouter(),
      vi.fn()
    );
    screen.onEnter();
    await flushAsync();

    screen.onInput({ type: "Up" });
    expect(readSelectedIndex(screen.getViewModel())).toBe(0);

    screen.onInput({ type: "Down" });
    expect(readSelectedIndex(screen.getViewModel())).toBe(1);

    screen.onInput({ type: "Down" });
    expect(readSelectedIndex(screen.getViewModel())).toBe(1);
  });

  it("does not toggle divider or status rows", async () => {
    const dataService = createDataService({
      id: SHOPPING_LIST_ID,
      title: "Shopping List",
      items: [
        { id: "milk", label: "[ ] Milch" },
        { id: SHOPPING_DIVIDER_ITEM_ID, label: "-------- Erledigt --------" },
      ],
    });
    const screen = createShoppingListScreen(
      SHOPPING_LIST_ID,
      dataService,
      createLogger(),
      createRouter(),
      vi.fn()
    );
    screen.onEnter();
    await flushAsync();

    screen.onInput({ type: "Down" });
    screen.onInput({ type: "Click" });
    await flushAsync();

    expect(dataService.toggleShoppingItem).not.toHaveBeenCalled();
  });

  it("routes back on double click", () => {
    const dataService = createDataService({
      id: SHOPPING_LIST_ID,
      title: "Shopping List",
      items: [{ id: "milk", label: "[ ] Milch" }],
    });
    const router = createRouter();
    const screen = createShoppingListScreen(
      SHOPPING_LIST_ID,
      dataService,
      createLogger(),
      router,
      vi.fn()
    );

    screen.onInput({ type: "DoubleClick" });

    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it("keeps selection on toggled item after list reorder", async () => {
    let list: ListData = {
      id: SHOPPING_LIST_ID,
      title: "Shopping List",
      items: [
        { id: "milk", label: "[ ] Milch" },
        { id: "bread", label: "[ ] Brot" },
      ],
    };

    const dataService = createDataService(list);
    dataService.toggleShoppingItem.mockImplementation(async (itemId: string) => {
      if (itemId !== "milk") {
        return;
      }
      list = {
        id: SHOPPING_LIST_ID,
        title: "Shopping List",
        items: [
          { id: "bread", label: "[ ] Brot" },
          { id: SHOPPING_DIVIDER_ITEM_ID, label: "-------- Erledigt --------" },
          { id: "milk", label: "[x] Milch" },
        ],
      };
      dataService.getList.mockImplementation(() => list);
    });

    const screen = createShoppingListScreen(
      SHOPPING_LIST_ID,
      dataService,
      createLogger(),
      createRouter(),
      vi.fn()
    );
    screen.onEnter();
    await flushAsync();

    screen.onInput({ type: "Click" });
    await flushAsync();

    expect(readSelectedIndex(screen.getViewModel())).toBe(2);
  });
});

function createDataService(list: ListData) {
  const getList = vi.fn(() => list);
  const toggleShoppingItem = vi.fn(async (_itemId: string) => {});
  const refreshList = vi.fn(async (_listId: string) => {});

  const dataService: DataService = {
    getDashboard(): DashboardData {
      return { title: "Dashboard", items: [] };
    },
    refreshList,
    getList,
    toggleShoppingItem,
    getDetail(): DetailData {
      return {
        id: "unused",
        title: "unused",
        description: "unused",
        pages: ["unused"],
        source: "unused",
      };
    },
    getAdjacentItemId(): string | null {
      return null;
    },
  };

  return {
    ...dataService,
    getList,
    refreshList,
    toggleShoppingItem,
  };
}

function createRouter() {
  return {
    toList: vi.fn<(listId: string) => void>(),
    toDetail: vi.fn<(itemId: string) => void>(),
    back: vi.fn<() => void>(),
  };
}

function createLogger() {
  return {
    info: vi.fn<(message: string) => void>(),
    debug: vi.fn<(message: string) => void>(),
  };
}

function readSelectedIndex(viewModel: ViewModel): number {
  const listContainer = viewModel.containers[0];
  if (!listContainer || listContainer.type !== "list") {
    throw new Error("Expected list container");
  }
  return listContainer.selectedIndex;
}

async function flushAsync(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
