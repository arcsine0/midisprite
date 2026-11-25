import {
  Audio,
  isHtmlInCanvasSupported,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { getModulesAtFrame } from "../../visualizers/modules/planModules";
import { DashboardScene } from "../../visualizers/modules/DashboardScene";
import type { VideoCompositionProps } from "./types";

let warnedAboutPixelationSupport = false;
const GLITCH_OPACITY = [0, 0.9, 0.12, 0.75, 0.05, 1, 0.55, 0.88, 1];
const GLITCH_OFFSET = [0, -5, 4, -3, 3, -1, 0, 0, 0];

export function VideoComposition({
  audioUrl,
  notes,
  tempos,
  modules,
  moduleSegments,
  waveform,
  spectrum,
}: VideoCompositionProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const activeModules = getModulesAtFrame(frame, moduleSegments, modules);
  const segmentIndex = moduleSegments.findIndex(
    (segment) => frame >= segment.startFrame && frame < segment.endFrame,
  );
  const segment = moduleSegments[segmentIndex];
  const previousModules = moduleSegments[segmentIndex - 1]?.modules;
  const moduleEffects = activeModules.map((module, slot) => {
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
      {audioUrl && <Audio src={audioUrl} />}
      {visual}
    </div>
  );
}
