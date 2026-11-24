import type { ComponentType } from "react";
import type { VisualizerId } from "./registry";
import { OscillatorVisualizer } from "./oscillator/OscillatorVisualizer";
import { InstrumentBloomVisualizer } from "./midi/InstrumentBloomVisualizer";
import { PrismBurstVisualizer } from "./midi/PrismBurstVisualizer";
import { LightshowVisualizer } from "./mixed/LightshowVisualizer";
import { RadialBarsVisualizer } from "./radial-bars/RadialBarsVisualizer";
import { BarVisualizer } from "./waveform/BarVisualizer";
import type { VisualizerProps } from "./types";

const renderers: Record<VisualizerId, ComponentType<VisualizerProps>> = {
  bars: BarVisualizer,
  oscillator: OscillatorVisualizer,
  "radial-bars": RadialBarsVisualizer,
  "prism-burst": PrismBurstVisualizer,
  "instrument-bloom": InstrumentBloomVisualizer,
  lightshow: LightshowVisualizer,
};

export function VisualizerScene({
  visualizerId,
  ...props
}: VisualizerProps & { visualizerId: VisualizerId }) {
  const Renderer = renderers[visualizerId];
  return <Renderer {...props} />;
}
