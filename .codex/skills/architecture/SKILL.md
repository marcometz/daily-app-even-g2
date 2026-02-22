# ArchitectureAgent

Purpose
- Understand and enforce the Daily App folder, component, screen, and service architecture.
- Review changes for layering violations and missing responsibilities.

Scope of knowledge
- Project: daily-app/src
- Structure:
  - app/: appController, initBridge
  - bridge/: EvenHub bridge wrapper + types + bridge-facing adapters
  - navigation/: Screen interface, stack, router
  - input/: EvenHub event mapping + input dispatch
  - screens/: Dashboard, List, Detail, ActionsOverlay
  - ui/: components, layout, render pipeline
  - services/: data + storage
  - state/: store (if used)
  - utils/: clamp, logger

Rules to enforce
- UI containers are created only via `ui/render/renderPipeline`.
- Runtime SDK calls are only allowed under `src/bridge/`.
- Runtime SDK calls are not allowed in `services/`, `screens/`, `ui/`, or demo/legacy entry paths like `main.js`.
- Bridge layer must expose interfaces/adapters for storage/device/event usage by other layers.
- Services consume bridge interfaces; services must not import SDK directly.
- Screens return ViewModels; they do not call bridge/SDK directly.
- Input mapping happens only in `input/evenHubEventMapper.ts`.
- Navigation changes happen only via `navigation/router.ts` and stack.
- Event subscriptions must be cleanup-capable (`connect`/`disconnect`, unsubscribe lifecycle).
- Test-first requirement for code changes:
  - Every changed/new method must have automated test coverage (new test or updated test).
  - Every changed/new feature flow must have automated scenario coverage (happy path + edge/error + regression).

Review checklist
- New files are placed in the correct layer folder.
- No direct SDK imports outside `src/bridge/`.
- Bridge APIs are injected into other layers via interfaces/adapters.
- Screens only use DataService and Router, not SDK.
- ViewModel composition stays under `ui/components`.
- Layout rules: max 4 containers, exactly 1 event capture.
- DoubleClick maps to Back everywhere.
- Subscription cleanup/unsubscribe handling exists for long-lived listeners.
- Demo/legacy files that still call SDK directly are flagged as technical debt.
- Tests are added/updated for changed methods and changed features.
- Build and test command results are reported; if tests were blocked, missing coverage is listed explicitly.

Common violations
- Direct SDK imports in services/components/screens.
- Rebuild/startup calls from multiple non-bridge locations.
- Mixed input mapping in screens (should map upstream).
- Mixed bridge instances causing duplicated listeners.
- Missing unsubscribe handling for event listeners.

If violations found
- Report file path and line where layering is broken.
- Suggest fix: move logic to the correct layer and call through a bridge interface.
- Mark remaining direct-SDK demo paths as technical debt when not in current scope.
