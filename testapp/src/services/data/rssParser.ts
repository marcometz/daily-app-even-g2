import type { RssFeedConfig } from "./rssConfig";

const DEFAULT_SNIPPET_LENGTH = 72;
const DEFAULT_DETAIL_PAGE_LENGTH = 480;

export interface ParsedRssItem {
  id: string;
  title: string;
  description: string;
  snippet: string;
  pages: string[];
  link?: string;
  source: string;
  pubDateText?: string;
  pubDateMs: number | null;
}

export function parseRssFeed(
  xml: string,
  feed: RssFeedConfig,
  options: { snippetLength?: number; pageLength?: number } = {}
): ParsedRssItem[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    throw new Error(`Ungueltiges RSS-XML fuer ${feed.title}`);
  }

  const snippetLength = options.snippetLength ?? DEFAULT_SNIPPET_LENGTH;
  const pageLength = options.pageLength ?? DEFAULT_DETAIL_PAGE_LENGTH;
  const items = Array.from(doc.getElementsByTagName("item"));

  return items.slice(0, feed.maxEntries).map((item, index) => {
    const title = getText(item, ["title"]) || "Ohne Titel";
    const descriptionRaw = getText(item, ["description", "content:encoded"]);
    const description = normalizeWhitespace(stripHtml(descriptionRaw || "Keine Beschreibung verfuegbar."));
    const snippet = toOneLineSnippet(description, snippetLength);
    const pubDateText = getText(item, ["pubDate"]);
    const pubDateMs = toTimestamp(pubDateText);
    const link = getText(item, ["link"]);
    const guid = getText(item, ["guid"]);

    return {
      id: buildItemId(feed.id, guid || link || `${title}-${index}`),
      title,
      description,
      snippet,
      pages: paginateText(description, pageLength),
      link: link || undefined,
      source: feed.title,
      pubDateText: pubDateText || undefined,
      pubDateMs,
    };
  });
}

export function stripHtml(value: string): string {
  if (!value.trim()) {
    return "";
  }

  const htmlDoc = new DOMParser().parseFromString(value, "text/html");
  return htmlDoc.body.textContent || "";
}

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function toOneLineSnippet(value: string, maxLength = DEFAULT_SNIPPET_LENGTH): string {
  const normalized = normalizeWhitespace(value);
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

export function paginateText(value: string, maxPageLength = DEFAULT_DETAIL_PAGE_LENGTH): string[] {
  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    return ["Keine Beschreibung verfuegbar."];
  }

  if (normalized.length <= maxPageLength) {
    return [normalized];
  }

  const pages: string[] = [];
  let cursor = 0;

  while (cursor < normalized.length) {
    const remaining = normalized.length - cursor;
    if (remaining <= maxPageLength) {
      pages.push(normalized.slice(cursor).trim());
      break;
    }

    const window = normalized.slice(cursor, cursor + maxPageLength + 1);
    const splitAt = window.lastIndexOf(" ");
    const take = splitAt > 0 ? splitAt : maxPageLength;
    pages.push(window.slice(0, take).trim());
    cursor += take;

    while (normalized[cursor] === " ") {
      cursor += 1;
    }
  }

  return pages.filter((page) => page.length > 0);
}

function getText(item: Element, names: string[]): string {
  for (const name of names) {
    const value = directTagText(item, name);
    if (value) {
      return value;
    }
  }
  return "";
}

function directTagText(item: Element, tagName: string): string {
  const nodes = item.getElementsByTagName(tagName);
  if (!nodes.length) {
    return "";
  }
  return normalizeWhitespace(nodes[0]?.textContent || "");
}

function toTimestamp(value: string): number | null {
  if (!value) {
    return null;
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function buildItemId(feedId: string, uniqueKey: string): string {
  let hash = 0;
  for (let index = 0; index < uniqueKey.length; index += 1) {
    hash = (hash << 5) - hash + uniqueKey.charCodeAt(index);
    hash |= 0;
  }

  return `${feedId}-${Math.abs(hash).toString(36)}`;
}
