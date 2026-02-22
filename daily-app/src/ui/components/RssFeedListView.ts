import type { ListData } from "../../services/data/DataService";
import type { ListViewModel, TextViewModel, ViewModel } from "../render/renderPipeline";

function buildListModel(title: string, items: string[], selectedIndex: number): ListViewModel {
  return {
    type: "list",
    id: "rss-list",
    title,
    items,
    selectedIndex,
    eventCapture: 1,
  };
}

function buildPageStatusModel(pageStatus: string): TextViewModel {
  return {
    type: "text",
    id: "rss-page-status",
    content: pageStatus,
    eventCapture: 0,
  };
}

export function buildRssFeedListViewModel(
  list: ListData,
  selectedIndex: number,
  pageStatus: string
): ViewModel {
  return {
    title: list.title,
    layoutMode: "list-footer",
    containers: [
      buildListModel(
        list.title,
        list.items.map((item) => item.label),
        selectedIndex
      ),
      buildPageStatusModel(pageStatus),
    ],
  };
}
