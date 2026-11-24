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
