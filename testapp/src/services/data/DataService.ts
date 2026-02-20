export interface DashboardData {
  title: string;
  subtitle: string;
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
}

export interface ActionsData {
  ownerId: string;
  title: string;
  items: { id: string; label: string }[];
}

export interface DataService {
  getDashboard(): DashboardData;
  getList(listId: string): ListData;
  getDetail(itemId: string): DetailData;
  getActions(ownerId: string): ActionsData;
}
