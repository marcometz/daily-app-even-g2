import type { DashboardData } from "../../services/data/DataService";
import type { ListViewModel, TextViewModel, ViewModel } from "../render/renderPipeline";

const MAX_INFO_CONTENT_LENGTH = 240;

function buildDashboardListModel(
  title: string,
  items: string[],
  selectedIndex: number
): ListViewModel {
  return {
    type: "list",
    id: "dashboard-list",
    title,
    items,
    selectedIndex,
    eventCapture: 1,
  };
}

function buildDashboardInfoModel(content: string): TextViewModel {
  return {
    type: "text",
    id: "dashboard-info",
    content,
    eventCapture: 0,
  };
}

function readDescription(dashboard: DashboardData, selectedIndex: number): string {
  if (dashboard.items.length === 0) {
    return "Keine Menuepunkte verfuegbar.";
  }

  const safeIndex = clampIndex(selectedIndex, dashboard.items.length);
  const selectedItem = dashboard.items[safeIndex];
  if (!selectedItem) {
    return "Keine Menuepunkte verfuegbar.";
  }

  const description = selectedItem.description?.trim() || "Keine Kurzbeschreibung verfuegbar.";
  const content = [selectedItem.label, "", description].join("\n");
  return content.length <= MAX_INFO_CONTENT_LENGTH
    ? content
    : `${content.slice(0, MAX_INFO_CONTENT_LENGTH - 12)}\n\n[gekuerzt]`;
}

function clampIndex(selectedIndex: number, count: number): number {
  if (count <= 0) {
    return 0;
  }
  if (selectedIndex < 0) {
    return 0;
  }
  if (selectedIndex >= count) {
    return count - 1;
  }
  return selectedIndex;
}

export function buildDashboardViewModel(
  dashboard: DashboardData,
  selectedIndex: number
): ViewModel {
  return {
    title: dashboard.title,
    layoutMode: "two-column",
    containers: [
      buildDashboardListModel(
        dashboard.title,
        dashboard.items.map((item) => item.label),
        clampIndex(selectedIndex, dashboard.items.length)
      ),
      buildDashboardInfoModel(readDescription(dashboard, selectedIndex)),
    ],
  };
}
