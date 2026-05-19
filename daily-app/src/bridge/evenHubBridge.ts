import {
  ImageRawDataUpdateResult,
  ImuReportPace,
  OsEventTypeList,
  StartUpPageCreateResult,
  waitForEvenAppBridge,
  type DeviceInfo,
  type DeviceStatus,
  type EvenHubEvent,
  type LaunchSource,
  type UserInfo,
} from "@evenrealities/even_hub_sdk";
import type { InputEvent } from "../input/keyBindings";
import { mapEvenHubEvent } from "../input/evenHubEventMapper";
import type {
  EvenHubDeviceInfo,
  EvenHubDeviceStatus,
  EvenHubUserInfo,
  ImageUpdatePayload,
  RebuildPayload,
  SdkImageUpdatePayload,
  SdkRebuildPayload,
  SdkStartupPayload,
  SdkTextUpgradePayload,
  StartupPayload,
  TextUpgradePayload,
  AudioChunkHandler,
} from "./evenHubTypes";

export class EvenHubBridge {
  private ready = false;
  private created = false;
  private startupInFlight: Promise<boolean> | null = null;
  private bridge: Awaited<ReturnType<typeof waitForEvenAppBridge>> | null = null;
  private inputHandler: ((event: InputEvent) => void) | null = null;
  private audioChunkHandler: AudioChunkHandler | null = null;
  private launchSourceHandler: ((source: LaunchSource) => void) | null = null;
  private deviceStatusHandler: ((status: EvenHubDeviceStatus) => void) | null = null;
  private lastLaunchSource: LaunchSource | null = null;
  private lastDeviceStatus: EvenHubDeviceStatus | null = null;
  private evenHubUnsubscribe: (() => void) | null = null;
  private launchSourceUnsubscribe: (() => void) | null = null;
  private deviceStatusUnsubscribe: (() => void) | null = null;

  async connect(): Promise<void> {
    if (this.ready && this.bridge) {
      return;
    }

    this.bridge = await waitForEvenAppBridge();
    this.ready = true;

    if (this.bridge.onEvenHubEvent) {
      this.evenHubUnsubscribe = this.bridge.onEvenHubEvent((event: EvenHubEvent) => {
        const audioChunk = normalizeAudioChunk(event.audioEvent?.audioPcm);
        if (audioChunk && this.audioChunkHandler) {
          this.audioChunkHandler(audioChunk);
        }

        const input = mapEvenHubEvent(event, OsEventTypeList);
        if (input && this.inputHandler) {
          this.inputHandler(input);
        }
      });
    }

    if (this.bridge.onLaunchSource) {
      this.launchSourceUnsubscribe = this.bridge.onLaunchSource((source: LaunchSource) => {
        this.lastLaunchSource = source;
        this.launchSourceHandler?.(source);
      });
    }

    if (this.bridge.onDeviceStatusChanged) {
      this.deviceStatusUnsubscribe = this.bridge.onDeviceStatusChanged((status: DeviceStatus) => {
        const normalized = normalizeDeviceStatus(status);
        this.lastDeviceStatus = normalized;
        this.deviceStatusHandler?.(normalized);
      });
    }
  }

  disconnect(): void {
    this.evenHubUnsubscribe?.();
    this.launchSourceUnsubscribe?.();
    this.deviceStatusUnsubscribe?.();
    this.evenHubUnsubscribe = null;
    this.launchSourceUnsubscribe = null;
    this.deviceStatusUnsubscribe = null;
    this.inputHandler = null;
    this.audioChunkHandler = null;
    this.launchSourceHandler = null;
    this.deviceStatusHandler = null;
    this.lastLaunchSource = null;
    this.lastDeviceStatus = null;
    this.bridge = null;
    this.ready = false;
    this.created = false;
    this.startupInFlight = null;
  }

  onInput(handler: (event: InputEvent) => void): void {
    this.inputHandler = handler;
  }

  onAudioChunk(handler: AudioChunkHandler | null): void {
    this.audioChunkHandler = handler;
  }

  onLaunchSource(handler: (source: LaunchSource) => void): void {
    this.launchSourceHandler = handler;
    if (this.lastLaunchSource) {
      handler(this.lastLaunchSource);
    }
  }

  onDeviceStatusChanged(handler: (status: EvenHubDeviceStatus) => void): void {
    this.deviceStatusHandler = handler;
    if (this.lastDeviceStatus) {
      handler(this.lastDeviceStatus);
    }
  }

  async getUserInfo(): Promise<EvenHubUserInfo | null> {
    if (!this.ready || !this.bridge?.getUserInfo) {
      return null;
    }

    const userInfo = await this.bridge.getUserInfo();
    return normalizeUserInfo(userInfo);
  }

  async getDeviceInfo(): Promise<EvenHubDeviceInfo | null> {
    if (!this.ready || !this.bridge?.getDeviceInfo) {
      return null;
    }

    const deviceInfo = await this.bridge.getDeviceInfo();
    return deviceInfo ? normalizeDeviceInfo(deviceInfo) : null;
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

  async shutDownPageContainer(exitMode = 1): Promise<boolean> {
    if (!this.ready || !this.bridge?.shutDownPageContainer) {
      return false;
    }

    return this.bridge.shutDownPageContainer(exitMode);
  }

  async callEvenApp(method: string, params?: unknown): Promise<unknown> {
    if (!this.ready || !this.bridge?.callEvenApp) {
      return null;
    }

    return this.bridge.callEvenApp(method, params);
  }
}

function normalizeUserInfo(userInfo: UserInfo): EvenHubUserInfo {
  return {
    uid: userInfo.uid,
    name: userInfo.name,
    avatar: userInfo.avatar,
    country: userInfo.country,
  };
}

function normalizeDeviceInfo(deviceInfo: DeviceInfo): EvenHubDeviceInfo {
  return {
    model: String(deviceInfo.model),
    sn: deviceInfo.sn,
    status: deviceInfo.status ? normalizeDeviceStatus(deviceInfo.status) : undefined,
  };
}

function normalizeDeviceStatus(status: DeviceStatus): EvenHubDeviceStatus {
  return {
    sn: status.sn,
    connectType: String(status.connectType),
    isWearing: status.isWearing,
    batteryLevel: status.batteryLevel,
    isCharging: status.isCharging,
    isInCase: status.isInCase,
  };
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

function normalizeAudioChunk(value: unknown): Uint8Array | null {
  if (value instanceof Uint8Array) {
    return value;
  }

  if (Array.isArray(value) && value.every((entry) => typeof entry === "number")) {
    return new Uint8Array(value);
  }

  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }

  return null;
}
