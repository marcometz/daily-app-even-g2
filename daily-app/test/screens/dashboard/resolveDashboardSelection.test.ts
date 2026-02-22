import { describe, expect, it, vi } from "vitest";
import { createDashboardScreen } from "../../../src/screens/DashboardScreen";
import type { InputEvent } from "../../../src/input/keyBindings";
import type {
  DashboardItem,
  DashboardData,
  DataService,
  DetailData,
  ListData,
} from "../../../src/services/data/DataService";
import {
  RSS_LIST_ID,
  SHOPPING_LIST_ID,
} from "../../../src/services/data/RssAppDataService";
import {
  clickByItemNameFirst,
  clickByItemNameSecond,
  clickByJsonDataZeroBasedSecond,
  clickByLabelRss,
  clickByLabelShopping,
  clickByOneBasedIndexSecond,
  clickByZeroBasedIndexFirst,
  clickByZeroBasedIndexSecond,
  clickWithUnknownPayload,
  downEvent,
  upEvent,
} from "./__fixtures__/dashboardInputEvents";
import { resolveDashboardSelection } from "../../../src/screens/dashboard/resolveDashboardSelection";

const dashboardItems: DashboardItem[] = [
  { id: "dashboard-rss", label: "RSS-Feeds", listId: RSS_LIST_ID },
  { id: "dashboard-shopping-list", label: "Shopping List", listId: SHOPPING_LIST_ID },
];

describe("resolveDashboardSelection", () => {
  it("routes RSS by selected name", () => {
    const result = runResolver(clickByLabelRss, 0);
    expect(result.targetListId).toBe(RSS_LIST_ID);
  });

  it("routes Shopping List by selected name", () => {
    const result = runResolver(clickByLabelShopping, 0);
    expect(result.targetListId).toBe(SHOPPING_LIST_ID);
  });

  it("maps item1/item2 naming to first/second entry", () => {
    expect(runResolver(clickByItemNameFirst, 1).targetListId).toBe(RSS_LIST_ID);
    expect(runResolver(clickByItemNameSecond, 0).targetListId).toBe(SHOPPING_LIST_ID);
  });

  it("maps click indexes from listEvent/jsonData", () => {
    expect(runResolver(clickByZeroBasedIndexFirst, 1).targetListId).toBe(RSS_LIST_ID);
    expect(runResolver(clickByZeroBasedIndexSecond, 0).targetListId).toBe(SHOPPING_LIST_ID);
    expect(runResolver(clickByJsonDataZeroBasedSecond, 0).targetListId).toBe(SHOPPING_LIST_ID);
  });

  it("supports 1-based click index variants", () => {
    const result = runResolver(clickByOneBasedIndexSecond, 0);
    expect(result.targetListId).toBe(SHOPPING_LIST_ID);
  });

  it("clamps up/down navigation", () => {
    expect(runResolver(upEvent, 0).nextSelectedIndex).toBe(0);
    expect(runResolver(downEvent, 1).nextSelectedIndex).toBe(1);
  });

  it("returns null target for empty item list", () => {
    const result = resolveDashboardSelection({
      items: [],
      currentSelectedIndex: 0,
      event: clickByLabelRss,
    });
    expect(result).toEqual({ nextSelectedIndex: 0, targetListId: null });
  });

  it("keeps current index when click payload is unknown", () => {
    const result = runResolver(clickWithUnknownPayload, 1);
    expect(result.targetListId).toBe(SHOPPING_LIST_ID);
    expect(result.nextSelectedIndex).toBe(1);
  });
});

describe("DashboardScreen integration", () => {
  it("calls router.toList with shopping when shopping click payload arrives", () => {
    const toList = vi.fn<(listId: string) => void>();
    const router = { toList, toDetail: vi.fn(), back: vi.fn() };
    const screen = createDashboardScreen(router, createDataService(dashboardItems), createLogger());

    screen.onInput(clickByLabelShopping);

    expect(toList).toHaveBeenCalledWith(SHOPPING_LIST_ID);
  });

  it("routes by index payload for shopping without requiring prior up/down", () => {
    const toList = vi.fn<(listId: string) => void>();
    const router = { toList, toDetail: vi.fn(), back: vi.fn() };
    const screen = createDashboardScreen(router, createDataService(dashboardItems), createLogger());

    const clickEvent: InputEvent = clickByZeroBasedIndexSecond;
    screen.onInput(clickEvent);

    expect(toList).toHaveBeenCalledWith(SHOPPING_LIST_ID);
  });
});

function runResolver(event: InputEvent, currentSelectedIndex: number) {
  return resolveDashboardSelection({
    items: dashboardItems,
    currentSelectedIndex,
    event,
  });
}

function createDataService(items: DashboardItem[]): DataService {
  const dashboard: DashboardData = {
    title: "Dashboard",
    items,
  };

  return {
    getDashboard(): DashboardData {
      return dashboard;
    },
    async refreshList(): Promise<void> {},
    getList(): ListData {
      return {
        id: "unused",
        title: "unused",
        items: [],
      };
    },
    async toggleShoppingItem(): Promise<void> {},
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
}

function createLogger() {
  return {
    info: () => {},
    debug: () => {},
  };
}
