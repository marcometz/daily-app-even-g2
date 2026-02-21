export interface RssFeedConfig {
  id: string;
  title: string;
  url: string;
  maxEntries: number;
}

export interface EditableRssFeed {
  id: string;
  title: string;
  url: string;
}

export const RSS_MAX_ENTRIES = 50;

export const DEFAULT_RSS_FEEDS: EditableRssFeed[] = [
  {
    id: "tagesschau",
    title: "Tagesschau",
    url: "https://www.tagesschau.de/infoservices/alle-meldungen-100~rss2.xml",
  },
];
