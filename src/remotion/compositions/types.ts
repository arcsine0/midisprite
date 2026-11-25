import type { MidiNote, MidiTempo } from "../../core/project/midiProject";
import type { ModuleSegment } from "../../visualizers/modules/planModules";
import type { ModuleIds } from "../../visualizers/modules/registry";

export type VideoCompositionProps = {
  durationSeconds: number;
  filename: string;
  notes: MidiNote[];
  tempos: MidiTempo[];
  waveform: number[];
  spectrum: number[];
  audioUrl: string | null;
  modules: ModuleIds;
  moduleSegments: ModuleSegment[];
};
