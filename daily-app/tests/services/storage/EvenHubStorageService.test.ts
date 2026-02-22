import { describe, expect, it, vi } from "vitest";
import { EvenHubStorageService } from "../../../src/services/storage/EvenHubStorageService";
import type { EvenHubStorageBridge } from "../../../src/bridge/evenHubStorageBridge";

describe("EvenHubStorageService", () => {
  it("reads values via injected storage bridge", async () => {
    const storageBridge: EvenHubStorageBridge = {
      getLocalStorage: vi.fn().mockResolvedValue("stored-value"),
      setLocalStorage: vi.fn(),
    };
    const service = new EvenHubStorageService(storageBridge);

    await expect(service.get("test-key")).resolves.toBe("stored-value");
    expect(storageBridge.getLocalStorage).toHaveBeenCalledWith("test-key");
  });

  it("writes values via injected storage bridge", async () => {
    const storageBridge: EvenHubStorageBridge = {
      getLocalStorage: vi.fn(),
      setLocalStorage: vi.fn().mockResolvedValue(true),
    };
    const service = new EvenHubStorageService(storageBridge);

    await expect(service.set("test-key", "value")).resolves.toBe(true);
    expect(storageBridge.setLocalStorage).toHaveBeenCalledWith("test-key", "value");
  });
});
