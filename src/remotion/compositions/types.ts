import type { MidiNote } from "../../core/project/midiProject";
import type { VisualizerSegment } from "../../features/visualizer-sequence/planSequence";
import type { VisualizerId } from "../../visualizers/registry";
import type { BackgroundId } from "../../backgrounds/registry";

export type VideoCompositionProps = {
  notes: MidiNote[];
  waveform: number[];
  spectrum: number[];
  audioUrl: string | null;
  visualizerId: VisualizerId;
  segments: VisualizerSegment[];
  backgroundId: BackgroundId;
};
