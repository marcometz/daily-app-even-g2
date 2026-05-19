const baseUrl = process.env.SIMULATOR_AUTOMATION_URL || "http://127.0.0.1:9898";
const action = process.env.SIMULATOR_INPUT_ACTION || "";
const timeoutMs = Number(process.env.SIMULATOR_SMOKE_TIMEOUT_MS || 10000);

async function main() {
  await waitForPing();
  await expectPng("/api/screenshot/glasses");
  await expectPng("/api/screenshot/webview");
  await expectJson("/api/console");

  if (action) {
    await postInput(action);
  }

  console.log(`[sim-smoke] ok ${baseUrl}`);
}

async function waitForPing() {
  const start = Date.now();
  let lastError = null;

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/api/ping`);
      const text = await response.text();
      if (response.ok && text.trim() === "pong") {
        return;
      }
      lastError = new Error(`Unexpected ping response: ${response.status} ${text}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(250);
  }

  throw new Error(`Simulator automation API did not become ready: ${String(lastError)}`);
}

async function expectPng(path) {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`${path} failed: HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("image/png")) {
    throw new Error(`${path} returned ${contentType || "no content-type"}, expected image/png`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length < 8 || bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4e || bytes[3] !== 0x47) {
    throw new Error(`${path} did not return a PNG payload`);
  }
}

async function expectJson(path) {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`${path} failed: HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (!payload || !Array.isArray(payload.entries) || typeof payload.total !== "number") {
    throw new Error(`${path} returned an unexpected console payload`);
  }
}

async function postInput(inputAction) {
  const allowed = new Set(["up", "down", "click", "double_click"]);
  if (!allowed.has(inputAction)) {
    throw new Error(`SIMULATOR_INPUT_ACTION must be one of ${Array.from(allowed).join(", ")}`);
  }

  const response = await fetch(`${baseUrl}/api/input`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: inputAction }),
  });
  if (!response.ok) {
    throw new Error(`/api/input failed: HTTP ${response.status}`);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(`[sim-smoke] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
