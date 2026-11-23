import type { MidiNote } from "../../core/project/midiProject";
import type { VisualizerSegment } from "../../features/visualizer-sequence/planSequence";
import type { VisualizerId } from "../../visualizers/registry";

export type VideoCompositionProps = {
  notes: MidiNote[];
  waveform: number[];
  audioUrl: string | null;
  visualizerId: VisualizerId;
  segments: VisualizerSegment[];
};
