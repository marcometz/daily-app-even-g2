import type {
  CreateStartUpPageContainer,
  EvenHubEvent,
  ImageRawDataUpdate,
  RebuildPageContainer,
  TextContainerUpgrade,
} from "@evenrealities/even_hub_sdk";

export interface ListItemContainerPayload {
  itemCount?: number;
  itemWidth?: number;
  isItemSelectBorderEn?: number;
  itemName?: string[];
}

export interface ListContainerPayload {
  xPosition?: number;
  yPosition?: number;
  width?: number;
  height?: number;
  borderWidth?: number;
  borderColor?: number;
  borderRadius?: number;
  paddingLength?: number;
  containerID?: number;
  containerName?: string;
  itemContainer?: ListItemContainerPayload;
  isEventCapture?: number;
}

export interface TextContainerPayload {
  xPosition?: number;
  yPosition?: number;
  width?: number;
  height?: number;
  borderWidth?: number;
  borderColor?: number;
  borderRadius?: number;
  paddingLength?: number;
  containerID?: number;
  containerName?: string;
  content?: string;
  isEventCapture?: number;
}

export interface ImageContainerPayload {
  xPosition?: number;
  yPosition?: number;
  width?: number;
  height?: number;
  containerID?: number;
  containerName?: string;
}

export interface ImageUpdatePayload {
  containerID?: number;
  containerName?: string;
  imageData?: number[] | string | Uint8Array | ArrayBuffer;
}

export interface StartupPayload {
  containerTotalNum?: number;
  listObject?: ListContainerPayload[];
  textObject?: TextContainerPayload[];
  imageObject?: ImageContainerPayload[];
  widgetId?: number;
}

export type RebuildPayload = Omit<StartupPayload, "widgetId">;
export interface TextUpgradePayload {
  containerID?: number;
  containerName?: string;
  contentOffset?: number;
  contentLength?: number;
  content?: string;
}
export type EvenHubEventPayload = EvenHubEvent;

export type SdkStartupPayload = CreateStartUpPageContainer;
export type SdkRebuildPayload = RebuildPageContainer;
export type SdkTextUpgradePayload = TextContainerUpgrade;
export type SdkImageUpdatePayload = ImageRawDataUpdate;

export interface OsEventTypeResolver {
  fromJson(value: unknown): number | undefined;
}
