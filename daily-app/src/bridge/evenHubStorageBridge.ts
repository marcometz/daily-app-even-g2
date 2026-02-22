import { waitForEvenAppBridge } from "@evenrealities/even_hub_sdk";

export interface EvenHubStorageBridge {
  getLocalStorage(key: string): Promise<string>;
  setLocalStorage(key: string, value: string): Promise<boolean>;
}

class WaitForBridgeStorage implements EvenHubStorageBridge {
  async getLocalStorage(key: string): Promise<string> {
    const bridge = await waitForEvenAppBridge();
    return bridge.getLocalStorage(key);
  }

  async setLocalStorage(key: string, value: string): Promise<boolean> {
    const bridge = await waitForEvenAppBridge();
    return bridge.setLocalStorage(key, value);
  }
}

export function createEvenHubStorageBridge(): EvenHubStorageBridge {
  return new WaitForBridgeStorage();
}
