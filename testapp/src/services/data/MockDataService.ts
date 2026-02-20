import type { ActionsData, DashboardData, DataService, DetailData, ListData } from "./DataService";

export class MockDataService implements DataService {
  private readonly lists: ListData[] = [
    {
      id: "default",
      title: "Elemente",
      items: [
        { id: "item-1", label: "Element 1" },
        { id: "item-2", label: "Element 2" },
        { id: "item-3", label: "Element 3" },
      ],
    },
  ];

  getDashboard(): DashboardData {
    return {
      title: "EvenHub Prototype",
      subtitle: "Click: Liste\nDoubleClick: Zurueck",
    };
  }

  getList(listId: string): ListData {
    return this.lists.find((list) => list.id === listId) ?? this.lists[0];
  }

  getDetail(itemId: string): DetailData {
    return {
      id: itemId,
      title: `Detail ${itemId}`,
      description: "Click: Actions-Layer\nDoubleClick: Zurueck",
    };
  }

  getActions(ownerId: string): ActionsData {
    return {
      ownerId,
      title: "Aktionen",
      items: [
        { id: "action-1", label: "Start" },
        { id: "action-2", label: "Stop" },
        { id: "action-3", label: "Reset" },
      ],
    };
  }
}
