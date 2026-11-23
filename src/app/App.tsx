import { useEffect, useMemo, useState } from "react";
import { secondsToFrames, VIDEO_FPS } from "../core/timeline/constants";
import { MidiImportPanel } from "../features/midi-import/MidiImportPanel";
import type { ProcessedMidi } from "../features/midi-import/types";
import { planVisualizerSequence } from "../features/visualizer-sequence/planSequence";
import { PreviewPanel } from "../features/preview/PreviewPanel";
import { VisualizerControls } from "../features/preview/VisualizerControls";
import type { VisualizerId } from "../visualizers/registry";

export function App() {
  const [processedMidi, setProcessedMidi] = useState<ProcessedMidi>();
  const [visualizerId, setVisualizerId] = useState<VisualizerId>("waveform");
  const [randomize, setRandomize] = useState(false);
  const [segmentSeconds, setSegmentSeconds] = useState(6);
  const [seed, setSeed] = useState(1);
  const durationInFrames = processedMidi
    ? secondsToFrames(processedMidi.project.durationSeconds)
    : 300;
  const segments = useMemo(
    () =>
      randomize
        ? planVisualizerSequence(
            durationInFrames,
            segmentSeconds * VIDEO_FPS,
            seed,
          )
        : [],
    [durationInFrames, randomize, segmentSeconds, seed],
  );

  useEffect(() => {
    const audioUrl = processedMidi?.audioUrl;
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [processedMidi?.audioUrl]);

  return (
    <main className="studio-shell" data-theme="dark">
      <aside aria-label="Controls" className="studio-sidebar">
        <header className="studio-brand">
          <h1>Midisprite</h1>
        </header>
        <div className="studio-sidebar-scroll">
          <MidiImportPanel onProcessed={setProcessedMidi} />
          <VisualizerControls
            onRandomizeChange={setRandomize}
            onSeedChange={(value) =>
              setSeed(
                Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 1,
              )
            }
            onSegmentSecondsChange={(value) =>
              setSegmentSeconds(
                Number.isFinite(value)
                  ? Math.min(60, Math.max(1, Math.round(value)))
                  : 6,
              )
            }
            onVisualizerChange={setVisualizerId}
            randomize={randomize}
            seed={seed}
            segmentSeconds={segmentSeconds}
            visualizerId={visualizerId}
          />
        </div>
      </aside>
      <PreviewPanel
        audioUrl={processedMidi?.audioUrl ?? null}
        durationInFrames={durationInFrames}
        notes={processedMidi?.project.notes ?? []}
        randomize={randomize}
        segments={segments}
        visualizerId={visualizerId}
        waveform={processedMidi?.waveform ?? []}
      />
    </main>
  );
}
