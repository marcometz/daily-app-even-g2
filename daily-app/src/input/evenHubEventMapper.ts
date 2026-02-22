import type { InputEvent } from "./keyBindings";
import type { EvenHubEventPayload, OsEventTypeResolver } from "../bridge/evenHubTypes";

const typeMap: Record<number, InputEvent["type"]> = {
  0: "Click",
  1: "Up",
  2: "Down",
  3: "DoubleClick",
};

export function mapEvenHubEvent(
  event: EvenHubEventPayload,
  osEnum: OsEventTypeResolver
): InputEvent | null {
  const listType = readEventTypeFromEventPart(event.listEvent);
  const textType = readEventTypeFromEventPart(event.textEvent);
  const sysType = readEventTypeFromEventPart(event.sysEvent);
  const jsonType = readEventTypeFromJsonData(event);
  const mappedType = mapKnownEventType([listType, textType, sysType, jsonType], osEnum);
  if (mappedType) {
    return { type: mappedType, raw: event };
  }

  if (listType === undefined && textType === undefined && sysType === undefined && jsonType === undefined) {
    // Legacy host behavior: list/text events without explicit type are treated as Click.
    if (event.listEvent || event.textEvent) {
      return { type: "Click", raw: event };
    }
    if (hasListSelectionPayload(event)) {
      return { type: "SelectionChange", raw: event };
    }
    return null;
  }

  if (hasListSelectionPayload(event)) {
    return { type: "SelectionChange", raw: event };
  }
  return null;
}

function readEventTypeFromJsonData(event: EvenHubEventPayload): unknown {
  const record = normalizeRecord(event.jsonData);
  if (!record) {
    return undefined;
  }
  return record.eventType ?? record.event_type ?? record.Event_Type;
}

function readEventTypeFromEventPart(part: unknown): unknown {
  const record = normalizeRecord(part);
  if (!record) {
    return undefined;
  }
  return record.eventType ?? record.event_type ?? record.Event_Type;
}

function mapKnownEventType(
  rawTypes: unknown[],
  osEnum: OsEventTypeResolver
): InputEvent["type"] | null {
  for (const rawType of rawTypes) {
    if (rawType === undefined) {
      continue;
    }
    const normalized = osEnum.fromJson(normalizeEventTypeValue(rawType));
    if (normalized === undefined) {
      continue;
    }

    const mapped = typeMap[normalized];
    if (mapped) {
      return mapped;
    }
  }

  return null;
}

function normalizeEventTypeValue(rawType: unknown): unknown {
  if (typeof rawType === "string") {
    const trimmed = rawType.trim();
    if (trimmed.length > 0) {
      const numeric = Number(trimmed);
      if (Number.isFinite(numeric)) {
        return numeric;
      }
    }
  }

  return rawType;
}

function hasListSelectionPayload(event: EvenHubEventPayload): boolean {
  return (
    hasSelectionPayloadInRecord(event.listEvent) ||
    hasSelectionPayloadInRecord(event.jsonData)
  );
}

function hasSelectionPayloadInRecord(value: unknown): boolean {
  const record = normalizeRecord(value);
  if (!record) {
    return false;
  }

  const name = readStringField(record, [
    "currentSelectItemName",
    "current_select_item_name",
    "CurrentSelect_ItemName",
    "currentSelect_ItemName",
  ]);
  const index = readNumberField(record, [
    "currentSelectItemIndex",
    "current_select_item_index",
    "CurrentSelect_ItemIndex",
    "currentSelect_ItemIndex",
  ]);

  return name !== null || index !== null;
}

function readNumberField(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return null;
}

function readStringField(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return null;
}

function normalizeRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return normalizeRecord(parsed);
    } catch {
      return null;
    }
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const base = value as Record<string, unknown>;
  const toJsonRecord = readToJsonRecord(value);
  if (!toJsonRecord) {
    return base;
  }

  return {
    ...base,
    ...toJsonRecord,
  };
}

function readToJsonRecord(value: unknown): Record<string, unknown> | null {
  const candidate = value as { toJson?: () => unknown };
  if (typeof candidate.toJson !== "function") {
    return null;
  }

  try {
    const json = candidate.toJson();
    return normalizeRecord(json);
  } catch {
    return null;
  }
}
