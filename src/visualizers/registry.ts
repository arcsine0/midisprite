export const visualizerRegistry = [
  { id: "bars", label: "Bar Visualizer", group: "Waveform" },
  { id: "oscillator", label: "Oscilloscope", group: "Waveform" },
  { id: "radial-bars", label: "Radial Bars", group: "Waveform" },
  { id: "instrument-lanes", label: "Instrument Lanes", group: "MIDI" },
  { id: "note-orbit", label: "Note Orbit", group: "MIDI" },
  { id: "spectrum-notes", label: "Spectrum Notes", group: "Mixed" },
] as const;

export type VisualizerId = (typeof visualizerRegistry)[number]["id"];

export function getVisualizerLabel(id: VisualizerId) {
  return (
    visualizerRegistry.find((visualizer) => visualizer.id === id)?.label ??
    "Bar Visualizer"
  );
}
