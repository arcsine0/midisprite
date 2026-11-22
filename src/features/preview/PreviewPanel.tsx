import { Player } from "@remotion/player";
import { VideoComposition } from "../../remotion/compositions/VideoComposition";

export function PreviewPanel() {
  return (
    <section aria-label="Preview" className="studio-preview">
      <div className="studio-preview-frame">
        <Player
          component={VideoComposition}
          compositionHeight={1920}
          compositionWidth={1080}
          durationInFrames={300}
          fps={30}
          controls
          style={{ height: "100%", width: "100%" }}
        />
      </div>
    </section>
  );
}
