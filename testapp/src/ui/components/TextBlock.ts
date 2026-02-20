import type { DashboardData, DetailData } from "../../services/data/DataService";
import type { TextViewModel, ViewModel } from "../render/renderPipeline";

export function buildTextModel(text: string, eventCapture: 0 | 1): TextViewModel {
  return {
    type: "text",
    id: "text-1",
    content: text,
    eventCapture,
  };
}

export function buildDashboardViewModel(data: DashboardData): ViewModel {
  const text = `Dashboard\n\n${data.title}\n\n${data.subtitle}\n\nClick: Liste öffnen`;
  return {
    title: "Dashboard",
    containers: [buildTextModel(text, 1)],
  };
}

export function buildDetailViewModel(detail: DetailData, eventCapture: 0 | 1 = 1): ViewModel {
  const text = `Detail\n\n${detail.title}\n\n${detail.description}\n\nClick: Actions`;
  return {
    title: "Detail",
    containers: [buildTextModel(text, eventCapture)],
  };
}
