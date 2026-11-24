import { useEffect, useMemo, useState } from "react";
import { secondsToFrames, VIDEO_FPS } from "../core/timeline/constants";
import { synthesizeMidi } from "../features/audio/synthesizeMidi";
import type { InstrumentSetId } from "../features/audio/instrumentSets";
import { MidiImportPanel } from "../features/midi-import/MidiImportPanel";
import type { ProcessedMidi } from "../features/midi-import/types";
import { planModuleSequence } from "../visualizers/modules/planModules";
import {
  DEFAULT_MODULES,
  type ModuleIds,
} from "../visualizers/modules/registry";
import { PreviewPanel } from "../features/preview/PreviewPanel";
import { VisualizerControls } from "../features/preview/VisualizerControls";

export function App() {
  const [processedMidi, setProcessedMidi] = useState<ProcessedMidi>();
  const [instrumentSetId, setInstrumentSetId] = useState<InstrumentSetId>("gm");
  const [midiProcessing, setMidiProcessing] = useState(false);
  const [instrumentSetBusy, setInstrumentSetBusy] = useState(false);
  const [instrumentSetError, setInstrumentSetError] = useState<string>();
  const [modules, setModules] = useState<ModuleIds>(DEFAULT_MODULES);
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
        ? planModuleSequence(durationInFrames, segmentSeconds * VIDEO_FPS, seed)
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
            modules={modules}
            onModuleChange={(slot, id) =>
              setModules(
                (current) =>
                  current.map((module, index) =>
                    index === slot ? id : module,
                  ) as ModuleIds,
              )
            }
            onRandomizeChange={setRandomize}
            randomize={randomize}
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
            instrumentSetBusy={instrumentSetBusy || midiProcessing}
            instrumentSetError={instrumentSetError}
            instrumentSetId={instrumentSetId}
            seed={seed}
            segmentSeconds={segmentSeconds}
          />
        </div>
      </aside>
      <PreviewPanel
        audioUrl={processedMidi?.audioUrl ?? null}
        durationInFrames={durationInFrames}
        notes={processedMidi?.project.notes ?? []}
        tempos={processedMidi?.project.tempos ?? []}
        modules={modules}
        moduleSegments={segments}
        waveform={processedMidi?.waveform ?? []}
        spectrum={processedMidi?.spectrum ?? []}
      />
    </main>
  );
}
