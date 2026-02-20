import { waitForEvenAppBridge } from "@evenrealities/even_hub_sdk";
import type { StorageService } from "./StorageService";

export class EvenHubStorageService implements StorageService {
  async get(key: string): Promise<string> {
    const bridge = await waitForEvenAppBridge();
    return bridge.getLocalStorage(key);
  }

  async set(key: string, value: string): Promise<boolean> {
    const bridge = await waitForEvenAppBridge();
    return bridge.setLocalStorage(key, value);
  }
}
