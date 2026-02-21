import type { DashboardData, DataService, DetailData, ListData } from "./DataService";
import { parseRssFeed, type ParsedRssItem } from "./rssParser";
import { RssConfigService } from "./RssConfigService";

const RSS_LIST_ID = "rss";
const RSS_PROXY_PATH = "/rss-proxy";

export class MockDataService implements DataService {
  private rssItems: ParsedRssItem[] = [];
  constructor(private readonly rssConfigService: RssConfigService) {}

  private readonly dashboard: DashboardData = {
    title: "Dashboard",
    items: [{ id: "dashboard-rss", label: "RSS-Feeds", listId: RSS_LIST_ID }],
  };

  async refreshList(listId: string): Promise<void> {
    if (listId !== RSS_LIST_ID) {
      return;
    }

    const feeds = await this.rssConfigService.loadRuntimeFeeds();
    if (feeds.length === 0) {
      throw new Error("Keine gueltigen RSS-Feeds konfiguriert.");
    }

    const responses = await Promise.allSettled(
      feeds.map(async (feed) => {
        try {
          const xml = await fetchFeedXml(feed.url);
          return parseRssFeed(xml, feed);
        } catch (error) {
          const reason = readErrorMessage(error);
          throw new Error(`${feed.title}: ${reason}`);
        }
      })
    );

    const loadedItems: ParsedRssItem[] = [];
    const failedFeeds: string[] = [];
    for (const response of responses) {
      if (response.status === "fulfilled") {
        loadedItems.push(...response.value);
      } else {
        failedFeeds.push(readErrorMessage(response.reason));
      }
    }

    if (loadedItems.length > 0) {
      this.rssItems = loadedItems.sort(compareByPublishedDateDesc);
      return;
    }

    if (this.rssItems.length > 0) {
      throw new Error("RSS-Feeds sind nicht erreichbar. Letzter Stand bleibt sichtbar.");
    }

    const detail = failedFeeds.length > 0 ? ` Details: ${failedFeeds.join(" | ")}` : "";
    throw new Error(`RSS-Feeds konnten nicht geladen werden.${detail}`);
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

function readErrorMessage(value: unknown): string {
  if (value instanceof Error) {
    return value.message;
  }
  return String(value);
}

async function fetchFeedXml(url: string): Promise<string> {
  try {
    return await fetchXml(url);
  } catch (directError) {
    if (!shouldUseProxyFallback(directError)) {
      throw directError;
    }
    if (!import.meta.env.DEV) {
      throw new Error(
        `${readErrorMessage(directError)} (CORS-Block, Proxy-Fallback nur in DEV verfuegbar)`
      );
    }

    const proxiedUrl = `${RSS_PROXY_PATH}?url=${encodeURIComponent(url)}`;
    try {
      return await fetchXml(proxiedUrl);
    } catch (proxyError) {
      throw new Error(
        `${readErrorMessage(directError)}; Proxy-Fallback fehlgeschlagen: ${readErrorMessage(proxyError)}`
      );
    }
  }
}

async function fetchXml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
}

function shouldUseProxyFallback(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }

  const message = readErrorMessage(error).toLowerCase();
  return message.includes("cors") || message.includes("failed to fetch");
}
