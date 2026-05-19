import { describe, expect, it } from "vitest";
import { buildDetailViewModel } from "../../../src/ui/components/RssDetailView";

describe("buildDetailViewModel", () => {
  it("renders detail with a separate title, body, and pager text container", () => {
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
    expect(viewModel.containers).toHaveLength(3);
    expect(viewModel.containers[0]).toMatchObject({
      type: "text",
      id: "title",
      content: "Titel",
      eventCapture: 0,
    });
    expect(viewModel.containers[1]).toMatchObject({
      type: "text",
      id: "body",
      content: "Seite zwei",
      eventCapture: 1,
    });
    expect(viewModel.containers[2]).toMatchObject({
      type: "text",
      id: "pager",
      content: "2/2 | Auto AN | Quelle: RSS | Heute",
      eventCapture: 0,
    });
  });

  it("keeps a long RSS title inside its own bounded container content", () => {
    const viewModel = buildDetailViewModel(
      {
        id: "item-1",
        title: "A".repeat(220),
        description: "Beschreibung",
        pages: ["Seite eins"],
        source: "RSS",
      },
      { pageIndex: 0, autoScrollEnabled: false }
    );

    expect(viewModel.containers[0]).toMatchObject({
      type: "text",
      id: "title",
      eventCapture: 0,
    });
    expect(viewModel.containers[0].content).toHaveLength(180);
    expect(viewModel.containers[0].content).toContain("[gekuerzt]");
    expect(viewModel.containers[1]).toMatchObject({
      type: "text",
      id: "body",
      content: "Seite eins",
      eventCapture: 1,
    });
  });
});
