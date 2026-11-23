import { useState, type ChangeEvent } from "react";
import { synthesizeMidi } from "../audio/synthesizeMidi";
import { parseMidiFile } from "./parseMidi";
import type { ProcessedMidi } from "./types";

type Props = {
  onProcessed: (midi: ProcessedMidi) => void;
};

type ProgressState = {
  percent: number;
  stage: "file" | "midi" | "audio" | "render" | "ready";
};

const PROCESS_STEPS = [
  { id: "file", label: "FILE" },
  { id: "midi", label: "MIDI" },
  { id: "audio", label: "AUDIO" },
  { id: "render", label: "RENDER" },
] as const;

export function MidiImportPanel({ onProcessed }: Props) {
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
      );
      console.info("[Midisprite] Audio synthesis completed", {
        waveformSamples: audio.waveform.length,
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
        disabled={processing}
        id="midi-file"
        name="midi"
        onChange={selectFile}
        title={file?.name}
        type="file"
      />
      <button
        className="btn btn-primary btn-sm w-full"
        disabled={!file || processing}
        onClick={processFile}
        type="button"
      >
        {processing ? "Processing…" : "Process"}
      </button>
      {progress && (
        <div className="space-y-1.5">
          {/* shortcut: Tone.Offline exposes no render progress, replace when synthesis supports progress callbacks. */}
          <progress
            aria-label="MIDI processing"
            aria-valuetext={
              progress.stage === "audio" && progress.percent === 50
                ? "Synthesizing audio, 50% of steps"
                : progress.stage === "render"
                  ? "Rendering offline audio"
                  : `${progress.stage}, ${progress.percent}%`
            }
            className="progress progress-primary h-1.5 w-full"
            max={100}
            value={
              progress.stage === "render" ||
              (progress.stage === "audio" && progress.percent === 50)
                ? undefined
                : progress.percent
            }
          />
          <div className="flex items-center justify-between gap-2">
            <ol aria-label="Processing steps" className="flex gap-2">
              {PROCESS_STEPS.map(({ id, label }) => {
                const active = progress.stage === id;
                const complete =
                  progress.stage === "ready" ||
                  PROCESS_STEPS.findIndex((step) => step.id === id) <
                    PROCESS_STEPS.findIndex(
                      (step) => step.id === progress.stage,
                    );
                return (
                  <li
                    className={`flex items-center gap-1 text-[9px] font-medium tracking-wide ${
                      active
                        ? "text-primary"
                        : complete
                          ? "text-base-content/60"
                          : "text-base-content/30"
                    }`}
                    key={id}
                  >
                    <span
                      aria-hidden="true"
                      className={`size-1.5 rounded-full ${
                        active || complete ? "bg-primary" : "bg-base-content/20"
                      }`}
                    />
                    {label}
                  </li>
                );
              })}
            </ol>
            <span className="font-mono text-[10px] tabular-nums">
              {progress.stage === "render"
                ? "RENDERING"
                : `${progress.percent}%`}
            </span>
          </div>
        </div>
      )}
      {error && (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
