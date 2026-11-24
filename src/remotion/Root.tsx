import { Composition } from "remotion";
import { VideoComposition } from "./compositions/VideoComposition";
import type { VideoCompositionProps } from "./compositions/types";
import { DEFAULT_MODULES } from "../visualizers/modules/registry";

const defaultProps: VideoCompositionProps = {
  audioUrl: null,
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
      fps={30}
      height={1920}
      width={1080}
    />
  );
}
