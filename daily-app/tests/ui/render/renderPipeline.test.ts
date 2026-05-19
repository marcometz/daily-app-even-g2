import { describe, expect, it, vi } from "vitest";
import { RenderPipeline, type ViewModel } from "../../../src/ui/render/renderPipeline";
import type { EvenHubBridge } from "../../../src/bridge/evenHubBridge";
import type { Logger } from "../../../src/utils/logger";

function createBridgeStub() {
  return {
    createStartup: vi.fn().mockResolvedValue(true),
    rebuild: vi.fn().mockResolvedValue(true),
    updateText: vi.fn().mockResolvedValue(true),
    updateImage: vi.fn().mockResolvedValue(true),
  };
}

function createLoggerStub(): Logger {
  return {
    debug: vi.fn(),
    info: vi.fn(),
  } as unknown as Logger;
}

describe("RenderPipeline", () => {
  it("pushes image raw data after startup creates image containers", async () => {
    const bridge = createBridgeStub();
    const logger = createLoggerStub();
    const pipeline = new RenderPipeline(bridge as unknown as EvenHubBridge, logger);
    const viewModel: ViewModel = {
      title: "Image",
      containers: [
        {
          type: "image",
          id: "image-1",
          imageData: [1, 2, 3],
          width: 120,
          height: 80,
        },
      ],
    };

    await pipeline.render(viewModel);

    expect(bridge.createStartup).toHaveBeenCalledWith({
      containerTotalNum: 1,
      imageObject: [
        {
          xPosition: 0,
          yPosition: 0,
          width: 120,
          height: 80,
          containerID: 10,
          containerName: "img-1",
        },
      ],
    });
    expect(bridge.updateImage).toHaveBeenCalledWith({
      containerID: 10,
      containerName: "img-1",
      imageData: [1, 2, 3],
    });
  });

  it("pushes image updates sequentially after rebuild", async () => {
    const bridge = createBridgeStub();
    const logger = createLoggerStub();
    const pipeline = new RenderPipeline(bridge as unknown as EvenHubBridge, logger);
    const textViewModel: ViewModel = {
      title: "Text",
      containers: [{ type: "text", id: "text", content: "hello", eventCapture: 1 }],
    };
    const imageViewModel: ViewModel = {
      title: "Images",
      containers: [
        { type: "image", id: "image-1", imageData: [1] },
        { type: "image", id: "image-2", imageData: [2] },
      ],
    };

    await pipeline.render(textViewModel);
    await pipeline.render(imageViewModel);

    expect(bridge.rebuild).toHaveBeenCalledTimes(1);
    expect(bridge.updateImage).toHaveBeenNthCalledWith(1, {
      containerID: 10,
      containerName: "img-1",
      imageData: [1],
    });
    expect(bridge.updateImage).toHaveBeenNthCalledWith(2, {
      containerID: 11,
      containerName: "img-2",
      imageData: [2],
    });
  });
});
