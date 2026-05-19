import { beforeEach, describe, expect, it, vi } from "vitest";
import { waitForEvenAppBridge } from "@evenrealities/even_hub_sdk";
import { mapEvenHubEvent } from "../../src/input/evenHubEventMapper";
import { EvenHubBridge } from "../../src/bridge/evenHubBridge";
import type { StartupPayload } from "../../src/bridge/evenHubTypes";
import type { InputEvent } from "../../src/input/keyBindings";

vi.mock("@evenrealities/even_hub_sdk", () => ({
  ImageRawDataUpdateResult: {
    success: "success",
    sendFailed: "sendFailed",
  },
  ImuReportPace: {
    P100: 100,
    P500: 500,
  },
  OsEventTypeList: {
    fromJson: (value: unknown) => value,
  },
  StartUpPageCreateResult: {
    success: 0,
    invalid: 1,
    oversize: 2,
    outOfMemory: 3,
  },
  waitForEvenAppBridge: vi.fn(),
}));

vi.mock("../../src/input/evenHubEventMapper", () => ({
  mapEvenHubEvent: vi.fn(),
}));

type MockSdkBridge = {
  onEvenHubEvent: ReturnType<typeof vi.fn>;
  onLaunchSource: ReturnType<typeof vi.fn>;
  onDeviceStatusChanged: ReturnType<typeof vi.fn>;
  getUserInfo: ReturnType<typeof vi.fn>;
  getDeviceInfo: ReturnType<typeof vi.fn>;
  createStartUpPageContainer: ReturnType<typeof vi.fn>;
  rebuildPageContainer: ReturnType<typeof vi.fn>;
  textContainerUpgrade: ReturnType<typeof vi.fn>;
  updateImageRawData: ReturnType<typeof vi.fn>;
  audioControl: ReturnType<typeof vi.fn>;
  imuControl: ReturnType<typeof vi.fn>;
  shutDownPageContainer: ReturnType<typeof vi.fn>;
  callEvenApp: ReturnType<typeof vi.fn>;
};

function createMockSdkBridge(): MockSdkBridge {
  return {
    onEvenHubEvent: vi.fn(),
    onLaunchSource: vi.fn(),
    onDeviceStatusChanged: vi.fn(),
    getUserInfo: vi.fn(),
    getDeviceInfo: vi.fn(),
    createStartUpPageContainer: vi.fn(),
    rebuildPageContainer: vi.fn(),
    textContainerUpgrade: vi.fn(),
    updateImageRawData: vi.fn(),
    audioControl: vi.fn(),
    imuControl: vi.fn(),
    shutDownPageContainer: vi.fn(),
    callEvenApp: vi.fn(),
  };
}

const basePayload: StartupPayload = {
  containerTotalNum: 1,
  textObject: [
    {
      xPosition: 0,
      yPosition: 0,
      width: 100,
      height: 20,
      containerID: 1,
      containerName: "title",
      content: "hello",
      isEventCapture: 1,
    },
  ],
};

describe("EvenHubBridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("subscribes to EvenHub events and disconnect cleans up subscription", async () => {
    const sdkBridge = createMockSdkBridge();
    const unsubscribe = vi.fn();
    sdkBridge.onEvenHubEvent.mockReturnValue(unsubscribe);
    sdkBridge.onLaunchSource.mockReturnValue(vi.fn());
    sdkBridge.onDeviceStatusChanged.mockReturnValue(vi.fn());
    vi.mocked(waitForEvenAppBridge).mockResolvedValue(sdkBridge as unknown as Awaited<ReturnType<typeof waitForEvenAppBridge>>);

    const mappedInput: InputEvent = { type: "Click", raw: { source: "sdk" } };
    vi.mocked(mapEvenHubEvent).mockReturnValue(mappedInput);

    const bridge = new EvenHubBridge();
    const inputHandler = vi.fn();
    bridge.onInput(inputHandler);

    await bridge.connect();

    expect(sdkBridge.onEvenHubEvent).toHaveBeenCalledTimes(1);
    const eventCallback = sdkBridge.onEvenHubEvent.mock.calls[0]?.[0];
    expect(eventCallback).toBeTypeOf("function");

    eventCallback?.({ listEvent: { eventType: 0 } });
    expect(inputHandler).toHaveBeenCalledWith(mappedInput);

    bridge.disconnect();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("forwards audio chunks from sdk events before input mapping", async () => {
    const sdkBridge = createMockSdkBridge();
    sdkBridge.onEvenHubEvent.mockReturnValue(vi.fn());
    vi.mocked(waitForEvenAppBridge).mockResolvedValue(sdkBridge as unknown as Awaited<ReturnType<typeof waitForEvenAppBridge>>);
    vi.mocked(mapEvenHubEvent).mockReturnValue(null);

    const bridge = new EvenHubBridge();
    const audioHandler = vi.fn();
    bridge.onAudioChunk(audioHandler);

    await bridge.connect();

    const eventCallback = sdkBridge.onEvenHubEvent.mock.calls[0]?.[0];
    eventCallback?.({ audioEvent: { audioPcm: [1, 2, 255] } });

    expect(audioHandler).toHaveBeenCalledTimes(1);
    expect([...audioHandler.mock.calls[0]?.[0]]).toEqual([1, 2, 255]);
  });

  it("clears audio handler on disconnect", async () => {
    const sdkBridge = createMockSdkBridge();
    sdkBridge.onEvenHubEvent.mockReturnValue(vi.fn());
    vi.mocked(waitForEvenAppBridge).mockResolvedValue(sdkBridge as unknown as Awaited<ReturnType<typeof waitForEvenAppBridge>>);

    const bridge = new EvenHubBridge();
    const audioHandler = vi.fn();
    bridge.onAudioChunk(audioHandler);
    await bridge.connect();
    bridge.disconnect();

    const eventCallback = sdkBridge.onEvenHubEvent.mock.calls[0]?.[0];
    eventCallback?.({ audioEvent: { audioPcm: new Uint8Array([5]) } });

    expect(audioHandler).not.toHaveBeenCalled();
  });

  it("subscribes to launch source events and disconnect cleans up subscription", async () => {
    const sdkBridge = createMockSdkBridge();
    const unsubscribeLaunch = vi.fn();
    sdkBridge.onEvenHubEvent.mockReturnValue(vi.fn());
    sdkBridge.onLaunchSource.mockReturnValue(unsubscribeLaunch);
    sdkBridge.onDeviceStatusChanged.mockReturnValue(vi.fn());
    vi.mocked(waitForEvenAppBridge).mockResolvedValue(sdkBridge as unknown as Awaited<ReturnType<typeof waitForEvenAppBridge>>);

    const bridge = new EvenHubBridge();
    const launchHandler = vi.fn();
    bridge.onLaunchSource(launchHandler);

    await bridge.connect();

    expect(sdkBridge.onLaunchSource).toHaveBeenCalledTimes(1);
    const launchCallback = sdkBridge.onLaunchSource.mock.calls[0]?.[0];
    expect(launchCallback).toBeTypeOf("function");

    launchCallback?.("glassesMenu");
    expect(launchHandler).toHaveBeenCalledWith("glassesMenu");

    bridge.disconnect();
    expect(unsubscribeLaunch).toHaveBeenCalledTimes(1);
  });

  it("replays cached launch source to handlers registered after the event", async () => {
    const sdkBridge = createMockSdkBridge();
    sdkBridge.onEvenHubEvent.mockReturnValue(vi.fn());
    sdkBridge.onLaunchSource.mockReturnValue(vi.fn());
    sdkBridge.onDeviceStatusChanged.mockReturnValue(vi.fn());
    vi.mocked(waitForEvenAppBridge).mockResolvedValue(sdkBridge as unknown as Awaited<ReturnType<typeof waitForEvenAppBridge>>);

    const bridge = new EvenHubBridge();
    await bridge.connect();

    const launchCallback = sdkBridge.onLaunchSource.mock.calls[0]?.[0];
    launchCallback?.("glassesMenu");

    const launchHandler = vi.fn();
    bridge.onLaunchSource(launchHandler);

    expect(launchHandler).toHaveBeenCalledWith("glassesMenu");
  });

  it("subscribes to device status changes and normalizes sdk status", async () => {
    const sdkBridge = createMockSdkBridge();
    const unsubscribeStatus = vi.fn();
    sdkBridge.onEvenHubEvent.mockReturnValue(vi.fn());
    sdkBridge.onLaunchSource.mockReturnValue(vi.fn());
    sdkBridge.onDeviceStatusChanged.mockReturnValue(unsubscribeStatus);
    vi.mocked(waitForEvenAppBridge).mockResolvedValue(sdkBridge as unknown as Awaited<ReturnType<typeof waitForEvenAppBridge>>);

    const bridge = new EvenHubBridge();
    const statusHandler = vi.fn();
    bridge.onDeviceStatusChanged(statusHandler);

    await bridge.connect();

    const statusCallback = sdkBridge.onDeviceStatusChanged.mock.calls[0]?.[0];
    statusCallback?.({
      sn: "G2-1",
      connectType: "connected",
      isWearing: true,
      batteryLevel: 84,
      isCharging: false,
      isInCase: false,
    });

    expect(statusHandler).toHaveBeenCalledWith({
      sn: "G2-1",
      connectType: "connected",
      isWearing: true,
      batteryLevel: 84,
      isCharging: false,
      isInCase: false,
    });

    bridge.disconnect();
    expect(unsubscribeStatus).toHaveBeenCalledTimes(1);
  });

  it("replays cached device status to handlers registered after the event", async () => {
    const sdkBridge = createMockSdkBridge();
    sdkBridge.onEvenHubEvent.mockReturnValue(vi.fn());
    sdkBridge.onLaunchSource.mockReturnValue(vi.fn());
    sdkBridge.onDeviceStatusChanged.mockReturnValue(vi.fn());
    vi.mocked(waitForEvenAppBridge).mockResolvedValue(sdkBridge as unknown as Awaited<ReturnType<typeof waitForEvenAppBridge>>);

    const bridge = new EvenHubBridge();
    await bridge.connect();

    const statusCallback = sdkBridge.onDeviceStatusChanged.mock.calls[0]?.[0];
    statusCallback?.({ sn: "G2-1", connectType: "connected", batteryLevel: 70 });

    const statusHandler = vi.fn();
    bridge.onDeviceStatusChanged(statusHandler);

    expect(statusHandler).toHaveBeenCalledWith({
      sn: "G2-1",
      connectType: "connected",
      batteryLevel: 70,
      isCharging: undefined,
      isInCase: undefined,
      isWearing: undefined,
    });
  });

  it("treats enum startup success as created and avoids duplicate startup calls", async () => {
    const sdkBridge = createMockSdkBridge();
    sdkBridge.createStartUpPageContainer.mockResolvedValue(0);
    vi.mocked(waitForEvenAppBridge).mockResolvedValue(sdkBridge as unknown as Awaited<ReturnType<typeof waitForEvenAppBridge>>);

    const bridge = new EvenHubBridge();
    await bridge.connect();

    await expect(bridge.createStartup(basePayload)).resolves.toBe(true);
    await expect(bridge.createStartup(basePayload)).resolves.toBe(true);

    expect(sdkBridge.createStartUpPageContainer).toHaveBeenCalledTimes(1);
  });

  it("returns false for non-success startup result", async () => {
    const sdkBridge = createMockSdkBridge();
    sdkBridge.createStartUpPageContainer.mockResolvedValue(1);
    vi.mocked(waitForEvenAppBridge).mockResolvedValue(sdkBridge as unknown as Awaited<ReturnType<typeof waitForEvenAppBridge>>);

    const bridge = new EvenHubBridge();
    await bridge.connect();

    await expect(bridge.createStartup(basePayload)).resolves.toBe(false);
  });

  it("keeps compatibility with legacy startup success string", async () => {
    const sdkBridge = createMockSdkBridge();
    sdkBridge.createStartUpPageContainer.mockResolvedValue("APP_REQUEST_CREATE_PAGE_SUCCESS");
    vi.mocked(waitForEvenAppBridge).mockResolvedValue(sdkBridge as unknown as Awaited<ReturnType<typeof waitForEvenAppBridge>>);

    const bridge = new EvenHubBridge();
    await bridge.connect();

    await expect(bridge.createStartup(basePayload)).resolves.toBe(true);
  });

  it("resets startup state on disconnect so startup can run again after reconnect", async () => {
    const sdkBridge = createMockSdkBridge();
    sdkBridge.createStartUpPageContainer.mockResolvedValue(0);
    vi.mocked(waitForEvenAppBridge).mockResolvedValue(sdkBridge as unknown as Awaited<ReturnType<typeof waitForEvenAppBridge>>);

    const bridge = new EvenHubBridge();
    await bridge.connect();
    await bridge.createStartup(basePayload);
    bridge.disconnect();
    await bridge.connect();
    await bridge.createStartup(basePayload);

    expect(sdkBridge.createStartUpPageContainer).toHaveBeenCalledTimes(2);
  });

  it("updates image raw data and normalizes success result", async () => {
    const sdkBridge = createMockSdkBridge();
    sdkBridge.updateImageRawData.mockResolvedValue("success");
    vi.mocked(waitForEvenAppBridge).mockResolvedValue(sdkBridge as unknown as Awaited<ReturnType<typeof waitForEvenAppBridge>>);

    const bridge = new EvenHubBridge();
    await bridge.connect();

    await expect(
      bridge.updateImage({ containerID: 10, containerName: "img-1", imageData: [0, 1, 2] })
    ).resolves.toBe(true);
    expect(sdkBridge.updateImageRawData).toHaveBeenCalledWith({
      containerID: 10,
      containerName: "img-1",
      imageData: [0, 1, 2],
    });
  });

  it("returns false for failed image raw data update", async () => {
    const sdkBridge = createMockSdkBridge();
    sdkBridge.updateImageRawData.mockResolvedValue("sendFailed");
    vi.mocked(waitForEvenAppBridge).mockResolvedValue(sdkBridge as unknown as Awaited<ReturnType<typeof waitForEvenAppBridge>>);

    const bridge = new EvenHubBridge();
    await bridge.connect();

    await expect(
      bridge.updateImage({ containerID: 10, containerName: "img-1", imageData: [0] })
    ).resolves.toBe(false);
  });

  it("delegates audio and imu control through the sdk bridge", async () => {
    const sdkBridge = createMockSdkBridge();
    sdkBridge.audioControl.mockResolvedValue(true);
    sdkBridge.imuControl.mockResolvedValue(true);
    vi.mocked(waitForEvenAppBridge).mockResolvedValue(sdkBridge as unknown as Awaited<ReturnType<typeof waitForEvenAppBridge>>);

    const bridge = new EvenHubBridge();
    await bridge.connect();

    await expect(bridge.audioControl(true)).resolves.toBe(true);
    await expect(bridge.imuControl(true, 500 as never)).resolves.toBe(true);

    expect(sdkBridge.audioControl).toHaveBeenCalledWith(true);
    expect(sdkBridge.imuControl).toHaveBeenCalledWith(true, 500);
  });

  it("reads user and device info through the sdk bridge", async () => {
    const sdkBridge = createMockSdkBridge();
    sdkBridge.getUserInfo.mockResolvedValue({
      uid: 42,
      name: "Ada",
      avatar: "https://example.test/a.png",
      country: "DE",
    });
    sdkBridge.getDeviceInfo.mockResolvedValue({
      model: "g2",
      sn: "G2-1",
      status: {
        sn: "G2-1",
        connectType: "connected",
        batteryLevel: 90,
      },
    });
    vi.mocked(waitForEvenAppBridge).mockResolvedValue(sdkBridge as unknown as Awaited<ReturnType<typeof waitForEvenAppBridge>>);

    const bridge = new EvenHubBridge();
    await bridge.connect();

    await expect(bridge.getUserInfo()).resolves.toEqual({
      uid: 42,
      name: "Ada",
      avatar: "https://example.test/a.png",
      country: "DE",
    });
    await expect(bridge.getDeviceInfo()).resolves.toEqual({
      model: "g2",
      sn: "G2-1",
      status: {
        sn: "G2-1",
        connectType: "connected",
        batteryLevel: 90,
        isCharging: undefined,
        isInCase: undefined,
        isWearing: undefined,
      },
    });
  });

  it("delegates shutdown and generic Even App calls", async () => {
    const sdkBridge = createMockSdkBridge();
    sdkBridge.shutDownPageContainer.mockResolvedValue(true);
    sdkBridge.callEvenApp.mockResolvedValue({ ok: true });
    vi.mocked(waitForEvenAppBridge).mockResolvedValue(sdkBridge as unknown as Awaited<ReturnType<typeof waitForEvenAppBridge>>);

    const bridge = new EvenHubBridge();
    await bridge.connect();

    await expect(bridge.shutDownPageContainer(1)).resolves.toBe(true);
    await expect(bridge.callEvenApp("customMethod", { value: 1 })).resolves.toEqual({ ok: true });

    expect(sdkBridge.shutDownPageContainer).toHaveBeenCalledWith(1);
    expect(sdkBridge.callEvenApp).toHaveBeenCalledWith("customMethod", { value: 1 });
  });
});
