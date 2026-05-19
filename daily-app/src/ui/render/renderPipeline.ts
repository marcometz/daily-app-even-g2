import type { Logger } from "../../utils/logger";
import type { EvenHubBridge } from "../../bridge/evenHubBridge";
import { buildLayout } from "../layout/layoutBuilder";

export type ContainerType = "text" | "list" | "image";

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

export interface ImageViewModel {
  type: "image";
  id: string;
  imageData: number[] | string | Uint8Array | ArrayBuffer;
  xPosition?: number;
  yPosition?: number;
  width?: number;
  height?: number;
}

export interface ViewModel {
  title: string;
  layoutMode?: "stacked" | "two-column" | "list-footer" | "text-pager" | "dashboard-menu";
  containers: Array<TextViewModel | ListViewModel | ImageViewModel>;
}

export class RenderPipeline {
  private created = false;
  private lastTextContainerKeys: string[] | null = null;
  private lastTextUpdateSignature: string | null = null;
  constructor(private readonly bridge: EvenHubBridge, private readonly logger: Logger) {}

  async render(viewModel: ViewModel): Promise<void> {
    const layout = buildLayout(viewModel);
    const { imageUpdates, ...containerLayout } = layout;
    const textContainerKeys = (containerLayout.textObject?.length ?? 0) > 0
      ? readTextContainerKeys(containerLayout.textObject ?? [])
      : null;
    const textUpdateSignature = readTextUpdateSignature(containerLayout);

    if (!this.created) {
      this.created = await this.bridge.createStartup(containerLayout);
      this.logger.info(`Startup UI created: ${this.created}`);
      if (this.created) {
        await this.pushImageUpdates(imageUpdates);
      }
      this.lastTextContainerKeys = textContainerKeys;
      this.lastTextUpdateSignature = textUpdateSignature;
      return;
    }

    // Text delta updates are safe when the rendered page still has the same container structure.
    if (
      layout.textObject &&
      hasSameTextContainers(textContainerKeys, this.lastTextContainerKeys) &&
      textUpdateSignature !== null &&
      textUpdateSignature === this.lastTextUpdateSignature
    ) {
      let allUpdated = true;
      for (const text of layout.textObject) {
        const updated = await this.bridge.updateText({
          containerID: text.containerID,
          containerName: text.containerName,
          contentOffset: 0,
          contentLength: text.content?.length ?? 0,
          content: text.content,
        });
        if (!updated) {
          allUpdated = false;
          break;
        }
      }

      if (allUpdated) {
        await this.pushImageUpdates(imageUpdates);
        this.lastTextContainerKeys = textContainerKeys;
        this.lastTextUpdateSignature = textUpdateSignature;
        return;
      }

      this.logger.info("textContainerUpgrade failed, fallback to rebuild");
    }

    const rebuilt = await this.bridge.rebuild(containerLayout);
    if (!rebuilt) {
      this.logger.info("rebuildPageContainer failed");
    } else {
      await this.pushImageUpdates(imageUpdates);
    }

    this.lastTextContainerKeys = textContainerKeys;
    this.lastTextUpdateSignature = textUpdateSignature;
  }

  private async pushImageUpdates(imageUpdates: ReturnType<typeof buildLayout>["imageUpdates"]): Promise<void> {
    for (const imageUpdate of imageUpdates ?? []) {
      const updated = await this.bridge.updateImage(imageUpdate);
      if (!updated) {
        this.logger.info(`updateImageRawData failed for container ${imageUpdate.containerName ?? imageUpdate.containerID}`);
      }
    }
  }
}

function readTextContainerKeys(textObject: NonNullable<ReturnType<typeof buildLayout>["textObject"]>): string[] {
  return textObject.map((text) => `${text.containerID ?? ""}:${text.containerName ?? ""}`);
}

/**
 * Returns a stable signature for layouts where only text content may change.
 */
function readTextUpdateSignature(layout: Omit<ReturnType<typeof buildLayout>, "imageUpdates">): string | null {
  if (!layout.textObject || layout.textObject.length === 0) {
    return null;
  }

  return JSON.stringify({
    containerTotalNum: layout.containerTotalNum,
    listObject: layout.listObject ?? null,
    imageObject: layout.imageObject ?? null,
    textObject: layout.textObject.map((text) => ({
      xPosition: text.xPosition,
      yPosition: text.yPosition,
      width: text.width,
      height: text.height,
      borderWidth: text.borderWidth,
      borderColor: text.borderColor,
      borderRadius: text.borderRadius,
      paddingLength: text.paddingLength,
      containerID: text.containerID,
      containerName: text.containerName,
      isEventCapture: text.isEventCapture,
    })),
  });
}

function hasSameTextContainers(next: string[] | null, previous: string[] | null): boolean {
  if (!next || !previous || next.length !== previous.length) {
    return false;
  }

  return next.every((key, index) => key === previous[index]);
}
