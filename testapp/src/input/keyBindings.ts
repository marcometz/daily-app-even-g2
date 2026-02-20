export type InputEventType = "Up" | "Down" | "Click" | "DoubleClick";

export interface InputEvent {
  type: InputEventType;
  raw?: unknown;
}
