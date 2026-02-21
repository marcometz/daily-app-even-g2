import type { DashboardData, DataService, DetailData, ListData } from "./DataService";
import { RSS_FEEDS } from "./rssConfig";
import { parseRssFeed, type ParsedRssItem } from "./rssParser";

const RSS_LIST_ID = "rss";

export class MockDataService implements DataService {
  private rssItems: ParsedRssItem[] = [];

  private readonly dashboard: DashboardData = {
    title: "Dashboard",
    items: [{ id: "dashboard-rss", label: "RSS-Feeds", listId: RSS_LIST_ID }],
  };

  async refreshList(listId: string): Promise<void> {
    if (listId !== RSS_LIST_ID) {
      return;
    }

    const responses = await Promise.allSettled(
      RSS_FEEDS.map(async (feed) => {
        const response = await fetch(feed.url, {
          headers: {
            Accept: "application/rss+xml, application/xml, text/xml",
          },
        });

        if (!response.ok) {
          throw new Error(`${feed.title}: HTTP ${response.status}`);
        }

        const xml = await response.text();
        return parseRssFeed(xml, feed);
      })
    );

    const loadedItems: ParsedRssItem[] = [];
    for (const response of responses) {
      if (response.status === "fulfilled") {
        loadedItems.push(...response.value);
      }
    }

    if (loadedItems.length > 0) {
      this.rssItems = loadedItems.sort(compareByPublishedDateDesc);
      return;
    }

    if (this.rssItems.length > 0) {
      throw new Error("RSS-Feeds sind nicht erreichbar. Letzter Stand bleibt sichtbar.");
    }

    throw new Error("RSS-Feeds konnten nicht geladen werden.");
  }

  getDashboard(): DashboardData {
    return this.dashboard;
  }

  getList(listId: string): ListData {
    if (listId !== RSS_LIST_ID) {
      return {
        id: listId,
        title: "Liste",
        items: [],
      };
    }

    return {
      id: RSS_LIST_ID,
      title: "RSS-Feeds",
      items: this.rssItems.map((item) => ({
        id: item.id,
        label: `${item.title} - ${item.snippet}`,
      })),
    };
  }

  getDetail(itemId: string): DetailData {
    const item = this.rssItems.find((entry) => entry.id === itemId);
    if (!item) {
      return {
        id: itemId,
        title: "Eintrag nicht gefunden",
        description: "Der RSS-Eintrag ist nicht mehr verfuegbar.",
        pages: ["Der RSS-Eintrag ist nicht mehr verfuegbar."],
        source: "RSS",
      };
    }

    return {
      id: item.id,
      title: item.title,
      description: item.description,
      pages: item.pages,
      source: item.source,
      link: item.link,
      pubDateText: item.pubDateText,
    };
  }

  getAdjacentItemId(itemId: string, direction: "up" | "down"): string | null {
    const index = this.rssItems.findIndex((item) => item.id === itemId);
    if (index < 0) {
      return null;
    }

    const offset = direction === "up" ? -1 : 1;
    const targetIndex = index + offset;
    const target = this.rssItems[targetIndex];

    return target ? target.id : null;
  }
}

function compareByPublishedDateDesc(a: ParsedRssItem, b: ParsedRssItem): number {
  const aDate = a.pubDateMs;
  const bDate = b.pubDateMs;

  if (aDate === null && bDate === null) {
    return a.title.localeCompare(b.title);
  }
  if (aDate === null) {
    return 1;
  }
  if (bDate === null) {
    return -1;
  }
  return bDate - aDate;
}
