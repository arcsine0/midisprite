import { Player } from "@remotion/player";
import type { MidiNote, MidiTempo } from "../../core/project/midiProject";
import type { ModuleIds } from "../../visualizers/modules/registry";
import type { ModuleSegment } from "../../visualizers/modules/planModules";
import { VideoComposition } from "../../remotion/compositions/VideoComposition";
import { VIDEO_FPS } from "../../core/timeline/constants";

type Props = {
  audioUrl: string | null;
  filename: string;
  durationInFrames: number;
  notes: MidiNote[];
  modules: ModuleIds;
  moduleSegments: ModuleSegment[];
  tempos: MidiTempo[];
  waveform: number[];
  spectrum: number[];
};

export function PreviewPanel({
  audioUrl,
  filename,
  durationInFrames,
  notes,
  modules,
  moduleSegments,
  tempos,
  waveform,
  spectrum,
}: Props) {
  return (
    <section aria-label="Preview" className="studio-preview">
      <div className="studio-preview-frame">
        <Player
          key={audioUrl ?? "placeholder"}
          component={VideoComposition}
          compositionHeight={1920}
          compositionWidth={1080}
          durationInFrames={durationInFrames}
          fps={VIDEO_FPS}
          controls
          inputProps={{
            audioUrl,
            filename,
            notes,
            tempos,
            modules,
            moduleSegments,
            waveform,
            spectrum,
          }}
          style={{ height: "100%", width: "100%" }}
        />
      </div>
    </section>
  );
}
