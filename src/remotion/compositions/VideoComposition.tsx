import { pixelate } from "@remotion/effects/pixelate";
import {
  Audio,
  HtmlInCanvas,
  isHtmlInCanvasSupported,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { getVisualizerAtFrame } from "../../features/visualizer-sequence/planSequence";
import { VisualizerScene } from "../../visualizers/VisualizerScene";
import type { VideoCompositionProps } from "./types";
import { BackgroundScene } from "../../backgrounds/BackgroundScene";

let warnedAboutPixelationSupport = false;
const pixelationEffects = [pixelate({ blockSize: 4 })];

export function VideoComposition({
  audioUrl,
  notes,
  segments,
  visualizerId,
  waveform,
  spectrum,
  backgroundId,
}: VideoCompositionProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const activeVisualizer = getVisualizerAtFrame(frame, segments, visualizerId);
  const visual = (
    <div
      style={{
        alignItems: "center",
        backgroundColor: "#050812",
        color: "#f4f1de",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        width: "100%",
      }}
    >
      <BackgroundScene
        backgroundId={backgroundId}
        frame={frame}
        fps={fps}
        spectrum={spectrum}
      />
      <div
        style={{
          alignItems: "center",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          position: "relative",
          width: "100%",
          zIndex: 1,
        }}
      >
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
            spectrum={spectrum}
            visualizerId={activeVisualizer}
            waveform={waveform}
          />
        )}
      </div>
    </div>
  );
  const htmlInCanvasSupported = isHtmlInCanvasSupported();

  if (!htmlInCanvasSupported && !warnedAboutPixelationSupport) {
    console.warn(
      "[Midisprite] Pixelation requires Canvas Draw Element support; enable chrome://flags/#canvas-draw-element.",
    );
    warnedAboutPixelationSupport = true;
  }

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
      {htmlInCanvasSupported ? (
        <HtmlInCanvas
          effects={pixelationEffects}
          height={1920}
          width={1080}
          style={{ height: "100%", width: "100%" }}
        >
          {visual}
        </HtmlInCanvas>
      ) : (
        visual
      )}
    </div>
  );
}
