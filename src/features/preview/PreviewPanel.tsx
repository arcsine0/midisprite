import { useEffect, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import {
  getVisualizerAtFrame,
  type VisualizerSegment,
} from "../visualizer-sequence/planSequence";
import type { MidiNote } from "../../core/project/midiProject";
import {
  getVisualizerLabel,
  type VisualizerId,
} from "../../visualizers/registry";
import { VideoComposition } from "../../remotion/compositions/VideoComposition";
import type { BackgroundId } from "../../backgrounds/registry";

type Props = {
  audioUrl: string | null;
  durationInFrames: number;
  notes: MidiNote[];
  randomize: boolean;
  segments: VisualizerSegment[];
  visualizerId: VisualizerId;
  waveform: number[];
  spectrum: number[];
  backgroundId: BackgroundId;
};

export function PreviewPanel({
  audioUrl,
  durationInFrames,
  notes,
  randomize,
  segments,
  visualizerId,
  waveform,
  spectrum,
  backgroundId,
}: Props) {
  const playerRef = useRef<PlayerRef>(null);
  const [activeVisualizer, setActiveVisualizer] = useState(visualizerId);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const updateActiveVisualizer = ({
      detail: { frame },
    }: {
      detail: { frame: number };
    }) => {
      const next = getVisualizerAtFrame(frame, segments, visualizerId);
      setActiveVisualizer((current) => (current === next ? current : next));
    };

    player.addEventListener("frameupdate", updateActiveVisualizer);
    updateActiveVisualizer({ detail: { frame: player.getCurrentFrame() } });
    return () =>
      player.removeEventListener("frameupdate", updateActiveVisualizer);
  }, [audioUrl, segments, visualizerId]);

  return (
    <section aria-label="Preview" className="studio-preview">
      <div className="studio-preview-frame">
        {randomize && audioUrl && (
          <span
            aria-live="off"
            className="badge badge-neutral absolute left-3 top-3 z-10"
          >
            {getVisualizerLabel(activeVisualizer)}
          </span>
        )}
        <Player
          key={audioUrl ?? "placeholder"}
          ref={playerRef}
          component={VideoComposition}
          compositionHeight={1920}
          compositionWidth={1080}
          durationInFrames={durationInFrames}
          fps={30}
          controls
          inputProps={{
            audioUrl,
            notes,
            segments,
            visualizerId,
            waveform,
            spectrum,
            backgroundId,
          }}
          style={{ height: "100%", width: "100%" }}
        />
      </div>
    </section>
  );
}
