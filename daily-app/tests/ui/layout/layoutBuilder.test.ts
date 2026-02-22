import { describe, expect, it } from "vitest";
import { buildLayout } from "../../../src/ui/layout/layoutBuilder";
import type { ViewModel } from "../../../src/ui/render/renderPipeline";

describe("buildLayout", () => {
  it("renders dashboard in two columns with list on the left and info box on the right", () => {
    const viewModel: ViewModel = {
      title: "Dashboard",
      layoutMode: "two-column",
      containers: [
        {
          type: "list",
          id: "dashboard-list",
          title: "Dashboard",
          items: ["RSS-Feeds", "Shopping List"],
          selectedIndex: 0,
          eventCapture: 1,
        },
        {
          type: "text",
          id: "dashboard-info",
          content: "Info",
          eventCapture: 0,
        },
      ],
    };

    const layout = buildLayout(viewModel);
    const list = layout.listObject?.[0];
    const text = layout.textObject?.[0];

    expect(layout.containerTotalNum).toBe(2);
    expect(list).toMatchObject({
      xPosition: 0,
      yPosition: 0,
      width: 280,
      height: 288,
      isEventCapture: 1,
    });
    expect(text).toMatchObject({
      xPosition: 288,
      yPosition: 0,
      width: 288,
      height: 288,
      borderWidth: 1,
      borderRdaius: 4,
      paddingLength: 6,
      isEventCapture: 0,
    });
    expect(list?.itemContainer?.itemWidth).toBe(269);
  });

  it("keeps stacked split layout when no two-column mode is requested", () => {
    const viewModel: ViewModel = {
      title: "Any",
      containers: [
        {
          type: "text",
          id: "text-1",
          content: "Top",
          eventCapture: 0,
        },
        {
          type: "list",
          id: "list-1",
          title: "List",
          items: ["A"],
          selectedIndex: 0,
          eventCapture: 1,
        },
      ],
    };

    const layout = buildLayout(viewModel);
    const list = layout.listObject?.[0];
    const text = layout.textObject?.[0];

    expect(layout.containerTotalNum).toBe(2);
    expect(text).toMatchObject({ xPosition: 0, yPosition: 0, width: 576, height: 96 });
    expect(list).toMatchObject({ xPosition: 0, yPosition: 96, width: 576, height: 192 });
  });

  it("renders list-footer mode with full list and page status at bottom-right", () => {
    const viewModel: ViewModel = {
      title: "RSS",
      layoutMode: "list-footer",
      containers: [
        {
          type: "list",
          id: "rss-list",
          title: "RSS",
          items: ["Eintrag 1", "Eintrag 2"],
          selectedIndex: 0,
          eventCapture: 1,
        },
        {
          type: "text",
          id: "rss-page-status",
          content: "1/2",
          eventCapture: 0,
        },
      ],
    };

    const layout = buildLayout(viewModel);
    const list = layout.listObject?.[0];
    const text = layout.textObject?.[0];

    expect(layout.containerTotalNum).toBe(2);
    expect(list).toMatchObject({
      xPosition: 0,
      yPosition: 0,
      width: 576,
      height: 288,
      isEventCapture: 1,
    });
    expect(text).toMatchObject({
      xPosition: 488,
      yPosition: 264,
      width: 88,
      height: 24,
      isEventCapture: 0,
      content: "1/2",
    });
  });

  it("assigns event capture to the first eligible container only", () => {
    const viewModel: ViewModel = {
      title: "Dashboard",
      layoutMode: "two-column",
      containers: [
        {
          type: "text",
          id: "dashboard-info",
          content: "Info",
          eventCapture: 1,
        },
        {
          type: "list",
          id: "dashboard-list",
          title: "Dashboard",
          items: ["RSS-Feeds"],
          selectedIndex: 0,
          eventCapture: 1,
        },
      ],
    };

    const layout = buildLayout(viewModel);
    const text = layout.textObject?.[0];
    const list = layout.listObject?.[0];

    expect(text?.isEventCapture).toBe(1);
    expect(list?.isEventCapture).toBe(0);
  });

  it("uses a placeholder item when list is empty to satisfy sdk minimum itemCount", () => {
    const viewModel: ViewModel = {
      title: "Empty",
      containers: [
        {
          type: "list",
          id: "list-empty",
          title: "Empty",
          items: [],
          selectedIndex: 0,
          eventCapture: 1,
        },
      ],
    };

    const layout = buildLayout(viewModel);
    const list = layout.listObject?.[0];

    expect(list?.itemContainer?.itemCount).toBe(1);
    expect(list?.itemContainer?.itemName).toEqual(["Keine Eintraege verfuegbar."]);
  });

  it("caps list entries at 20 items", () => {
    const items = Array.from({ length: 25 }, (_, index) => `Item ${index + 1}`);
    const viewModel: ViewModel = {
      title: "Capped",
      containers: [
        {
          type: "list",
          id: "list-capped",
          title: "Capped",
          items,
          selectedIndex: 0,
          eventCapture: 1,
        },
      ],
    };

    const layout = buildLayout(viewModel);
    const names = layout.listObject?.[0]?.itemContainer?.itemName ?? [];

    expect(names).toHaveLength(20);
    expect(names.at(-1)).toBe("Item 20");
  });

  it("truncates long list labels to sdk max length", () => {
    const longLabel = "A".repeat(100);
    const viewModel: ViewModel = {
      title: "Long label",
      containers: [
        {
          type: "list",
          id: "list-long",
          title: "Long label",
          items: [longLabel],
          selectedIndex: 0,
          eventCapture: 1,
        },
      ],
    };

    const layout = buildLayout(viewModel);
    const label = layout.listObject?.[0]?.itemContainer?.itemName?.[0];

    expect(label).toBeDefined();
    expect(label?.length).toBe(64);
    expect(label?.endsWith("...")).toBe(true);
  });
});
