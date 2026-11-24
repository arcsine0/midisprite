import type { ComponentType } from "react";
import type { VisualizerId } from "./registry";
import { OscillatorVisualizer } from "./oscillator/OscillatorVisualizer";
import { InstrumentLanesVisualizer } from "./midi/InstrumentLanesVisualizer";
import { NoteOrbitVisualizer } from "./midi/NoteOrbitVisualizer";
import { SpectrumNotesVisualizer } from "./mixed/SpectrumNotesVisualizer";
import { RadialBarsVisualizer } from "./radial-bars/RadialBarsVisualizer";
import { BarVisualizer } from "./waveform/BarVisualizer";
import type { VisualizerProps } from "./types";

const renderers: Record<VisualizerId, ComponentType<VisualizerProps>> = {
  bars: BarVisualizer,
  oscillator: OscillatorVisualizer,
  "radial-bars": RadialBarsVisualizer,
  "instrument-lanes": InstrumentLanesVisualizer,
  "note-orbit": NoteOrbitVisualizer,
  "spectrum-notes": SpectrumNotesVisualizer,
};

export function VisualizerScene({
  visualizerId,
  ...props
}: VisualizerProps & { visualizerId: VisualizerId }) {
  const Renderer = renderers[visualizerId];
  return <Renderer {...props} />;
}
