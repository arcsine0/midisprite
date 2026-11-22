import { Composition } from "remotion";
import { VideoComposition } from "./compositions/VideoComposition";

export function RemotionRoot() {
  return (
    <Composition
      id="Midisprite"
      component={VideoComposition}
      durationInFrames={300}
      fps={30}
      height={1920}
      width={1080}
    />
  );
}
