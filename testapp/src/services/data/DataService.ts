export interface DashboardItem {
  id: string;
  label: string;
  listId: string;
}

export interface DashboardData {
  title: string;
  items: DashboardItem[];
}

export interface ListItem {
  id: string;
  label: string;
}

export interface ListData {
  id: string;
  title: string;
  items: ListItem[];
}

export interface DetailData {
  id: string;
  title: string;
  description: string;
  pages: string[];
  source: string;
  link?: string;
  pubDateText?: string;
}

export interface DataService {
  getDashboard(): DashboardData;
  refreshList(listId: string): Promise<void>;
  getList(listId: string): ListData;
  getDetail(itemId: string): DetailData;
  getAdjacentItemId(itemId: string, direction: "up" | "down"): string | null;
}
