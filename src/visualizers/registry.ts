export const visualizerRegistry = [
  { id: "bars", label: "Bar Visualizer", group: "Waveform" },
  { id: "oscillator", label: "Oscilloscope", group: "Waveform" },
  { id: "radial-bars", label: "Radial Bars", group: "Waveform" },
  { id: "prism-burst", label: "Prism Burst", group: "MIDI" },
  { id: "instrument-bloom", label: "Instrument Bloom", group: "MIDI" },
  { id: "lightshow", label: "Lightshow", group: "Mixed" },
] as const;

export type VisualizerId = (typeof visualizerRegistry)[number]["id"];

export function getVisualizerLabel(id: VisualizerId) {
  return (
    visualizerRegistry.find((visualizer) => visualizer.id === id)?.label ??
    "Bar Visualizer"
  );
}
