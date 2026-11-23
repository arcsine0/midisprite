import type { MidiNote } from "../core/project/midiProject";

export type VisualizerProps = {
  notes: MidiNote[];
  waveform: number[];
  frame: number;
  fps: number;
};
