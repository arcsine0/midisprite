import { useEffect, useMemo, useState } from "react";
import { secondsToFrames, VIDEO_FPS } from "../core/timeline/constants";
import { synthesizeMidi } from "../features/audio/synthesizeMidi";
import type { InstrumentSetId } from "../features/audio/instrumentSets";
import { MidiImportPanel } from "../features/midi-import/MidiImportPanel";
import type { ProcessedMidi } from "../features/midi-import/types";
import type { BackgroundId } from "../backgrounds/registry";
import { planVisualizerSequence } from "../features/visualizer-sequence/planSequence";
import { PreviewPanel } from "../features/preview/PreviewPanel";
import { VisualizerControls } from "../features/preview/VisualizerControls";
import type { VisualizerId } from "../visualizers/registry";

export function App() {
  const [processedMidi, setProcessedMidi] = useState<ProcessedMidi>();
  const [instrumentSetId, setInstrumentSetId] = useState<InstrumentSetId>("gm");
  const [midiProcessing, setMidiProcessing] = useState(false);
  const [instrumentSetBusy, setInstrumentSetBusy] = useState(false);
  const [instrumentSetError, setInstrumentSetError] = useState<string>();
  const [visualizerId, setVisualizerId] = useState<VisualizerId>("lightshow");
  const [backgroundId, setBackgroundId] = useState<BackgroundId>("deep-field");
  const [randomize, setRandomize] = useState(false);
  const [segmentSeconds, setSegmentSeconds] = useState(6);
  const [seed, setSeed] = useState(1);

  async function changeInstrumentSet(nextSet: InstrumentSetId) {
    const previousSet = instrumentSetId;
    const project = processedMidi?.project;
    setInstrumentSetId(nextSet);
    setInstrumentSetError(undefined);
    if (!project) return;

    setInstrumentSetBusy(true);
    console.info("[Midisprite] Instrument set change started", {
      from: previousSet,
      to: nextSet,
      notes: project.notes.length,
    });
    try {
      const audio = await synthesizeMidi(project, nextSet);
      setProcessedMidi((current) => {
        if (!current || current.project !== project) {
          URL.revokeObjectURL(audio.audioUrl);
          return current;
        }
        return { ...current, ...audio };
      });
      console.info("[Midisprite] Instrument set change completed", {
        set: nextSet,
      });
    } catch (cause) {
      setInstrumentSetId(previousSet);
      setInstrumentSetError(
        cause instanceof Error
          ? cause.message
          : "Could not update the instrument set.",
      );
      console.error("[Midisprite] Instrument set change failed", cause);
    } finally {
      setInstrumentSetBusy(false);
    }
  }
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
          <MidiImportPanel
            disabled={instrumentSetBusy}
            instrumentSetId={instrumentSetId}
            onProcessed={setProcessedMidi}
            onProcessingChange={setMidiProcessing}
          />
          <VisualizerControls
            onRandomizeChange={setRandomize}
            onInstrumentSetChange={changeInstrumentSet}
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
            instrumentSetBusy={instrumentSetBusy || midiProcessing}
            instrumentSetError={instrumentSetError}
            instrumentSetId={instrumentSetId}
            backgroundId={backgroundId}
            onBackgroundChange={setBackgroundId}
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
        spectrum={processedMidi?.spectrum ?? []}
        backgroundId={backgroundId}
      />
    </main>
  );
}
