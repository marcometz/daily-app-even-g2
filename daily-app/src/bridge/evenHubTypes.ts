import type {
  CreateStartUpPageContainer,
  EvenHubEvent,
  ListContainerProperty,
  RebuildPageContainer,
  TextContainerProperty,
  TextContainerUpgrade,
} from "@evenrealities/even_hub_sdk";

export type StartupPayload = CreateStartUpPageContainer;
export type RebuildPayload = RebuildPageContainer;
export type TextUpgradePayload = TextContainerUpgrade;
export type EvenHubEventPayload = EvenHubEvent;
export type TextContainerPayload = TextContainerProperty;
export type ListContainerPayload = ListContainerProperty;

export interface OsEventTypeResolver {
  fromJson(value: unknown): number | undefined;
}
