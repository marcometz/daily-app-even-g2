import type { EvenHubEvent, OsEventTypeList } from "@evenrealities/even_hub_sdk";
import type { InputEvent } from "./keyBindings";

const typeMap: Record<number, InputEvent["type"]> = {
  0: "Click",
  1: "Up",
  2: "Down",
  3: "DoubleClick",
};

export function mapEvenHubEvent(
  event: EvenHubEvent,
  osEnum: typeof OsEventTypeList
): InputEvent | null {
  const listType = event.listEvent?.eventType;
  const textType = event.textEvent?.eventType;
  const sysType = event.sysEvent?.eventType;
  const jsonType = readEventTypeFromJsonData(event);
  const rawType = listType ?? textType ?? sysType ?? jsonType;

  if (rawType === undefined) {
    // Some host builds emit list/text events without eventType. Treat as Click fallback.
    if (event.listEvent || event.textEvent) {
      return { type: "Click", raw: event };
    }
    return null;
  }

  const normalized = osEnum.fromJson(rawType);
  if (normalized === undefined) {
    return null;
  }

  const mapped = typeMap[normalized];
  if (!mapped) {
    return null;
  }

  return { type: mapped, raw: event };
}

function readEventTypeFromJsonData(event: EvenHubEvent): unknown {
  const data = event.jsonData;
  if (!data || typeof data !== "object") {
    return undefined;
  }

  const record = data as Record<string, unknown>;
  return record.eventType ?? record.event_type ?? record.Event_Type;
}
