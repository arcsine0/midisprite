import type { MidiProject } from "../../core/project/midiProject";

export type ProcessedMidi = {
  project: MidiProject;
  audioUrl: string;
  waveform: number[];
  spectrum: number[];
};
