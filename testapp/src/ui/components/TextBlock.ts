import type { DetailData } from "../../services/data/DataService";
import type { TextViewModel, ViewModel } from "../render/renderPipeline";

const MAX_DETAIL_CONTENT_LENGTH = 980;

export function buildTextModel(text: string, eventCapture: 0 | 1): TextViewModel {
  return {
    type: "text",
    id: "text-1",
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

  const content = truncateText(
    [
      "RSS-Detail",
      "",
      detail.title,
      "",
      activePage,
      "",
      sourceLine,
      `Seite: ${pageIndex + 1}/${pageCount}`,
      `AutoScroll: ${options.autoScrollEnabled ? "AN" : "AUS"}`,
      "Click: AutoScroll",
      "Up/Down: Vorheriger/Nachster",
      "DoubleClick: Zuruck zur Liste",
    ].join("\n")
  );

  return {
    title: "RSS-Detail",
    containers: [buildTextModel(content, eventCapture)],
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

function truncateText(text: string): string {
  if (text.length <= MAX_DETAIL_CONTENT_LENGTH) {
    return text;
  }

  const suffix = "\n\n[gekuerzt]";
  return `${text.slice(0, MAX_DETAIL_CONTENT_LENGTH - suffix.length)}${suffix}`;
}
