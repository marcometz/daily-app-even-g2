# EvenHub Current SDK Notes

Last refreshed: 2026-05-19

Primary sources:
- Official docs index: https://hub.evenrealities.com/docs
- Installation/version docs: https://hub.evenrealities.com/docs/getting-started/installation
- Architecture: https://hub.evenrealities.com/docs/getting-started/architecture
- Page lifecycle: https://hub.evenrealities.com/docs/guides/page-lifecycle
- Input/events: https://hub.evenrealities.com/docs/guides/input-events
- Display/UI: https://hub.evenrealities.com/docs/guides/display
- Device APIs: https://hub.evenrealities.com/docs/guides/device-apis
- Networking: https://hub.evenrealities.com/docs/guides/networking
- Headless testing: https://hub.evenrealities.com/docs/guides/headless-testing
- Simulator: https://hub.evenrealities.com/docs/reference/simulator
- CLI: https://hub.evenrealities.com/docs/reference/cli
- Packaging: https://hub.evenrealities.com/docs/reference/packaging
- Claude Code AI tooling: https://hub.evenrealities.com/docs/AI-tooling/claude%20code/
- Claude Code skill catalog: https://hub.evenrealities.com/docs/AI-tooling/claude%20code/skill-catalog
- AI skill source repo: https://github.com/even-realities/everything-evenhub
- Starter templates: https://github.com/even-realities/evenhub-templates

## Current Tool Targets

The official installation page, last updated 2026-04-22, lists:

- `@evenrealities/even_hub_sdk`: `0.0.10`, published 2026-04-10
- `@evenrealities/evenhub-simulator`: `0.7.2`, published 2026-04-15
- `@evenrealities/evenhub-cli`: `0.1.12`, published 2026-04-16

npm latest checked 2026-05-19:

- `@evenrealities/even_hub_sdk`: `0.0.10`
- `@evenrealities/evenhub-simulator`: `0.7.3`
- `@evenrealities/evenhub-cli`: `0.1.13`

Local refresh commands:

```bash
npm --prefix daily-app install @evenrealities/even_hub_sdk@^0.0.10
npm install -D @evenrealities/evenhub-cli@^0.1.13
npm install -g @evenrealities/evenhub-simulator@^0.7.3
```

After installing, re-read `daily-app/node_modules/@evenrealities/even_hub_sdk/dist/index.d.ts`. The updated local type definitions are the authoritative source for exact method signatures, enum values, and event payload shapes.

## Official AI Tooling And Templates

The official Claude Code guide describes the open-source `everything-evenhub` plugin as an AI skill set for Even G2 development. The current catalog lists 13 skills:

- One-click: `quickstart`, `template`, `build-and-deploy`
- Core development: `glasses-ui`, `handle-input`, `device-features`, `background-state`, `test-with-simulator`, `simulator-automation`, `font-measurement`
- Reference: `sdk-reference`, `cli-reference`, `design-guidelines`

Installation commands from the guide:

```text
/plugin marketplace add even-realities/everything-evenhub
/plugin install everything-evenhub
```

The `evenhub-templates` repository currently exposes four starter families:

- `minimal`: Vite + TypeScript + SDK + simulator, single text container.
- `asr`: microphone audio pipeline with a provider-agnostic STT stub, transcript rendering, double-tap exit, `g2-microphone` permission.
- `image`: image placeholder container, full-screen text event layer, serial `updateImageRawData`, status updates.
- `text-heavy`: long-form pagination with `@evenrealities/pretext`, serialized `textContainerUpgrade`, tap/swipe navigation.

Template adaptation rules for this repo:

- Use templates as pattern references, not as direct copy targets.
- Read the chosen template's `README.md`, `src/main.ts`, `package.json`, and `app.json` before adapting a flow.
- Keep SDK imports behind `daily-app/src/bridge/`; move template event-routing into `input/`, routing into `navigation/`, and layout into `ui/`.
- Verify template package versions against official installation docs and local package metadata before making version-sensitive claims.
- The AI tooling catalog documents `background-state` through `setBackgroundState` and `onBackgroundRestore`, but the installed `@evenrealities/even_hub_sdk@0.0.10` type file does not currently export those names. Do not implement this pattern until the installed SDK types/runtime confirm support.

## Architecture Model

Even Hub apps are normal web apps hosted inside the Even Realities App WebView. App logic runs on the phone; the glasses render SDK containers and send input events back over Bluetooth through the app bridge.

Keep Even-specific runtime calls behind the bridge layer. The SDK should remain the only Even-specific dependency.

## Display And UI

- Canvas: 576 x 288 pixels per eye.
- Rendering: 4-bit greyscale green.
- Coordinate origin: top-left; X increases right, Y increases down.
- Latest SDK types state `containerTotalNum` is 1-12, `textObject` has max 8 entries, and `imageObject` has max 4 entries per page.
- Exactly one container must have `isEventCapture: 1`.
- Containers can overlap; declaration order controls draw order.
- No CSS, flexbox, DOM rendering, background fill, text alignment, font size, arbitrary drawing, animations, or native tables on the glasses display.

Text containers:
- Plain text, top-left aligned.
- `createStartUpPageContainer` and `rebuildPageContainer`: max 1000 chars.
- `textContainerUpgrade`: max 2000 chars.
- Use `textContainerUpgrade` for frequent changes; it avoids full redraw flicker.

List containers:
- Native scroll/highlight behavior.
- Max 20 items.
- Max 64 characters per item.
- No in-place list update; rebuild the page.

Image containers:
- Width 20-288 px, height 20-144 px.
- Greyscale only.
- Create placeholder containers first, then call `updateImageRawData`.
- Never send image updates concurrently.
- For image-first screens, use a full-screen text container behind the image with `isEventCapture: 1`.

## Lifecycle Calls

- `createStartUpPageContainer`: create the initial page exactly once.
- `rebuildPageContainer`: replace the page when layout/container composition changes.
- `textContainerUpgrade`: update text in place with matching `containerID` and `containerName`.
- `updateImageRawData`: update image container content sequentially.
- `shutDownPageContainer`: exit app; exit mode `0` is immediate, `1` shows an exit confirmation.
- `callEvenApp`: generic fallback when no typed wrapper exists.

Result handling:
- Startup result codes: `0` success, `1` invalid parameters, `2` oversize, `3` out of memory.
- `rebuildPageContainer`, `textContainerUpgrade`, and `shutDownPageContainer` return boolean.
- `updateImageRawData` returns `success`, `imageException`, `imageSizeInvalid`, `imageToGray4Failed`, or `sendFailed`.

## Input, Audio, And IMU

Input sources include G2 touchpads, optional R1 ring touchpads, and IMU streams.

Core event values:
- `CLICK_EVENT = 0`
- `SCROLL_TOP_EVENT = 1`
- `SCROLL_BOTTOM_EVENT = 2`
- `DOUBLE_CLICK_EVENT = 3`
- `FOREGROUND_ENTER_EVENT = 4`
- `FOREGROUND_EXIT_EVENT = 5`
- `ABNORMAL_EXIT_EVENT = 6`

Current docs also list `SYSTEM_EXIT_EVENT` and `IMU_DATA_REPORT`; verify exact enum values in the updated SDK type definitions after installation.

Event routing depends on the event-capture container:
- Text capture container -> `event.textEvent`
- List capture container -> `event.listEvent`

Audio:
- Start/stop with `audioControl(true | false)`.
- Data arrives through `event.audioEvent.audioPcm`.
- Format: 16 kHz, signed 16-bit little-endian, mono.

Template event-routing cautions:
- Protobuf can omit zero-valued events; handle click comparisons defensively where `CLICK_EVENT = 0` is expected.
- Taps, double-taps, lifecycle, and system exit usually appear on `sysEvent`; scroll gestures for text capture containers appear on `textEvent`; audio samples appear on `audioEvent`.
- Keep DoubleClick as a root-level back/exit path so a user can always reach `shutDownPageContainer(1)`.

IMU:
- Current docs describe `imuControl(isOpen, ImuReportPace)`.
- Samples arrive via `event.sysEvent.imuData`.
- `ImuReportPace` constants range from `P100` through `P1000`; these are protocol pacing codes, not literal Hz values.

## Simulator And Headless Testing

Simulator `0.7.3` supports local UI preview plus a headless control plane:

```bash
evenhub-simulator http://localhost:5173 --automation-port 9898
```

Control endpoints:
- `GET /api/ping`
- `GET /api/screenshot/glasses`
- `GET /api/screenshot/webview`
- `GET /api/console?since_id=N`
- `DELETE /api/console`
- `POST /api/input` with `click`, `double_click`, `up`, or `down`

Testing rules:
- Wait for an app-ready log or the first event-capturing container before sending input.
- The glasses screenshot is a 576 x 288 RGBA PNG.
- Treat pixels with `alpha > 0` as lit; do not convert to RGB for lit-pixel assertions.
- Validate on hardware before deployment because simulator rendering, list scrolling, image limits, status events, and abnormal error behavior can differ.

## CLI And Packaging

The current CLI supports both `evenhub` and `eh`.

Common commands:

```bash
evenhub login [-e email]
evenhub init [-d dir] [-o app.json]
evenhub qr --url "http://<lan-ip>:5173"
evenhub pack app.json dist -o myapp.ehpk [--no-ignore] [-c]
```

Every packaged app needs `app.json`.

Required manifest fields:
- `package_id`
- `edition`
- `name`
- `version`
- `min_app_version`
- `min_sdk_version`
- `entrypoint`
- `permissions`
- `supported_languages`

Current edition: `"202601"`.

Use `min_sdk_version: "0.0.10"` for new apps per installation docs, then validate with `evenhub pack` and the developer portal.

Permissions must be an array of objects, not a key-value map. Network permissions use a `whitelist` of full origins. The whitelist is an Even-side permission gate, not a CORS bypass; production requests still require normal browser CORS headers.
