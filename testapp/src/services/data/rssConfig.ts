export interface RssFeedConfig {
  id: string;
  title: string;
  url: string;
  maxEntries: number;
}

export const RSS_FEEDS: RssFeedConfig[] = [
  {
    id: "tagesschau",
    title: "Tagesschau",
    url: "https://www.tagesschau.de/infoservices/alle-meldungen-100~rss2.xml",
    maxEntries: 50,
  },
];
