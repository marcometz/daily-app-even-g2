export type InputEventType = "Up" | "Down" | "Click" | "DoubleClick" | "SelectionChange" | "SystemExit";

export interface InputEvent {
  type: InputEventType;
  raw?: unknown;
}
