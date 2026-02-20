import "./style.css";
import { waitForEvenAppBridge } from "@evenrealities/even_hub_sdk";

const app = document.querySelector("#app");

app.innerHTML = `
  <div class="card">
    <h1>EvenHub TestApp</h1>
    <div class="badge" id="bridge-status">bridge: pending</div>
    <p>Diese TestApp erzeugt einen Text-Container und lauscht auf Events.</p>
  </div>
  <div class="card">
    <h1>Events</h1>
    <div id="event-log" class="log"></div>
  </div>
  <div class="card">
    <h1>Last Payload</h1>
    <pre id="container-json">-</pre>
  </div>
`;

const statusEl = document.querySelector("#bridge-status");
const logEl = document.querySelector("#event-log");
const payloadEl = document.querySelector("#container-json");

const state = {
  counter: 0,
  lastEvent: null,
  created: false,
};

function log(message) {
  const line = document.createElement("div");
  line.textContent = message;
  logEl.prepend(line);
}

function buildTextContainer(text) {
  return {
    xPosition: 0,
    yPosition: 0,
    width: 576,
    height: 288,
    containerID: 1,
    containerName: "text-1",
    content: text,
    isEventCapture: 1,
  };
}

async function createContainer(bridge, text) {
  if (!bridge.createStartUpPageContainer) {
    log("createStartUpPageContainer not available on bridge.");
    return false;
  }

  const container = buildTextContainer(text);
  const payload = {
    containerTotalNum: 1,
    textObject: [container],
  };

  payloadEl.textContent = JSON.stringify(payload, null, 2);

  try {
    const result = await bridge.createStartUpPageContainer(payload);
    log(`createStartUpPageContainer result: ${result}`);
    return result === 0;
  } catch (error) {
    log(`create error: ${error?.message || error}`);
    return false;
  }
}

async function updateText(bridge, text) {
  if (!bridge.textContainerUpgrade) {
    log("textContainerUpgrade not available on bridge.");
    return;
  }

  const payload = {
    containerID: 1,
    containerName: "text-1",
    contentOffset: 0,
    contentLength: text.length,
    content: text,
  };

  payloadEl.textContent = JSON.stringify(payload, null, 2);

  try {
    const ok = await bridge.textContainerUpgrade(payload);
    log(`textContainerUpgrade: ${ok}`);
  } catch (error) {
    log(`upgrade error: ${error?.message || error}`);
  }
}

async function init() {
  log("Waiting for EvenAppBridge...");

  try {
    const bridge = await waitForEvenAppBridge();

    statusEl.textContent = "bridge: connected";
    log("Bridge connected.");

    if (!state.created) {
      state.created = await createContainer(bridge, "Hello EvenHub Simulator");
    }

    if (bridge.onEvenHubEvent) {
      bridge.onEvenHubEvent((event) => {
        state.counter += 1;
        state.lastEvent = event;
        log(`event #${state.counter}: ${JSON.stringify(event)}`);
        updateText(bridge, `Event #${state.counter}`);
      });
      log("Event listener attached.");
    } else {
      log("onEvenHubEvent not available on bridge.");
    }

    if (state.created) {
      await updateText(bridge, "Hello EvenHub Simulator");
    }
  } catch (error) {
    log(`waitForEvenAppBridge failed: ${error?.message || error}`);
    statusEl.textContent = "bridge: missing";
  }
}

init();
