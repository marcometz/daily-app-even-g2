import type { ScreenStack } from "../navigation/stack";
import type { InputEvent } from "./keyBindings";
import type { Logger } from "../utils/logger";

export function createInputDispatcher(stack: ScreenStack, logger: Logger) {
  return (event: InputEvent) => {
    logger.debug(`Input: ${event.type}`);
    const screen = stack.current();
    if (screen) {
      logger.debug(`Input target screen: ${screen.id}`);
      try {
        screen.onInput(event);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.info(`Input handler failed on ${screen.id}: ${message}`);
      }

      stack.render();
    } else {
      logger.info("Input dropped: no active screen");
    }
  };
}
