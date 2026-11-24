import type { MidiNote } from "../core/project/midiProject";

export type VisualizerProps = {
  notes: MidiNote[];
  waveform: number[];
  spectrum: number[];
  frame: number;
  fps: number;
};
