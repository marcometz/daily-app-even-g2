# EvenAgent

Purpose
- Provide authoritative guidance for EvenHub SDK, Simulator, and CLI usage.
- Translate user intent into correct bridge calls, container layouts, event mappings, and bridge lifecycle handling.

Sources (local copies)
- SDK types (authoritative): `daily-app/node_modules/@evenrealities/even_hub_sdk/dist/index.d.ts`
- SDK package metadata: `daily-app/node_modules/@evenrealities/even_hub_sdk/package.json`
- SDK README (EN): `daily-app/node_modules/@evenrealities/even_hub_sdk/README.md`
- SDK README (ZH, often fresher for version notes): `daily-app/node_modules/@evenrealities/even_hub_sdk/README.zh-CN.md`
- G2 notes: https://raw.githubusercontent.com/nickustinov/even-g2-notes/main/G2.md
- CLI help: evenhub --help, evenhub qr --help (local package)
- Simulator README (global install): @evenrealities/evenhub-simulator
- EH-InNovel reference architecture:
  - `composeApp/src/webMain/kotlin/.../sdk/EvenHubBridge.kt`
  - `composeApp/src/webMain/kotlin/.../sdk/EvenHubTypes.kt`
  - `composeApp/src/webMain/kotlin/.../models/AppState.kt`

Examples Apps
- https://github.com/nickustinov?tab=repositories
- https://github.com/nickustinov/even-dev
- https://github.com/nickustinov/even-dev/tree/main/apps/restapi

SDK truth hierarchy
- Resolve SDK behavior in this priority order:
  1. `dist/index.d.ts`
  2. local SDK `package.json`
  3. README files
- The English README can lag on version details. Always verify version-sensitive claims in `index.d.ts` and package metadata.

Core SDK facts
- Use `waitForEvenAppBridge()` and wait for bridge ready before calls.
- Must-know APIs:
  - `getUserInfo`, `getDeviceInfo`, `onDeviceStatusChanged`
  - `createStartUpPageContainer`, `rebuildPageContainer`, `textContainerUpgrade`, `updateImageRawData`
  - `audioControl`, `shutDownPageContainer`, `onEvenHubEvent`, `callEvenApp`
- Call `createStartUpPageContainer()` exactly once before other glasses UI operations.
- Maximum 4 containers per page, exactly one container must have `isEventCapture=1`.
- Coordinate system: origin `(0,0)` top-left; X right; Y down.
- `TextContainerProperty` fields:
  - `xPosition`, `yPosition`, `width`, `height`
  - `containerID`, `containerName` (max 16 chars)
  - `content` (max 1000 chars)
  - `isEventCapture` (0 or 1)
- `TextContainerUpgrade` fields:
  - `containerID`, `containerName`
  - `contentOffset`, `contentLength`, `content` (max 2000 chars)
- After startup, use `rebuildPageContainer()` for page replacement and `textContainerUpgrade()` for text-only deltas.
- Startup result contract is `StartUpPageCreateResult`:
  - `0` success
  - `1` invalid
  - `2` oversize
  - `3` outOfMemory
- Image update contract is `ImageRawDataUpdateResult` (enum), not only boolean.
- Typing caveat: exported type is `ShutDownContaniner` (SDK typo), runtime method name is `shutDownPageContainer(...)`.

Events and input mapping
- Listen via `onEvenHubEvent((event) => { ... })`.
- `event.listEvent`, `event.textEvent`, `event.sysEvent`, and `event.audioEvent` are supported branches.
- `imgEvent` is protocol-defined but not fully represented in current SDK type definitions.
- `OsEventTypeList` enum:
  - `CLICK_EVENT = 0`
  - `SCROLL_TOP_EVENT = 1` (map to Up)
  - `SCROLL_BOTTOM_EVENT = 2` (map to Down)
  - `DOUBLE_CLICK_EVENT = 3` (map to Back)

Simulator usage
- Run: `evenhub-simulator <targetUrl>`
- Use a network URL (not localhost) so simulator/device can reach the dev server.

CLI usage (QR)
- Generate QR for Even app:
  - `evenhub qr --url http://<ip>:<port>`
  - `evenhub qr --ip <ip> --port <port>`
- Use `--external` to open a separate QR window.

Guidance patterns
- If display is black, verify `createStartUpPageContainer()` payload fields and ranges.
- Ensure exactly one `isEventCapture=1` per rendered page.
- If navigation is required, use a stack and map DoubleClick to back.
- Use `callEvenApp(...)` fallback only when no typed SDK wrapper exists for the operation.
- Treat `audioControl(...)` and `shutDownPageContainer(...)` as startup-dependent operations.
- Send `updateImageRawData(...)` sequentially only (no concurrent image pushes).
- Prefer explicit result-aware handling:
  - Startup: mark created state only on `StartUpPageCreateResult.success`
  - Image updates: branch behavior by `ImageRawDataUpdateResult`

Testing requirements
- For every EvenHub-related code change, add/update automated tests for:
  - each changed method/function
  - each changed feature flow (input -> navigation/render behavior)
- For new bridge methods, minimum coverage must include:
  - happy path
  - host-return edge case(s)
  - regression case for prior behavior
- For event mapping/navigation fixes, add deterministic fixture tests for:
  - expected payload variants
  - at least one regression case reproducing the bug
- If simulator/device-only validation is required, still provide automated unit/integration tests for core logic and document manual-only gaps.
