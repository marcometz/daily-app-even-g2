import { beforeEach, describe, expect, it, vi } from "vitest";
import { waitForEvenAppBridge } from "@evenrealities/even_hub_sdk";
import { createEvenHubStorageBridge } from "../../src/bridge/evenHubStorageBridge";

vi.mock("@evenrealities/even_hub_sdk", () => ({
  waitForEvenAppBridge: vi.fn(),
}));

describe("createEvenHubStorageBridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates getLocalStorage through EvenAppBridge", async () => {
    const sdkBridge = {
      getLocalStorage: vi.fn().mockResolvedValue("value"),
      setLocalStorage: vi.fn(),
    };
    vi.mocked(waitForEvenAppBridge).mockResolvedValue(sdkBridge as unknown as Awaited<ReturnType<typeof waitForEvenAppBridge>>);

    const storageBridge = createEvenHubStorageBridge();
    const value = await storageBridge.getLocalStorage("theme");

    expect(value).toBe("value");
    expect(sdkBridge.getLocalStorage).toHaveBeenCalledWith("theme");
  });

  it("delegates setLocalStorage through EvenAppBridge", async () => {
    const sdkBridge = {
      getLocalStorage: vi.fn(),
      setLocalStorage: vi.fn().mockResolvedValue(true),
    };
    vi.mocked(waitForEvenAppBridge).mockResolvedValue(sdkBridge as unknown as Awaited<ReturnType<typeof waitForEvenAppBridge>>);

    const storageBridge = createEvenHubStorageBridge();
    const saved = await storageBridge.setLocalStorage("theme", "dark");

    expect(saved).toBe(true);
    expect(sdkBridge.setLocalStorage).toHaveBeenCalledWith("theme", "dark");
  });
});
