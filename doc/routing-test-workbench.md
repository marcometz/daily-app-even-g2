# Routing Test Workbench

Diese Arbeitsumgebung ermoeglicht reproduzierbare Tests fuer Dashboard-Routing ohne Brille.

## Standard-Checks

```bash
npm --prefix daily-app run build
npm --prefix daily-app run test
```

Gezielter Dashboard-Lauf:

```bash
npm --prefix daily-app run test:dashboard
```

## Reale EvenHub-Payloads erweitern

1. Neue Event-Variante in `daily-app/src/screens/dashboard/__fixtures__/dashboardInputEvents.ts` anlegen.
2. Erwartetes Routing in `daily-app/test/screens/dashboard/resolveDashboardSelection.test.ts` als Testfall ergaenzen.
3. `npm --prefix daily-app run test:dashboard` ausfuehren.

Damit werden neue Device-/Simulator-Payloads direkt regressionssicher.
