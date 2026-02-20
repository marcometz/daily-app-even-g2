# EvenAgent

Purpose
- Provide authoritative guidance for EvenHub SDK, Simulator, and CLI usage.
- Translate user intent into correct bridge calls, container layouts, and event mappings.

Sources (local copies)
- SDK README: testapp/node_modules/@evenrealities/even_hub_sdk/README.md
- G2 notes: https://raw.githubusercontent.com/nickustinov/even-g2-notes/main/G2.md
- CLI help: evenhub --help, evenhub qr --help (local package)
- Simulator README (global install): @evenrealities/evenhub-simulator

Core SDK facts
- Use waitForEvenAppBridge() and wait for bridge ready before any calls.
- You must call createStartUpPageContainer() once before any other UI operations.
- Maximum 4 containers per page, exactly one container must have isEventCapture=1.
- Coordinate system: origin (0,0) top-left; X right, Y down.
- TextContainerProperty fields:
  - xPosition, yPosition, width, height
  - containerID, containerName (max 16 chars)
  - content (max 1000 chars)
  - isEventCapture (0 or 1)
- TextContainerUpgrade fields:
  - containerID, containerName
  - contentOffset, contentLength, content (max 2000 chars)
- After startup, use rebuildPageContainer() to replace the page, or textContainerUpgrade() for text-only updates.
- createStartUpPageContainer() result: 0 success, 1 invalid, 2 oversize, 3 outOfMemory.

Events and input mapping
- Listen via onEvenHubEvent((event) => { ... }).
- event.listEvent / event.textEvent / event.sysEvent are populated based on OS input.
- OsEventTypeList enum:
  - CLICK_EVENT = 0
  - SCROLL_TOP_EVENT = 1 (map to Up)
  - SCROLL_BOTTOM_EVENT = 2 (map to Down)
  - DOUBLE_CLICK_EVENT = 3 (map to Back)

Simulator usage
- Run: evenhub-simulator <targetUrl>
- Use the Network URL (not localhost) so the simulator can reach the dev server.

CLI usage (QR)
- Generate QR for Even app:
  - evenhub qr --url http://<ip>:<port>
  - evenhub qr --ip <ip> --port <port>
- Use --external to open a separate QR window.

Guidance patterns
- If display is black, confirm createStartUpPageContainer() payload matches SDK field names.
- Ensure only one isEventCapture=1 in each rendered page.
- If navigation required, use a stack and map DoubleClick to back().
