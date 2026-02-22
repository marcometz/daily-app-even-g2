import {
  createEvenHubStorageBridge,
  type EvenHubStorageBridge,
} from "../../bridge/evenHubStorageBridge";
import type { StorageService } from "./StorageService";

export class EvenHubStorageService implements StorageService {
  constructor(private readonly storageBridge: EvenHubStorageBridge = createEvenHubStorageBridge()) {}

  async get(key: string): Promise<string> {
    return this.storageBridge.getLocalStorage(key);
  }

  async set(key: string, value: string): Promise<boolean> {
    return this.storageBridge.setLocalStorage(key, value);
  }
}
