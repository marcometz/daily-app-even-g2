import { initBridge } from "./initBridge";
import { EvenHubBridge } from "../bridge/evenHubBridge";
import { createRouter } from "../navigation/router";
import { ScreenStack } from "../navigation/stack";
import { createInputDispatcher } from "../input/inputHandlers";
import { MockDataService } from "../services/data/MockDataService";
import { createDashboardScreen } from "../screens/DashboardScreen";
import { RenderPipeline } from "../ui/render/renderPipeline";
import { Logger } from "../utils/logger";

export class AppController {
  private bridge: EvenHubBridge | null = null;
  private readonly logger = new Logger();
  private readonly stack = new ScreenStack();

  async start(): Promise<void> {
    this.logger.info("App starting");

    const dataService = new MockDataService();

    this.bridge = await initBridge();
    const renderer = new RenderPipeline(this.bridge, this.logger);

    const router = createRouter(this.stack, dataService, this.logger);
    this.stack.setRenderer((screen) => renderer.render(screen.getViewModel()));

    const dashboard = createDashboardScreen(router, dataService, this.logger);
    this.stack.push(dashboard);

    const inputDispatcher = createInputDispatcher(this.stack, this.logger);
    this.bridge.onInput((event) => inputDispatcher(event));
  }
}
