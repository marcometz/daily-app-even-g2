import { beforeEach, describe, expect, it, vi } from "vitest";
import { waitForEvenAppBridge } from "@evenrealities/even_hub_sdk";
import { mapEvenHubEvent } from "../../src/input/evenHubEventMapper";
import { EvenHubBridge } from "../../src/bridge/evenHubBridge";
import type { StartupPayload } from "../../src/bridge/evenHubTypes";

vi.mock("@evenrealities/even_hub_sdk", () => ({
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
  createStartUpPageContainer: ReturnType<typeof vi.fn>;
  rebuildPageContainer: ReturnType<typeof vi.fn>;
  textContainerUpgrade: ReturnType<typeof vi.fn>;
};

function createMockSdkBridge(): MockSdkBridge {
  return {
    onEvenHubEvent: vi.fn(),
    createStartUpPageContainer: vi.fn(),
    rebuildPageContainer: vi.fn(),
    textContainerUpgrade: vi.fn(),
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
    vi.mocked(waitForEvenAppBridge).mockResolvedValue(sdkBridge as unknown as Awaited<ReturnType<typeof waitForEvenAppBridge>>);

    const mappedInput = { type: "Click", raw: { source: "sdk" } };
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
});
