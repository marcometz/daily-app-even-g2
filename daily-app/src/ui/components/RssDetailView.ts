import type { DetailData } from "../../services/data/DataService";
import type { TextViewModel, ViewModel } from "../render/renderPipeline";

const MAX_DETAIL_CONTENT_LENGTH = 980;
const MAX_DETAIL_TITLE_LENGTH = 180;
const MAX_DETAIL_BODY_LENGTH = 900;

export function buildTextModel(text: string, eventCapture: 0 | 1, id = "text-1"): TextViewModel {
  return {
    type: "text",
    id,
    content: text,
    eventCapture,
  };
}

export function buildDetailViewModel(
  detail: DetailData,
  options: { pageIndex: number; autoScrollEnabled: boolean },
  eventCapture: 0 | 1 = 1
): ViewModel {
  const pageCount = Math.max(1, detail.pages.length);
  const pageIndex = clampIndex(options.pageIndex, pageCount);
  const activePage = detail.pages[pageIndex] ?? detail.description;

  const sourceLine = detail.pubDateText
    ? `Quelle: ${detail.source} | ${detail.pubDateText}`
    : `Quelle: ${detail.source}`;

  const titleContent = truncateText(detail.title, MAX_DETAIL_TITLE_LENGTH);
  const bodyContent = truncateText(activePage, MAX_DETAIL_BODY_LENGTH);
  const pagerContent = [
    `${pageIndex + 1}/${pageCount}`,
    options.autoScrollEnabled ? "Auto AN" : "Auto AUS",
    sourceLine,
  ].join(" | ");

  return {
    title: "RSS-Detail",
    layoutMode: "text-pager",
    containers: [
      buildTextModel(titleContent, 0, "title"),
      buildTextModel(bodyContent, eventCapture, "body"),
      buildTextModel(pagerContent, 0, "pager"),
    ],
  };
}

function clampIndex(index: number, count: number): number {
  if (index < 0) {
    return 0;
  }
  if (index >= count) {
    return count - 1;
  }
  return index;
}

function truncateText(text: string, maxLength = MAX_DETAIL_CONTENT_LENGTH): string {
  if (text.length <= maxLength) {
    return text;
  }

  const suffix = "\n\n[gekuerzt]";
  return `${text.slice(0, maxLength - suffix.length)}${suffix}`;
}
