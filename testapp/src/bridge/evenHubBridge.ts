import {
  OsEventTypeList,
  waitForEvenAppBridge,
  type EvenHubEvent,
  type TextContainerUpgrade,
} from "@evenrealities/even_hub_sdk";
import type { InputEvent } from "../input/keyBindings";
import { mapEvenHubEvent } from "../input/evenHubEventMapper";
import type { StartupPayload, RebuildPayload } from "./evenHubTypes";

export class EvenHubBridge {
  private ready = false;
  private created = false;
  private bridge: Awaited<ReturnType<typeof waitForEvenAppBridge>> | null = null;
  private inputHandler: ((event: InputEvent) => void) | null = null;

  async connect(): Promise<void> {
    this.bridge = await waitForEvenAppBridge();
    this.ready = true;

    if (this.bridge.onEvenHubEvent) {
      this.bridge.onEvenHubEvent((event: EvenHubEvent) => {
        const input = mapEvenHubEvent(event, OsEventTypeList);
        if (input && this.inputHandler) {
          this.inputHandler(input);
        }
      });
    }
  }

  onInput(handler: (event: InputEvent) => void): void {
    this.inputHandler = handler;
  }

  async createStartup(payload: StartupPayload): Promise<boolean> {
    if (!this.ready || !this.bridge?.createStartUpPageContainer) {
      return false;
    }
    if (this.created) {
      return true;
    }
    const result = await this.bridge.createStartUpPageContainer(payload);
    this.created = result === 0;
    return this.created;
  }

  async rebuild(payload: RebuildPayload): Promise<boolean> {
    if (!this.ready || !this.bridge?.rebuildPageContainer) {
      return false;
    }
    return this.bridge.rebuildPageContainer(payload);
  }

  async updateText(payload: TextContainerUpgrade): Promise<boolean> {
    if (!this.ready || !this.bridge?.textContainerUpgrade) {
      return false;
    }
    return this.bridge.textContainerUpgrade(payload);
  }
}
