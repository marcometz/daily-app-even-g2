import { defineConfig, type Plugin } from "vite";

const RSS_PROXY_PATH = "/rss-proxy";

export default defineConfig({
  plugins: [rssProxyPlugin()],
});

function rssProxyPlugin(): Plugin {
  return {
    name: "rss-proxy-plugin",
    configureServer(server) {
      server.middlewares.use(RSS_PROXY_PATH, async (req, res) => {
        try {
          const requestUrl = new URL(req.url || "", "http://localhost");
          const target = requestUrl.searchParams.get("url") || "";
          if (!target) {
            respondText(res, 400, "Missing query parameter: url");
            return;
          }

          let parsedTarget: URL;
          try {
            parsedTarget = new URL(target);
          } catch {
            respondText(res, 400, "Invalid target URL");
            return;
          }

          if (parsedTarget.protocol !== "http:" && parsedTarget.protocol !== "https:") {
            respondText(res, 400, "Only http/https URLs are allowed");
            return;
          }

          const upstream = await fetch(parsedTarget.toString(), {
            headers: {
              Accept: "application/rss+xml, application/xml, text/xml",
            },
          });

          if (!upstream.ok) {
            respondText(res, upstream.status, `Upstream error: HTTP ${upstream.status}`);
            return;
          }

          const body = await upstream.text();
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/xml; charset=utf-8");
          res.end(body);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          respondText(res, 502, `Proxy failed: ${message}`);
        }
      });
    },
  };
}

function respondText(
  res: import("node:http").ServerResponse,
  statusCode: number,
  body: string
): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end(body);
}
