import type { TextContainerProperty, ListContainerProperty } from "@evenrealities/even_hub_sdk";
import type { ViewModel, TextViewModel, ListViewModel } from "../render/renderPipeline";
import { CONTAINER_IDS } from "./containerIds";

export interface LayoutPayload {
  textObject?: TextContainerProperty[];
  listObject?: ListContainerProperty[];
  containerTotalNum: number;
}

export function buildLayout(viewModel: ViewModel): LayoutPayload {
  const textContainers: TextContainerProperty[] = [];
  const listContainers: ListContainerProperty[] = [];

  const hasText = viewModel.containers.some((container) => container.type === "text");
  const hasList = viewModel.containers.some((container) => container.type === "list");
  const isSplit = hasText && hasList;

  const textHeight = isSplit ? 96 : 288;
  const listHeight = isSplit ? 192 : 288;
  const listYOffset = isSplit ? 96 : 0;

  let eventCaptureAssigned = false;

  for (const container of viewModel.containers) {
    if (container.type === "text") {
      const text = container as TextViewModel;
      textContainers.push({
        xPosition: 0,
        yPosition: 0,
        width: 576,
        height: textHeight,
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
        xPosition: 0,
        yPosition: listYOffset,
        width: 576,
        height: listHeight,
        containerID: CONTAINER_IDS.list.id,
        containerName: CONTAINER_IDS.list.name,
        isEventCapture: list.eventCapture && !eventCaptureAssigned ? 1 : 0,
        itemContainer: {
          itemCount: list.items.length,
          itemWidth: 0,
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
