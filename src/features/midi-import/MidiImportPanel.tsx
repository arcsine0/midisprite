import { useState, type ChangeEvent } from "react";
import { synthesizeMidi } from "../audio/synthesizeMidi";
import { WorkflowProgress } from "../../components/ui/WorkflowProgress";
import type { InstrumentSetId } from "../audio/instrumentSets";
import { parseMidiFile } from "./parseMidi";
import type { ProcessedMidi } from "./types";

type Props = {
  onProcessed: (midi: ProcessedMidi) => void;
  onProcessingChange: (processing: boolean) => void;
  instrumentSetId: InstrumentSetId;
  disabled: boolean;
};

type ProgressState = {
  percent: number;
  stage: "file" | "midi" | "audio" | "render" | "analysis" | "ready";
};

const PROCESS_STEPS = [
  { id: "file", label: "FILE" },
  { id: "midi", label: "MIDI" },
  { id: "audio", label: "AUDIO" },
  { id: "render", label: "RENDER" },
  { id: "analysis", label: "ANALYZE" },
] as const;

export function MidiImportPanel({
  onProcessed,
  onProcessingChange,
  instrumentSetId,
  disabled,
}: Props) {
  const [file, setFile] = useState<File>();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>();
  const [progress, setProgress] = useState<ProgressState>();

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.currentTarget.files?.[0];
    setFile(nextFile);
    setError(undefined);
    setProgress(undefined);
    if (nextFile) {
      console.info("[Midisprite] MIDI file selected", {
        name: nextFile.name,
        sizeBytes: nextFile.size,
      });
    }
  }

  async function processFile() {
    if (!file || processing) return;
    const startedAt = performance.now();
    let stage: ProgressState["stage"] = "file";
    setProcessing(true);
    onProcessingChange(true);
    setError(undefined);
    setProgress({ percent: 5, stage });
    console.info("[Midisprite] MIDI processing started", {
      name: file.name,
      sizeBytes: file.size,
    });

    try {
      const data = await file.arrayBuffer();
      setProgress({ percent: 20, stage });
      console.info("[Midisprite] MIDI file read", {
        sizeBytes: data.byteLength,
        elapsedMs: Math.round(performance.now() - startedAt),
      });

      stage = "midi";
      setProgress({ percent: 25, stage });
      const project = parseMidiFile(file.name, data);
      setProgress({ percent: 45, stage });
      console.info("[Midisprite] MIDI parsed", {
        tracks: new Set(project.notes.map(({ track }) => track)).size,
        notes: project.notes.length,
        tempos: project.tempos.length,
        durationSeconds: project.durationSeconds,
        elapsedMs: Math.round(performance.now() - startedAt),
      });

      stage = "audio";
      setProgress({ percent: 50, stage });
      console.info("[Midisprite] Audio synthesis started", {
        notes: project.notes.length,
        durationSeconds: project.durationSeconds,
      });
      const audio = await synthesizeMidi(
        project,
        instrumentSetId,
        (loaded, total) => {
          const percent = 50 + Math.floor((25 * loaded) / total);
          setProgress({ percent, stage });
          console.info("[Midisprite] Soundfont sampler loaded", {
            loaded,
            total,
            percent,
          });
        },
        () => {
          stage = "render";
          setProgress({ percent: 75, stage });
          console.info("[Midisprite] Offline audio render started", {
            notes: project.notes.length,
            durationSeconds: project.durationSeconds,
          });
        },
        () => {
          stage = "analysis";
          setProgress({ percent: 85, stage });
        },
      );
      console.info("[Midisprite] Audio synthesis completed", {
        waveformSamples: audio.waveform.length,
        spectrumSamples: audio.spectrum.length,
        elapsedMs: Math.round(performance.now() - startedAt),
      });

      setProgress({ percent: 90, stage });
      onProcessed({ project, ...audio });
      stage = "ready";
      setProgress({ percent: 100, stage });
      console.info("[Midisprite] MIDI processing completed", {
        name: file.name,
        elapsedMs: Math.round(performance.now() - startedAt),
      });
    } catch (cause) {
      console.error(
        "[Midisprite] MIDI processing failed",
        {
          name: file.name,
          stage,
          elapsedMs: Math.round(performance.now() - startedAt),
        },
        cause,
      );
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not process this MIDI file.",
      );
    } finally {
      setProcessing(false);
      onProcessingChange(false);
    }
  }

  return (
    <section aria-labelledby="source-heading" className="space-y-3">
      <h2
        className="text-xs font-semibold uppercase tracking-wider text-base-content/60"
        id="source-heading"
      >
        Source
      </h2>
      <label className="label" htmlFor="midi-file">
        MIDI file
      </label>
      <input
        accept=".mid,.midi,audio/midi,audio/x-midi"
        className="file-input file-input-sm w-full"
        disabled={processing || disabled}
        id="midi-file"
        name="midi"
        onChange={selectFile}
        title={file?.name}
        type="file"
      />
      <button
        className="btn btn-primary btn-sm w-full"
        disabled={!file || processing || disabled}
        onClick={processFile}
        type="button"
      >
        {processing ? "Processing…" : "Process"}
      </button>
      {progress && (
        <WorkflowProgress
          activeStep={progress.stage}
          complete={progress.stage === "ready"}
          indeterminate={
            progress.stage === "render" ||
            progress.stage === "analysis" ||
            (progress.stage === "audio" && progress.percent === 50)
          }
          label="MIDI processing"
          percent={progress.percent}
          steps={PROCESS_STEPS}
        />
      )}
      {error && (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
