import type { ListData } from "../../services/data/DataService";
import type { ListViewModel, ViewModel } from "../render/renderPipeline";

function buildListModel(title: string, items: string[], selectedIndex: number): ListViewModel {
  return {
    type: "list",
    id: "list-1",
    title,
    items,
    selectedIndex,
    eventCapture: 1,
  };
}

export function buildListViewModel(list: ListData, selectedIndex: number): ViewModel {
  return {
    title: list.title,
    containers: [buildListModel(list.title, list.items.map((item) => item.label), selectedIndex)],
  };
}
