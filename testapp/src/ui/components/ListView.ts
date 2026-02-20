import type { ListData, ActionsData, DetailData } from "../../services/data/DataService";
import type { ListViewModel, ViewModel } from "../render/renderPipeline";
import { buildDetailViewModel } from "./TextBlock";

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

export function buildActionsViewModel(actions: ActionsData, selectedIndex: number): ViewModel {
  return {
    title: actions.title,
    containers: [buildListModel(actions.title, actions.items.map((item) => item.label), selectedIndex)],
  };
}

export function buildActionsOverlayViewModel(
  actions: ActionsData,
  detail: DetailData,
  selectedIndex: number
): ViewModel {
  const detailModel = buildDetailViewModel(detail, 0);
  const listModel = buildListModel(
    actions.title,
    actions.items.map((item) => item.label),
    selectedIndex
  );

  return {
    title: actions.title,
    containers: [detailModel.containers[0], listModel],
  };
}
