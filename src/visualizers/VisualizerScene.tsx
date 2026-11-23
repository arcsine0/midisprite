import type { ComponentType } from "react";
import type { VisualizerId } from "./registry";
import { OscillatorVisualizer } from "./oscillator/OscillatorVisualizer";
import { RadialBarsVisualizer } from "./radial-bars/RadialBarsVisualizer";
import { WaveformVisualizer } from "./waveform/WaveformVisualizer";
import type { VisualizerProps } from "./types";

const renderers: Record<VisualizerId, ComponentType<VisualizerProps>> = {
  waveform: WaveformVisualizer,
  oscillator: OscillatorVisualizer,
  "radial-bars": RadialBarsVisualizer,
};

export function VisualizerScene({
  visualizerId,
  ...props
}: VisualizerProps & { visualizerId: VisualizerId }) {
  const Renderer = renderers[visualizerId];
  return <Renderer {...props} />;
}
