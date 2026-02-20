import type { Logger } from "../../utils/logger";
import type { EvenHubBridge } from "../../bridge/evenHubBridge";
import { buildLayout } from "../layout/layoutBuilder";

export type ContainerType = "text" | "list";

export interface TextViewModel {
  type: "text";
  id: string;
  content: string;
  eventCapture: 0 | 1;
}

export interface ListViewModel {
  type: "list";
  id: string;
  title: string;
  items: string[];
  selectedIndex: number;
  eventCapture: 0 | 1;
}

export interface ViewModel {
  title: string;
  containers: Array<TextViewModel | ListViewModel>;
}

export class RenderPipeline {
  private created = false;
  constructor(private readonly bridge: EvenHubBridge, private readonly logger: Logger) {}

  async render(viewModel: ViewModel): Promise<void> {
    const layout = buildLayout(viewModel);

    if (!this.created) {
      this.created = await this.bridge.createStartup(layout);
      this.logger.info(`Startup UI created: ${this.created}`);
      return;
    }

    const hasTextOnly =
      layout.containerTotalNum === 1 &&
      (layout.textObject?.length ?? 0) === 1 &&
      (layout.listObject?.length ?? 0) === 0;

    if (hasTextOnly && layout.textObject) {
      const text = layout.textObject[0];
      if (text) {
        await this.bridge.updateText({
          containerID: text.containerID,
          containerName: text.containerName,
          contentOffset: 0,
          contentLength: text.content?.length ?? 0,
          content: text.content,
        });
        return;
      }
    }

    await this.bridge.rebuild(layout);
  }
}
