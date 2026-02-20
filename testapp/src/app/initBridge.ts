import { EvenHubBridge } from "../bridge/evenHubBridge";

export async function initBridge(): Promise<EvenHubBridge> {
  const bridge = new EvenHubBridge();
  await bridge.connect();
  return bridge;
}
