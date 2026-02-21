import "./style.css";
import { AppController } from "./app/appController";
import { RssConfigService } from "./services/data/RssConfigService";
import type { EditableRssFeed } from "./services/data/rssConfig";
import { EvenHubStorageService } from "./services/storage/EvenHubStorageService";

interface FeedDraft {
  id: string;
  title: string;
  url: string;
}

interface FeedFieldErrors {
  title?: string;
  url?: string;
}

interface ValidationResult {
  feeds: EditableRssFeed[];
  errors: FeedFieldErrors[];
  formError: string | null;
}

const app = requireElement<HTMLDivElement>("#app");
app.innerHTML = `
  <div class="card">
    <h1>EvenHub TestApp</h1>
    <div class="badge" id="config-status">storage: pending</div>
    <p>RSS-Feeds fuer die Glaeser konfigurieren. Aenderungen greifen beim naechsten Listen-Refresh.</p>
  </div>
  <div class="card">
    <h1>RSS Config</h1>
    <p id="config-feedback" class="feedback"></p>
    <div id="feed-list" class="feed-list"></div>
    <div class="actions">
      <button id="add-feed" type="button">Feed hinzufuegen</button>
      <button id="save-feeds" type="button">Speichern</button>
    </div>
  </div>
`;

const statusEl = requireElement<HTMLElement>("#config-status");
const feedbackEl = requireElement<HTMLElement>("#config-feedback");
const feedListEl = requireElement<HTMLDivElement>("#feed-list");
const addFeedButton = requireElement<HTMLButtonElement>("#add-feed");
const saveButton = requireElement<HTMLButtonElement>("#save-feeds");

const storageService = new EvenHubStorageService();
const rssConfigService = new RssConfigService(storageService);

let feeds: FeedDraft[] = [];
let fieldErrors: FeedFieldErrors[] = [];
let isBusy = false;

const controller = new AppController();
void controller.start().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("AppController start failed:", message);
});

feedListEl.addEventListener("input", (event) => {
  const target = event.target as HTMLInputElement | null;
  if (!target) {
    return;
  }

  const index = readIndex(target.dataset.index);
  const field = target.dataset.field;
  if (index === null || !feeds[index]) {
    return;
  }
  if (field !== "title" && field !== "url") {
    return;
  }

  feeds[index][field] = target.value;
  if (fieldErrors[index]?.[field]) {
    fieldErrors[index][field] = undefined;
    renderFeeds();
  }
});

feedListEl.addEventListener("click", (event) => {
  const target = event.target as HTMLElement | null;
  const button = target?.closest<HTMLButtonElement>("button[data-action='delete-feed']");
  if (!button) {
    return;
  }

  const index = readIndex(button.dataset.index);
  if (index === null || !feeds[index]) {
    return;
  }

  feeds.splice(index, 1);
  fieldErrors.splice(index, 1);
  clearFeedback();
  renderFeeds();
});

addFeedButton.addEventListener("click", () => {
  feeds.push(createEmptyFeed());
  fieldErrors.push({});
  clearFeedback();
  renderFeeds();
});

saveButton.addEventListener("click", async () => {
  clearFeedback();
  const validation = validateFeeds(feeds);
  fieldErrors = validation.errors;
  renderFeeds();

  if (validation.formError) {
    setFeedback(validation.formError, "error");
    return;
  }

  setBusy(true);
  try {
    await rssConfigService.saveEditableFeeds(validation.feeds);
    const persisted = await rssConfigService.loadEditableFeeds();
    feeds = persisted.map((feed) => ({ ...feed }));
    fieldErrors = feeds.map(() => ({}));
    setStatus("storage: saved", "ok");
    setFeedback("RSS-Konfiguration gespeichert.", "ok");
    renderFeeds();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus("storage: error", "error");
    setFeedback(`Speichern fehlgeschlagen: ${message}`, "error");
  } finally {
    setBusy(false);
  }
});

void loadConfig();

async function loadConfig(): Promise<void> {
  setBusy(true);
  setStatus("storage: loading", "pending");
  clearFeedback();

  try {
    const storedFeeds = await rssConfigService.loadEditableFeeds();
    feeds = storedFeeds.map((feed) => ({ ...feed }));
    fieldErrors = feeds.map(() => ({}));
    setStatus("storage: connected", "ok");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    feeds = [createEmptyFeed()];
    fieldErrors = [{}];
    setStatus("storage: error", "error");
    setFeedback(`Konfiguration konnte nicht geladen werden: ${message}`, "error");
  } finally {
    setBusy(false);
    renderFeeds();
  }
}

function renderFeeds(): void {
  const activeFeeds = feeds.length > 0 ? feeds : [createEmptyFeed()];
  if (feeds.length === 0) {
    feeds = activeFeeds;
    fieldErrors = [{}];
  }

  feedListEl.innerHTML = "";
  for (let index = 0; index < feeds.length; index += 1) {
    const feed = feeds[index];
    const errors = fieldErrors[index] ?? {};
    const row = document.createElement("div");
    row.className = "feed-row";
    row.innerHTML = `
      <div class="feed-row-head">
        <strong>Feed ${index + 1}</strong>
        <button type="button" class="danger" data-action="delete-feed" data-index="${index}" ${
          isBusy ? "disabled" : ""
        }>
          Loeschen
        </button>
      </div>
      <label class="field-label" for="feed-title-${index}">Titel</label>
      <input
        id="feed-title-${index}"
        type="text"
        data-index="${index}"
        data-field="title"
        value="${escapeHtml(feed.title)}"
        placeholder="z. B. Tagesschau"
        ${isBusy ? "disabled" : ""}
      />
      <p class="validation-error">${errors.title ?? ""}</p>
      <label class="field-label" for="feed-url-${index}">RSS URL</label>
      <input
        id="feed-url-${index}"
        type="url"
        data-index="${index}"
        data-field="url"
        value="${escapeHtml(feed.url)}"
        placeholder="https://example.com/rss.xml"
        ${isBusy ? "disabled" : ""}
      />
      <p class="validation-error">${errors.url ?? ""}</p>
    `;
    feedListEl.appendChild(row);
  }
}

function validateFeeds(drafts: FeedDraft[]): ValidationResult {
  const nextErrors: FeedFieldErrors[] = drafts.map(() => ({}));
  const validFeeds: EditableRssFeed[] = [];

  for (let index = 0; index < drafts.length; index += 1) {
    const draft = drafts[index];
    const title = draft.title.trim();
    const url = draft.url.trim();

    if (!title) {
      nextErrors[index].title = "Titel ist erforderlich.";
    }
    if (!url) {
      nextErrors[index].url = "URL ist erforderlich.";
    } else if (!isValidHttpUrl(url)) {
      nextErrors[index].url = "URL muss mit http:// oder https:// beginnen.";
    }

    if (nextErrors[index].title || nextErrors[index].url) {
      continue;
    }

    validFeeds.push({
      id: draft.id.trim(),
      title,
      url,
    });
  }

  if (validFeeds.length === 0) {
    return {
      feeds: [],
      errors: nextErrors,
      formError: "Mindestens ein gueltiger Feed ist erforderlich.",
    };
  }

  if (nextErrors.some((entry) => Boolean(entry.title || entry.url))) {
    return {
      feeds: validFeeds,
      errors: nextErrors,
      formError: "Bitte markierte Eingaben korrigieren.",
    };
  }

  return {
    feeds: validFeeds,
    errors: nextErrors,
    formError: null,
  };
}

function setStatus(text: string, tone: "pending" | "ok" | "error"): void {
  statusEl.textContent = text;
  statusEl.classList.remove("badge-pending", "badge-ok", "badge-error");
  statusEl.classList.add(`badge-${tone}`);
}

function setFeedback(text: string, tone: "ok" | "error"): void {
  feedbackEl.textContent = text;
  feedbackEl.classList.remove("feedback-ok", "feedback-error");
  feedbackEl.classList.add(tone === "ok" ? "feedback-ok" : "feedback-error");
}

function clearFeedback(): void {
  feedbackEl.textContent = "";
  feedbackEl.classList.remove("feedback-ok", "feedback-error");
}

function setBusy(nextBusy: boolean): void {
  isBusy = nextBusy;
  addFeedButton.disabled = nextBusy;
  saveButton.disabled = nextBusy;
  renderFeeds();
}

function createEmptyFeed(): FeedDraft {
  return { id: "", title: "", url: "" };
}

function readIndex(raw: string | undefined): number | null {
  if (!raw) {
    return null;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }
  return element;
}
