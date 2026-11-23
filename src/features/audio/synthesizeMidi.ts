import { loaded, Offline, Sampler } from "tone";
import programNames from "../../../assets/audio/samples/FluidR3_GM/names.json";
import type { MidiProject } from "../../core/project/midiProject";

const WAVEFORM_FPS = 30;
const SAMPLE_RATE = 44100;
const sampleAssets = import.meta.glob<string>(
  "../../../assets/audio/samples/FluidR3_GM/*-mp3/*.mp3",
  { import: "default", query: "?url" },
);

export async function synthesizeMidi(
  project: MidiProject,
  onSampleProgress?: (loaded: number, total: number) => void,
  onRenderStart?: () => void,
) {
  const duration = project.durationSeconds + 0.2;
  const programs = new Set(
    project.notes
      .filter((note) => note.channel !== 9)
      .map((note) => note.program),
  );
  const hasDrums = project.notes.some((note) => note.channel === 9);
  const samplerTotal = programs.size + Number(hasDrums);
  let loadedSamplers = 0;
  const onSamplerLoaded = () =>
    onSampleProgress?.(++loadedSamplers, samplerTotal);
  const rendered = await Offline(
    async () => {
      const samplers = new Map<number, Sampler>();
      for (const program of programs) {
        if (!programNames[program]) {
          throw new Error(`Unsupported MIDI instrument: ${program}.`);
        }
        samplers.set(
          program,
          new Sampler(await urlsFor(`${programNames[program]}-mp3`), {
            attack: 0.005,
            release: 0.12,
            onload: onSamplerLoaded,
          }).toDestination(),
        );
      }
      const drums = hasDrums
        ? new Sampler(await urlsFor("drums-mp3"), {
            attack: 0.005,
            release: 0.12,
            onload: onSamplerLoaded,
          }).toDestination()
        : undefined;

      await loaded();
      console.info("[Midisprite] Soundfont buffers decoded", {
        samplers: samplerTotal,
      });

      for (const note of project.notes) {
        if (note.channel === 9) {
          drums?.triggerAttack(note.noteName, note.startSeconds, note.velocity);
        } else {
          samplers
            .get(note.program)
            ?.triggerAttackRelease(
              note.noteName,
              note.durationSeconds,
              note.startSeconds,
              note.velocity,
            );
        }
      }
      console.info("[Midisprite] MIDI audio events scheduled", {
        notes: project.notes.length,
        durationSeconds: project.durationSeconds,
      });
      onRenderStart?.();
      await new Promise((resolve) => setTimeout(resolve, 0));
    },
    duration,
    1,
    SAMPLE_RATE,
  );
  console.info("[Midisprite] Offline audio render completed");

  const audioBuffer = rendered.get();
  if (!audioBuffer) throw new Error("Could not synthesize this MIDI file.");

  const samples = audioBuffer.getChannelData(0);
  const waveform = Array.from(
    { length: Math.ceil(project.durationSeconds * WAVEFORM_FPS) },
    (_, frame) => {
      const start = Math.floor((frame * SAMPLE_RATE) / WAVEFORM_FPS);
      const end = Math.min(samples.length, start + SAMPLE_RATE / WAVEFORM_FPS);
      let peak = 0;
      for (let sample = start; sample < end; sample++) {
        peak = Math.max(peak, Math.abs(samples[sample]));
      }
      return peak;
    },
  );

  return {
    audioUrl: URL.createObjectURL(
      new Blob([encodeWav(samples)], { type: "audio/wav" }),
    ),
    waveform,
  };
}

async function urlsFor(folder: string) {
  const urls: { [note: string]: string; [midi: number]: string } = {};
  await Promise.all(
    Object.entries(sampleAssets)
      .filter(
        ([path]) =>
          path.endsWith(`/${folder}/`) || path.includes(`/${folder}/`),
      )
      .map(async ([path, load]) => {
        urls[path.split("/").at(-1)!.replace(".mp3", "")] = await load();
      }),
  );
  if (Object.keys(urls).length === 0) {
    throw new Error(`Missing local samples for ${folder}.`);
  }
  return urls;
}

function encodeWav(samples: Float32Array) {
  const bytes = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(bytes);
  const writeText = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index++) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  writeText(0, "RIFF");
  view.setUint32(4, bytes.byteLength - 8, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, samples.length * 2, true);

  for (let index = 0; index < samples.length; index++) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    view.setInt16(
      44 + index * 2,
      sample < 0 ? sample * 0x8000 : sample * 0x7fff,
      true,
    );
  }

  return bytes;
}
