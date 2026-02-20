import type { ScreenStack } from "../navigation/stack";
import type { InputEvent } from "./keyBindings";
import type { Logger } from "../utils/logger";

export function createInputDispatcher(stack: ScreenStack, logger: Logger) {
  return (event: InputEvent) => {
    logger.debug(`Input: ${event.type}`);
    const screen = stack.current();
    if (screen) {
      screen.onInput(event);
      stack.render();
    }
  };
}
