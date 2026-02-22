import type { TextContainerPayload, ListContainerPayload } from "../../bridge/evenHubTypes";
import type { ViewModel, TextViewModel, ListViewModel } from "../render/renderPipeline";
import { CONTAINER_IDS } from "./containerIds";

export interface LayoutPayload {
  textObject?: TextContainerPayload[];
  listObject?: ListContainerPayload[];
  containerTotalNum: number;
}

export function buildLayout(viewModel: ViewModel): LayoutPayload {
  const textContainers: TextContainerPayload[] = [];
  const listContainers: ListContainerPayload[] = [];

  const hasText = viewModel.containers.some((container) => container.type === "text");
  const hasList = viewModel.containers.some((container) => container.type === "list");
  const isTwoColumn = viewModel.layoutMode === "two-column" && hasText && hasList;
  const isStackedSplit = !isTwoColumn && hasText && hasList;

  const textX = isTwoColumn ? 288 : 0;
  const textY = 0;
  const textWidth = isTwoColumn ? 288 : 576;
  const textHeight = isStackedSplit ? 96 : 288;

  const listX = 0;
  const listY = isStackedSplit ? 96 : 0;
  const listWidth = isTwoColumn ? 280 : 576;
  const listHeight = isStackedSplit ? 192 : 288;

  let eventCaptureAssigned = false;

  for (const container of viewModel.containers) {
    if (container.type === "text") {
      const text = container as TextViewModel;
      const borderedText = isTwoColumn;
      textContainers.push({
        xPosition: textX,
        yPosition: textY,
        width: textWidth,
        height: textHeight,
        borderWidth: borderedText ? 1 : 0,
        borderRdaius: borderedText ? 4 : 0,
        paddingLength: borderedText ? 6 : 0,
        containerID: CONTAINER_IDS.text.id,
        containerName: CONTAINER_IDS.text.name,
        content: text.content,
        isEventCapture: text.eventCapture && !eventCaptureAssigned ? 1 : 0,
      });
      if (text.eventCapture && !eventCaptureAssigned) {
        eventCaptureAssigned = true;
      }
    }

    if (container.type === "list") {
      const list = container as ListViewModel;
      listContainers.push({
        xPosition: listX,
        yPosition: listY,
        width: listWidth,
        height: listHeight,
        containerID: CONTAINER_IDS.list.id,
        containerName: CONTAINER_IDS.list.name,
        isEventCapture: list.eventCapture && !eventCaptureAssigned ? 1 : 0,
        itemContainer: {
          itemCount: list.items.length,
          itemWidth: Math.max(20, listWidth - 11),
          isItemSelectBorderEn: 1,
          itemName: list.items,
        },
      });
      if (list.eventCapture && !eventCaptureAssigned) {
        eventCaptureAssigned = true;
      }
    }
  }

  const total = textContainers.length + listContainers.length;

  return {
    containerTotalNum: total,
    textObject: textContainers.length ? textContainers : undefined,
    listObject: listContainers.length ? listContainers : undefined,
  };
}
