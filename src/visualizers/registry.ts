export const visualizerRegistry = [
  { id: "waveform", label: "Waveform" },
  { id: "oscillator", label: "Oscillator" },
  { id: "radial-bars", label: "Radial bars" },
] as const;

export type VisualizerId = (typeof visualizerRegistry)[number]["id"];

export function getVisualizerLabel(id: VisualizerId) {
  return (
    visualizerRegistry.find((visualizer) => visualizer.id === id)?.label ??
    "Waveform"
  );
}
