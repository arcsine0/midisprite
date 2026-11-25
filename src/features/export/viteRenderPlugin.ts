import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import { z } from "zod";
import type { Plugin } from "vite";
import {
  AUDIO_ANALYSIS_FPS,
  SPECTRUM_BANDS,
  WAVEFORM_SAMPLES_PER_FRAME,
} from "../../core/project/audioFeatures";

const noteSchema = z.object({
  track: z.number().int().nonnegative(),
  channel: z.number().int().nonnegative(),
  program: z.number().int().nonnegative(),
  midi: z.number().int().min(0).max(127),
  noteName: z.string(),
  velocity: z.number().min(0).max(1),
  startSeconds: z.number().finite().nonnegative(),
  durationSeconds: z.number().finite().positive(),
});

const compositionPropsSchema = z
  .object({
    durationSeconds: z.number().finite().nonnegative(),
    filename: z.string().max(512),
    notes: z.array(noteSchema).max(500_000),
    tempos: z.array(
      z.object({
        time: z.number().finite().nonnegative(),
        bpm: z.number().positive(),
      }),
    ),
    waveform: z.array(z.number().finite()),
    spectrum: z.array(z.number().finite()),
    modules: z.array(z.string()).length(4),
    moduleSegments: z.array(
      z.object({
        startFrame: z.number().int().nonnegative(),
        endFrame: z.number().int().positive(),
        modules: z.array(z.string()).length(4),
      }),
    ),
    audioUrl: z.null(),
  })
  .superRefine(({ durationSeconds, waveform, spectrum }, context) => {
    const frames = Math.ceil(durationSeconds * AUDIO_ANALYSIS_FPS);
    const expectedWaveformSamples = frames * WAVEFORM_SAMPLES_PER_FRAME;
    const expectedSpectrumSamples = frames * SPECTRUM_BANDS;
    if (waveform.length !== expectedWaveformSamples) {
      context.addIssue({
        code: "custom",
        path: ["waveform"],
        message: `Expected ${expectedWaveformSamples} samples, received ${waveform.length}.`,
      });
    }
    if (spectrum.length !== expectedSpectrumSamples) {
      context.addIssue({
        code: "custom",
        path: ["spectrum"],
        message: `Expected ${expectedSpectrumSamples} samples, received ${spectrum.length}.`,
      });
    }
  });

type Job = {
  error?: string;
  filename?: string;
  percent: number;
  stage: "prepare" | "render";
  status: "queued" | "rendering" | "complete" | "error";
};

const jobs = new Map<string, Job>();
const MAX_REQUEST_BYTES = 256 * 1024 * 1024;

export function localRenderPlugin(): Plugin {
  let bundlePromise: Promise<string> | undefined;

  return {
    name: "midisprite-local-render",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const url = new URL(request.url ?? "/", "http://localhost");
        const jobMatch = url.pathname.match(/^\/api\/render\/([\da-f-]+)$/i);
        if (request.method === "GET" && jobMatch) {
          const job = jobs.get(jobMatch[1]);
          if (!job)
            return sendJson(response, 404, { error: "Render job not found." });
          return sendJson(response, 200, job);
        }

        if (request.method !== "POST" || url.pathname !== "/api/render") {
          return next();
        }

        try {
          const origin = request.headers.origin;
          if (origin && new URL(origin).host !== request.headers.host) {
            return sendJson(response, 403, {
              error: "Render request origin is invalid.",
            });
          }
          const body = JSON.parse(await readBody(request)) as unknown;
          const requestSchema = z.object({
            audioBase64: z.string().min(1),
            destination: z.string().trim().min(1).max(1024),
            filename: z.string().min(1).max(255),
            inputProps: compositionPropsSchema,
          });
          const parsed = requestSchema.safeParse(body);
          if (!parsed.success) {
            const issues = parsed.error.issues.map(
              ({ path, message }) => `${path.join(".")}: ${message}`,
            );
            console.warn(
              "[Midisprite] Render request validation failed",
              issues,
            );
            return sendJson(response, 400, {
              error: `Render settings are invalid: ${issues.join("; ")}`,
            });
          }
          const { audioBase64, destination, filename, inputProps } =
            parsed.data;
          if (!/^[^<>:"/\\|?*]+\.mp4$/i.test(filename)) {
            return sendJson(response, 400, {
              error: "Output filename must be a valid MP4 name.",
            });
          }
          if (!/^[A-Za-z0-9+/]*={0,2}$/.test(audioBase64)) {
            return sendJson(response, 400, {
              error: "Synthesized audio data is invalid.",
            });
          }

          const id = randomUUID();
          jobs.set(id, { percent: 0, stage: "prepare", status: "queued" });
          sendJson(response, 202, { id });
          void renderJob({
            audioBase64,
            destination,
            filename,
            id,
            inputProps,
            projectRoot: server.config.root,
            getBundlePromise: () => bundlePromise,
            setBundlePromise: (promise) => (bundlePromise = promise),
          });
        } catch (cause) {
          const message =
            cause instanceof Error ? cause.message : "Render request failed.";
          sendJson(response, 400, { error: message });
        }
      });
    },
  };
}

async function renderJob({
  audioBase64,
  destination,
  filename,
  id,
  inputProps,
  projectRoot,
  getBundlePromise,
  setBundlePromise,
}: {
  audioBase64: string;
  destination: string;
  filename: string;
  id: string;
  inputProps: z.infer<typeof compositionPropsSchema>;
  projectRoot: string;
  getBundlePromise: () => Promise<string> | undefined;
  setBundlePromise: (promise: Promise<string>) => void;
}) {
  const update = (change: Partial<Job>) =>
    jobs.set(id, { ...jobs.get(id)!, ...change });
  try {
    const root = resolve(projectRoot);
    const destinationPath = isAbsolute(destination)
      ? resolve(destination)
      : resolve(root, destination);
    await mkdir(destinationPath, { recursive: true });

    update({ percent: 4, stage: "prepare", status: "rendering" });
    const serveUrl = await (getBundlePromise() ??
      createBundle(root, setBundlePromise));
    const audioUrl = `data:audio/wav;base64,${audioBase64}`;
    const resolvedProps = { ...inputProps, audioUrl };
    const composition = await selectComposition({
      serveUrl,
      id: "Midisprite",
      inputProps: resolvedProps,
    });
    update({ percent: 20, stage: "render" });
    const outputPath = resolve(destinationPath, filename);
    await renderMedia({
      serveUrl,
      composition,
      codec: "h264",
      outputLocation: outputPath,
      inputProps: resolvedProps,
      onProgress: ({ progress }) =>
        update({ percent: 20 + Math.round(progress * 75), stage: "render" }),
    });
    update({
      filename: outputPath,
      percent: 100,
      stage: "render",
      status: "complete",
    });
    console.info("[Midisprite] Video render completed", {
      filename: outputPath,
    });
  } catch (cause) {
    const error =
      cause instanceof Error ? cause.message : "Video render failed.";
    update({ error, status: "error" });
    console.error("[Midisprite] Video render failed", { id, error }, cause);
  }
}

function createBundle(
  root: string,
  setBundlePromise: (promise: Promise<string>) => void,
) {
  const promise = bundle({
    entryPoint: resolve(root, "src/remotion/index.tsx"),
  });
  setBundlePromise(promise);
  return promise;
}

async function readBody(request: AsyncIterable<Uint8Array>) {
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.byteLength;
    if (size > MAX_REQUEST_BYTES)
      throw new Error("Render request is too large.");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function sendJson(
  response: NodeJS.WritableStream & {
    statusCode: number;
    setHeader: (name: string, value: string) => void;
    end: (body: string) => void;
  },
  status: number,
  data: unknown,
) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(data));
}
