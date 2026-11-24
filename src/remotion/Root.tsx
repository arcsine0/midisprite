import { Composition } from "remotion";
import { VideoComposition } from "./compositions/VideoComposition";
import type { VideoCompositionProps } from "./compositions/types";

const defaultProps: VideoCompositionProps = {
  audioUrl: null,
  notes: [],
  segments: [],
  visualizerId: "bars",
  backgroundId: "deep-field",
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
