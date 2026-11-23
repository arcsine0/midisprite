import { Audio, useCurrentFrame, useVideoConfig } from "remotion";
import { getVisualizerAtFrame } from "../../features/visualizer-sequence/planSequence";
import { VisualizerScene } from "../../visualizers/VisualizerScene";
import type { VideoCompositionProps } from "./types";

export function VideoComposition({
  audioUrl,
  notes,
  segments,
  visualizerId,
  waveform,
}: VideoCompositionProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const activeVisualizer = getVisualizerAtFrame(frame, segments, visualizerId);

  return (
    <div
      style={{
        alignItems: "center",
        backgroundColor: "#10131b",
        color: "#f4f1de",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        width: "100%",
      }}
    >
      {audioUrl && <Audio src={audioUrl} />}
      {notes.length === 0 ? (
        <div
          style={{
            color: "#a6adbb",
            fontFamily: "system-ui, sans-serif",
            fontSize: 28,
          }}
        >
          NO MIDI
        </div>
      ) : (
        <VisualizerScene
          frame={frame}
          fps={fps}
          notes={notes}
          visualizerId={activeVisualizer}
          waveform={waveform}
        />
      )}
    </div>
  );
}
