import { useEffect, useState, type FormEvent } from "react";
import type { VideoCompositionProps } from "../../remotion/compositions/types";
import { WorkflowProgress } from "../../components/ui/WorkflowProgress";

const RENDER_STEPS = [
  { id: "prepare", label: "PREPARE" },
  { id: "render", label: "RENDER" },
] as const;

type RenderJob = {
  error?: string;
  id?: string;
  filename?: string;
  percent: number;
  stage?: "prepare" | "render";
  status: "queued" | "rendering" | "complete" | "error";
};

type Props = {
  disabled: boolean;
  inputProps: VideoCompositionProps;
};

export function RenderPanel({ disabled, inputProps }: Props) {
  const [destination, setDestination] = useState("output");
  const [job, setJob] = useState<RenderJob>();
  const [rendering, setRendering] = useState(false);
  const [requestError, setRequestError] = useState<string>();
  const [outputFilename, setOutputFilename] = useState(() =>
    makeOutputFilename(inputProps.filename),
  );

  useEffect(() => {
    setOutputFilename(makeOutputFilename(inputProps.filename));
  }, [inputProps.filename]);

  useEffect(() => {
    const jobId = job?.id;
    if (!jobId || !rendering) return;
    let cancelled = false;
    let timeout: number;

    async function poll() {
      try {
        const response = await fetch(`/api/render/${jobId}`);
        if (!response.ok) throw new Error("Could not read render progress.");
        const latest = (await response.json()) as RenderJob;
        if (cancelled) return;
        setJob({ ...latest, id: jobId });
        if (latest.status === "complete" || latest.status === "error") {
          setRendering(false);
          return;
        }
      } catch (cause) {
        if (!cancelled) {
          setRequestError(
            cause instanceof Error ? cause.message : "Render status failed.",
          );
          setRendering(false);
        }
        return;
      }
      timeout = window.setTimeout(poll, 500);
    }

    void poll();
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [job?.filename, rendering]);

  async function startRender(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || rendering || !inputProps.audioUrl) return;
    const filename = makeOutputFilename(inputProps.filename);
    setOutputFilename(filename);
    setRequestError(undefined);
    setRendering(true);
    setJob({ percent: 0, stage: "prepare", status: "queued" });
    console.info("[Midisprite] Video render requested", {
      filename,
      destination,
    });

    try {
      const audio = await fetch(inputProps.audioUrl).then((response) => {
        if (!response.ok) throw new Error("Could not read synthesized audio.");
        return response.arrayBuffer();
      });
      const response = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64: toBase64(audio),
          destination,
          filename,
          inputProps: { ...inputProps, audioUrl: null },
        }),
      });
      const result = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !result.id) {
        throw new Error(result.error ?? "Could not start the render.");
      }
      setJob({ id: result.id, percent: 0, status: "queued" });
    } catch (cause) {
      setRendering(false);
      setRequestError(
        cause instanceof Error ? cause.message : "Could not start the render.",
      );
      console.error("[Midisprite] Video render request failed", cause);
    }
  }

  return (
    <section aria-labelledby="render-heading" className="space-y-3">
      <h2
        className="text-xs font-semibold uppercase tracking-wider text-base-content/60"
        id="render-heading"
      >
        Export
      </h2>
      <form
        action="/api/render"
        aria-labelledby="render-heading"
        method="post"
        onSubmit={startRender}
      >
        <div className="space-y-3">
          <div className="form-control gap-1.5">
            <label className="label" htmlFor="render-destination">
              Destination folder
            </label>
            <input
              autoComplete="off"
              className="input input-sm w-full"
              disabled={rendering}
              id="render-destination"
              maxLength={1024}
              name="destination"
              onChange={(event) => setDestination(event.currentTarget.value)}
              required
              value={destination}
            />
          </div>
          <div className="space-y-1">
            <span className="label">Output file</span>
            <p className="break-all font-mono text-xs text-base-content/70">
              {outputFilename}
            </p>
          </div>
          <button
            className="btn btn-primary btn-sm w-full"
            disabled={disabled || rendering || !inputProps.audioUrl}
            type="submit"
          >
            {rendering ? "Rendering…" : "Render video"}
          </button>
          {rendering && job && (
            <WorkflowProgress
              activeStep={job.stage ?? "prepare"}
              indeterminate={job.status === "queued" || job.stage === "prepare"}
              label={job.stage === "prepare" ? "Preparing render" : "Rendering"}
              percent={job.percent}
              steps={RENDER_STEPS}
            />
          )}
          {job?.status === "complete" && (
            <p className="text-xs text-success" role="status">
              Saved to {job.filename}
            </p>
          )}
          {(requestError || job?.error) && (
            <p className="text-sm text-error" role="alert">
              {requestError ?? job?.error}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}

function makeOutputFilename(filename: string) {
  const stem = filename
    .replace(/\.(mid|midi)$/i, "")
    .replace(/[<>:"/\\|?*]/g, "_");
  const now = new Date();
  const datetime = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    "-",
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
    String(now.getMilliseconds()).padStart(3, "0"),
  ].join("");
  return `${stem || "midisprite"}-${datetime}.mp4`;
}

function toBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(offset, offset + chunkSize),
    );
  }
  return btoa(binary);
}
