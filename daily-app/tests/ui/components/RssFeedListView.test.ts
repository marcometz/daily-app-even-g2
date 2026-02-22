import { describe, expect, it } from "vitest";
import { buildRssFeedListViewModel } from "../../../src/ui/components/RssFeedListView";
import type { ListData } from "../../../src/services/data/DataService";

describe("buildRssFeedListViewModel", () => {
  it("creates list container plus footer page status", () => {
    const list: ListData = {
      id: "rss",
      title: "RSS-Feeds",
      items: [
        { id: "a", label: "Eintrag A" },
        { id: "b", label: "Eintrag B" },
      ],
    };

    const viewModel = buildRssFeedListViewModel(list, 1, "2/3");

    expect(viewModel.layoutMode).toBe("list-footer");
    expect(viewModel.containers).toHaveLength(2);

    const listContainer = viewModel.containers[0];
    const statusContainer = viewModel.containers[1];

    expect(listContainer).toMatchObject({
      type: "list",
      id: "rss-list",
      title: "RSS-Feeds",
      items: ["Eintrag A", "Eintrag B"],
      selectedIndex: 1,
      eventCapture: 1,
    });
    expect(statusContainer).toMatchObject({
      type: "text",
      id: "rss-page-status",
      content: "2/3",
      eventCapture: 0,
    });
  });
});
