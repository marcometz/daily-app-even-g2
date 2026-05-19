import {
  ImageRawDataUpdateResult,
  ImuReportPace,
  OsEventTypeList,
  StartUpPageCreateResult,
  waitForEvenAppBridge,
  type EvenHubEvent,
  type LaunchSource,
} from "@evenrealities/even_hub_sdk";
import type { InputEvent } from "../input/keyBindings";
import { mapEvenHubEvent } from "../input/evenHubEventMapper";
import type {
  ImageUpdatePayload,
  RebuildPayload,
  SdkImageUpdatePayload,
  SdkRebuildPayload,
  SdkStartupPayload,
  SdkTextUpgradePayload,
  StartupPayload,
  TextUpgradePayload,
} from "./evenHubTypes";

export class EvenHubBridge {
  private ready = false;
  private created = false;
  private startupInFlight: Promise<boolean> | null = null;
  private bridge: Awaited<ReturnType<typeof waitForEvenAppBridge>> | null = null;
  private inputHandler: ((event: InputEvent) => void) | null = null;
  private launchSourceHandler: ((source: LaunchSource) => void) | null = null;
  private evenHubUnsubscribe: (() => void) | null = null;
  private launchSourceUnsubscribe: (() => void) | null = null;

  async connect(): Promise<void> {
    if (this.ready && this.bridge) {
      return;
    }

    this.bridge = await waitForEvenAppBridge();
    this.ready = true;

    if (this.bridge.onEvenHubEvent) {
      this.evenHubUnsubscribe = this.bridge.onEvenHubEvent((event: EvenHubEvent) => {
        const input = mapEvenHubEvent(event, OsEventTypeList);
        if (input && this.inputHandler) {
          this.inputHandler(input);
        }
      });
    }

    if (this.bridge.onLaunchSource) {
      this.launchSourceUnsubscribe = this.bridge.onLaunchSource((source: LaunchSource) => {
        this.launchSourceHandler?.(source);
      });
    }
  }

  disconnect(): void {
    this.evenHubUnsubscribe?.();
    this.launchSourceUnsubscribe?.();
    this.evenHubUnsubscribe = null;
    this.launchSourceUnsubscribe = null;
    this.inputHandler = null;
    this.launchSourceHandler = null;
    this.bridge = null;
    this.ready = false;
    this.created = false;
    this.startupInFlight = null;
  }

  onInput(handler: (event: InputEvent) => void): void {
    this.inputHandler = handler;
  }

  onLaunchSource(handler: (source: LaunchSource) => void): void {
    this.launchSourceHandler = handler;
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
      const rawResult = await this.bridge!.createStartUpPageContainer(payload as SdkStartupPayload);
      const startupOk = isStartupSuccess(rawResult);

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
    return this.bridge.rebuildPageContainer(payload as SdkRebuildPayload);
  }

  async updateText(payload: TextUpgradePayload): Promise<boolean> {
    if (!this.ready || !this.bridge?.textContainerUpgrade) {
      return false;
    }
    return this.bridge.textContainerUpgrade(payload as SdkTextUpgradePayload);
  }

  async updateImage(payload: ImageUpdatePayload): Promise<boolean> {
    if (!this.ready || !this.bridge?.updateImageRawData) {
      return false;
    }

    const result = await this.bridge.updateImageRawData(payload as SdkImageUpdatePayload);
    return isImageUpdateSuccess(result);
  }

  async audioControl(isOpen: boolean): Promise<boolean> {
    if (!this.ready || !this.bridge?.audioControl) {
      return false;
    }

    return this.bridge.audioControl(isOpen);
  }

  async imuControl(isOpen: boolean, reportFrq: ImuReportPace = ImuReportPace.P100): Promise<boolean> {
    if (!this.ready || !this.bridge?.imuControl) {
      return false;
    }

    return this.bridge.imuControl(isOpen, reportFrq);
  }
}

function isStartupSuccess(rawResult: unknown): boolean {
  if (rawResult === StartUpPageCreateResult.success || rawResult === 0) {
    return true;
  }

  if (rawResult === true) {
    return true;
  }

  if (typeof rawResult === "string") {
    const normalized = rawResult.trim();
    if (normalized === "0" || normalized === "success" || normalized === "APP_REQUEST_CREATE_PAGE_SUCCESS") {
      return true;
    }

    const numeric = Number(normalized);
    if (Number.isFinite(numeric)) {
      return numeric === StartUpPageCreateResult.success;
    }
  }

  if (typeof rawResult === "number") {
    return rawResult === StartUpPageCreateResult.success;
  }

  return false;
}

function isImageUpdateSuccess(rawResult: unknown): boolean {
  if (rawResult === ImageRawDataUpdateResult.success || rawResult === 0 || rawResult === true) {
    return true;
  }

  if (typeof rawResult === "string") {
    const normalized = rawResult.trim();
    if (
      normalized === "0" ||
      normalized === "success" ||
      normalized === "ImageRawDataUpdateResult.success" ||
      normalized === "APP_REQUEST_UPGRADE_IMAGE_RAW_DATA_SUCCESS"
    ) {
      return true;
    }

    const numeric = Number(normalized);
    if (Number.isFinite(numeric)) {
      return numeric === 0;
    }
  }

  return false;
}
