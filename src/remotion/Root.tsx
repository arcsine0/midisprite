import { Composition } from "remotion";
import { VideoComposition } from "./compositions/VideoComposition";
import type { VideoCompositionProps } from "./compositions/types";
import { DEFAULT_MODULES } from "../visualizers/modules/registry";
import { secondsToFrames, VIDEO_FPS } from "../core/timeline/constants";

const defaultProps: VideoCompositionProps = {
  audioUrl: null,
  durationSeconds: 0,
  filename: "",
  notes: [],
  tempos: [{ time: 0, bpm: 120 }],
  modules: DEFAULT_MODULES,
  moduleSegments: [],
  waveform: [],
  spectrum: [],
};

export function RemotionRoot() {
  return (
    <Composition
      id="Midisprite"
      component={VideoComposition}
      defaultProps={defaultProps}
      durationInFrames={300}
      fps={VIDEO_FPS}
      height={1920}
      width={1080}
      calculateMetadata={({ props }) => ({
        durationInFrames:
          props.durationSeconds > 0
            ? secondsToFrames(props.durationSeconds)
            : 300,
      })}
    />
  );
}
