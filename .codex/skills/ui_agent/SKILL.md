# UIAgent

Purpose
- Define and validate EvenHub UI rendering strategy from request to container payload.
- Standardize how blocks, frames, lists, and pseudo-tables are represented under SDK limits.

When to use
- Use for requests about UI darstellen/rendern/layout/screen/container/visual structure for EvenHub/TestApp glasses UI.
- Exclude non-UI tasks (API integrations, storage, CI, release workflows).
- If multiple skills match, use this order: `ui_agent -> even_agent -> architecture` (architecture only for code-change compliance checks).

Sources (local copies)
- SDK README: `testapp/node_modules/@evenrealities/even_hub_sdk/README.md`
- SDK types: `testapp/node_modules/@evenrealities/even_hub_sdk/dist/index.d.ts`
- UI pipeline: `testapp/src/ui`
- Bridge wrapper: `testapp/src/bridge/evenHubBridge.ts`

Local monitoring
- Dev URL for live UI/manual log inspection: `http://localhost:5173`
- Quick availability check from terminal: `curl -I http://localhost:5173`

Supported primitives
- Container models:
  - `ListContainerProperty`
  - `TextContainerProperty`
  - `ImageContainerProperty`
- Rendering/update methods:
  - `createStartUpPageContainer`
  - `rebuildPageContainer`
  - `textContainerUpgrade`
  - `updateImageRawData`

Hard constraints
- Maximum 4 containers per page.
- Exactly one container must have `isEventCapture=1`.
- Coordinate system: origin `(0,0)` top-left, X right, Y down.
- List/Text container ranges:
  - `xPosition: 0-576`, `yPosition: 0-288`
  - `width: 0-576`, `height: 0-288`
  - `borderWidth: 0-5`, `borderRdaius: 0-10`
- Image container ranges:
  - `xPosition: 0-576`, `yPosition: 0-288`
  - `width: 20-200`, `height: 20-100`
- Image delivery constraints:
  - Create image containers first, then send content via `updateImageRawData`.
  - Do not send image updates concurrently; use queue/sequential updates.
  - Avoid high-frequency image pushes due to device memory limits.

What is not native
- No native SVG/vector drawing API.
- No native table/grid widget.
- No free-form primitive shape API (line/rect/path/canvas drawing).

Representation rules
- Frames/blocks:
  - Use list/text containers with `borderWidth`, `borderColor`, `borderRdaius`, `paddingLength`.
- Tables:
  - Simple: represent as list rows in a list container.
  - Complex: pre-render to image and push through `updateImageRawData`.
- Icons/charts/SVG-like visuals:
  - Pre-render externally and deliver as image data via image container updates.

Workflow
1. Classify request as `text`, `list`, `image`, or `mixed`.
2. Build a container plan that stays within 4-container budget.
3. Assign exactly one event-capture container (`isEventCapture=1`).
4. Produce the API sequence:
   - Initial render: `createStartUpPageContainer`
   - Subsequent pages/major changes: `rebuildPageContainer`
   - Text-only delta: `textContainerUpgrade`
   - Image content: `updateImageRawData` (sequential queue)
5. If design exceeds SDK limits, provide an explicit fallback layout and note compromises.

Output contract
- Always return:
  - Container plan (types, positions, sizes, IDs/names)
  - Event-capture assignment
  - API call sequence
  - Tradeoffs/compromises caused by SDK limits

Common pitfalls
- Calling `createStartUpPageContainer` repeatedly after first successful startup.
- Assigning `isEventCapture=1` to more than one container.
- Sending concurrent image updates.
- Promising native SVG/table features that are not supported by the SDK.
