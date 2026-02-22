import { describe, expect, it } from "vitest";
import { mapEvenHubEvent } from "../../src/input/evenHubEventMapper";
import type { EvenHubEventPayload } from "../../src/bridge/evenHubTypes";

const mockOsEventTypeList = {
  CLICK_EVENT: 0,
  SCROLL_TOP_EVENT: 1,
  SCROLL_BOTTOM_EVENT: 2,
  DOUBLE_CLICK_EVENT: 3,
  FOREGROUND_ENTER_EVENT: 4,
  FOREGROUND_EXIT_EVENT: 5,
  ABNORMAL_EXIT_EVENT: 6,
  fromJson(raw: unknown): number | undefined {
    if (typeof raw === "number" && Number.isFinite(raw)) {
      return raw;
    }

    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.length === 0) {
        return undefined;
      }

      const numeric = Number(trimmed);
      if (Number.isFinite(numeric)) {
        return numeric;
      }

      if (trimmed === "CLICK_EVENT") return 0;
      if (trimmed === "SCROLL_TOP_EVENT") return 1;
      if (trimmed === "SCROLL_BOTTOM_EVENT") return 2;
      if (trimmed === "DOUBLE_CLICK_EVENT") return 3;
      if (trimmed === "FOREGROUND_ENTER_EVENT") return 4;
      if (trimmed === "FOREGROUND_EXIT_EVENT") return 5;
      if (trimmed === "ABNORMAL_EXIT_EVENT") return 6;
    }

    return undefined;
  },
};

describe("mapEvenHubEvent", () => {
  it("maps known click event type to Click", () => {
    const event = {
      listEvent: { eventType: mockOsEventTypeList.CLICK_EVENT },
    } as EvenHubEventPayload;

    const mapped = mapEvenHubEvent(event, mockOsEventTypeList);

    expect(mapped).toEqual({ type: "Click", raw: event });
  });

  it("maps numeric string event type to Click", () => {
    const event = {
      sysEvent: { eventType: "0" },
    } as unknown as EvenHubEventPayload;

    const mapped = mapEvenHubEvent(event, mockOsEventTypeList);

    expect(mapped).toEqual({ type: "Click", raw: event });
  });

  it("maps sys event click type from toJson payload to Click", () => {
    const event = {
      sysEvent: {
        toJson: () => ({
          Event_Type: 0,
        }),
      },
    } as unknown as EvenHubEventPayload;

    const mapped = mapEvenHubEvent(event, mockOsEventTypeList);

    expect(mapped).toEqual({ type: "Click", raw: event });
  });

  it("maps unknown list event type with selection payload to SelectionChange", () => {
    const event = {
      listEvent: { eventType: "ITEM_HOVER_EVENT", currentSelectItemName: "Shopping List" },
    } as unknown as EvenHubEventPayload;

    const mapped = mapEvenHubEvent(event, mockOsEventTypeList);

    expect(mapped).toEqual({ type: "SelectionChange", raw: event });
  });

  it("maps known but unsupported event type with selection payload to SelectionChange", () => {
    const event = {
      listEvent: {
        eventType: mockOsEventTypeList.FOREGROUND_ENTER_EVENT,
        currentSelectItemIndex: 1,
      },
    } as unknown as EvenHubEventPayload;

    const mapped = mapEvenHubEvent(event, mockOsEventTypeList);

    expect(mapped).toEqual({ type: "SelectionChange", raw: event });
  });

  it("prefers a supported sys event type when list event type is unknown", () => {
    const event = {
      listEvent: { eventType: "ITEM_HOVER_EVENT" },
      sysEvent: { eventType: mockOsEventTypeList.SCROLL_BOTTOM_EVENT },
    } as unknown as EvenHubEventPayload;

    const mapped = mapEvenHubEvent(event, mockOsEventTypeList);

    expect(mapped).toEqual({ type: "Down", raw: event });
  });

  it("maps list event without eventType to Click for legacy compatibility", () => {
    const event = {
      listEvent: { currentSelectItemName: "Shopping List" },
    } as unknown as EvenHubEventPayload;

    const mapped = mapEvenHubEvent(event, mockOsEventTypeList);

    expect(mapped).toEqual({ type: "Click", raw: event });
  });

  it("detects selection payload in proto-style keys", () => {
    const event = {
      listEvent: { Event_Type: "ITEM_HOVER_EVENT", CurrentSelect_ItemIndex: "2" },
    } as unknown as EvenHubEventPayload;

    const mapped = mapEvenHubEvent(event, mockOsEventTypeList);

    expect(mapped).toEqual({ type: "SelectionChange", raw: event });
  });

  it("detects selection payload from listEvent.toJson proto keys", () => {
    const event = {
      listEvent: {
        toJson: () => ({
          Event_Type: "ITEM_HOVER_EVENT",
          CurrentSelect_ItemName: "Shopping List",
        }),
      },
    } as unknown as EvenHubEventPayload;

    const mapped = mapEvenHubEvent(event, mockOsEventTypeList);

    expect(mapped).toEqual({ type: "SelectionChange", raw: event });
  });

  it("ignores unknown list event type without selection payload", () => {
    const event = {
      listEvent: { eventType: "ITEM_HOVER_EVENT" },
    } as unknown as EvenHubEventPayload;

    const mapped = mapEvenHubEvent(event, mockOsEventTypeList);

    expect(mapped).toBeNull();
  });
});
