import type { DataService } from "../services/data/DataService";

export class Store {
  private dataService: DataService | null = null;

  setDataService(service: DataService): void {
    this.dataService = service;
  }

  getDataService(): DataService {
    if (!this.dataService) {
      throw new Error("DataService not set");
    }
    return this.dataService;
  }
}
