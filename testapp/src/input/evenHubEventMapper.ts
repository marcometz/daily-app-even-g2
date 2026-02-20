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
  const rawType = listType ?? textType ?? sysType;

  if (rawType === undefined) {
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
