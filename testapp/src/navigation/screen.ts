import type { InputEvent } from "../input/keyBindings";
import type { ViewModel } from "../ui/render/renderPipeline";

export interface Screen {
  id: string;
  onEnter(): void;
  onExit(): void;
  onInput(event: InputEvent): void;
  getViewModel(): ViewModel;
}
