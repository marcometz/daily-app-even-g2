# ArchitectureAgent

Purpose
- Understand and enforce the TestApp folder, component, screen, and service architecture.
- Review changes for layering violations and missing responsibilities.

Scope of knowledge
- Project: testapp/src
- Structure:
  - app/: appController, initBridge
  - bridge/: EvenHub bridge wrapper + types
  - navigation/: Screen interface, stack, router
  - input/: EvenHub event mapping + input dispatch
  - screens/: Dashboard, List, Detail, ActionsOverlay
  - ui/: components, layout, render pipeline
  - services/: data + storage
  - state/: store (if used)
  - utils/: clamp, logger

Rules to enforce
- UI containers are created only via ui/render/renderPipeline.
- SDK calls are only inside bridge/evenHubBridge.ts.
- Screens return ViewModels; they do not call the bridge directly.
- Input mapping happens only in input/evenHubEventMapper.ts.
- Navigation changes happen only via navigation/router.ts and stack.

Review checklist
- New files placed in correct layer folder.
- No SDK imports outside bridge/.
- Screens only use DataService and Router, not SDK.
- ViewModel composition stays under ui/components.
- Layout rules: max 4 containers, exactly 1 event capture.
- DoubleClick maps to Back everywhere.

Common violations
- Direct SDK calls inside screens or components.
- Rebuild/startup called from multiple places.
- Mixed input mapping in screens (should map upstream).

If violations found
- Report file path and line where layering is broken.
- Suggest fix: move logic to correct layer and call through interface.
