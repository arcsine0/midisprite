import {
  Audio,
  isHtmlInCanvasSupported,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { getModulesAtFrame } from "../../visualizers/modules/planModules";
import { DashboardScene } from "../../visualizers/modules/DashboardScene";
import type { VideoCompositionProps } from "./types";

let warnedAboutPixelationSupport = false;
const GLITCH_OPACITY = [0, 0.9, 0.12, 0.75, 0.05, 1, 0.55, 0.88, 1];
const GLITCH_OFFSET = [0, -5, 4, -3, 3, -1, 0, 0, 0];
const GLITCH_OUT_OPACITY = [1, 0.88, 0.55, 1, 0.05, 0.75, 0.12, 0.9, 0];
const MODULE_FLICKER_FRAMES = GLITCH_OPACITY.length + 6;

export function VideoComposition({
  audioUrl,
  filename,
  notes,
  tempos,
  modules,
  moduleSegments,
  waveform,
  spectrum,
}: VideoCompositionProps) {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const activeModules = getModulesAtFrame(frame, moduleSegments, modules);
  const segmentIndex = moduleSegments.findIndex(
    (segment) => frame >= segment.startFrame && frame < segment.endFrame,
  );
  const segment = moduleSegments[segmentIndex];
  const previousModules = moduleSegments[segmentIndex - 1]?.modules;
  const outroStart = durationInFrames - MODULE_FLICKER_FRAMES;
  const moduleEffects = activeModules.map((module, slot) => {
    if (audioUrl && frame < MODULE_FLICKER_FRAMES) {
      const transitionFrame = frame - slot * 2;
      return {
        opacity: GLITCH_OPACITY[transitionFrame] ?? 0,
        offset: GLITCH_OFFSET[transitionFrame] ?? 0,
      };
    }
    if (audioUrl && frame >= outroStart) {
      const transitionFrame = frame - outroStart - slot * 2;
      if (transitionFrame < 0) return { opacity: 1, offset: 0 };
      return {
        opacity: GLITCH_OUT_OPACITY[transitionFrame] ?? 0,
        offset: GLITCH_OFFSET[transitionFrame] ?? 0,
      };
    }
    const changed = !previousModules || module !== previousModules[slot];
    if (!segment || !changed) return { opacity: 1, offset: 0 };
    const transitionFrame = frame - segment.startFrame - slot * 2;
    if (transitionFrame < 0) return { opacity: 0, offset: 0 };
    return {
      opacity: GLITCH_OPACITY[transitionFrame] ?? 1,
      offset: GLITCH_OFFSET[transitionFrame] ?? 0,
    };
  });
  const pixelationSupported = isHtmlInCanvasSupported();
  const audioFadeFrames = Math.min(
    Math.ceil(fps * 0.5),
    Math.floor((durationInFrames - 1) / 2),
  );
  const audioVolume = audioFadeFrames
    ? Math.min(
        interpolate(frame, [0, audioFadeFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        interpolate(
          frame,
          [durationInFrames - audioFadeFrames - 1, durationInFrames - 1],
          [1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        ),
      )
    : 1;
  const visual = (
    <div
      style={{
        alignItems: "center",
        backgroundColor: "#04080c",
        height: "100%",
        overflow: "hidden",
        position: "relative",
        width: "100%",
      }}
    >
      <DashboardScene
        durationInFrames={durationInFrames}
        filename={filename}
        frame={frame}
        fps={fps}
        modules={activeModules}
        moduleEffects={moduleEffects}
        notes={notes}
        tempos={tempos}
        waveform={waveform}
        spectrum={spectrum}
        pixelationSupported={pixelationSupported}
      />
    </div>
  );
  if (!pixelationSupported && !warnedAboutPixelationSupport) {
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
      {audioUrl && <Audio src={audioUrl} volume={audioVolume} />}
      {visual}
    </div>
  );
}
