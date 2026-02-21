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
  private startupInFlight: Promise<boolean> | null = null;
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
    if (this.startupInFlight) {
      return this.startupInFlight;
    }

    this.startupInFlight = (async () => {
      const rawResult = await this.bridge!.createStartUpPageContainer(payload);
      const startupOk =
        rawResult === 0 ||
        rawResult === true ||
        rawResult === "0" ||
        rawResult === "success" ||
        rawResult === "APP_REQUEST_CREATE_PAGE_SUCCESS";

      // Never downgrade once startup has succeeded.
      if (startupOk) {
        this.created = true;
      }

      return this.created;
    })();

    try {
      return await this.startupInFlight;
    } finally {
      this.startupInFlight = null;
    }
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
