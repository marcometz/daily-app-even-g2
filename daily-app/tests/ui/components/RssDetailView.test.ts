import { describe, expect, it } from "vitest";
import { buildDetailViewModel } from "../../../src/ui/components/RssDetailView";

describe("buildDetailViewModel", () => {
  it("renders detail as body plus pager text containers", () => {
    const viewModel = buildDetailViewModel(
      {
        id: "item-1",
        title: "Titel",
        description: "Beschreibung",
        pages: ["Seite eins", "Seite zwei"],
        source: "RSS",
        pubDateText: "Heute",
      },
      { pageIndex: 1, autoScrollEnabled: true }
    );

    expect(viewModel.layoutMode).toBe("text-pager");
    expect(viewModel.containers).toHaveLength(2);
    expect(viewModel.containers[0]).toMatchObject({
      type: "text",
      content: "Titel\n\nSeite zwei",
      eventCapture: 1,
    });
    expect(viewModel.containers[1]).toMatchObject({
      type: "text",
      content: "2/2 | Auto AN | Quelle: RSS | Heute",
      eventCapture: 0,
    });
  });
});
