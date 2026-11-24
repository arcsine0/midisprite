import { Midi } from "@tonejs/midi";
import { z } from "zod";
import type { MidiProject } from "../../core/project/midiProject";

const midiProjectSchema = z.object({
  filename: z.string().min(1),
  durationSeconds: z.number().finite().positive(),
  notes: z
    .array(
      z.object({
        track: z.number().int().nonnegative(),
        channel: z.number().int().nonnegative(),
        program: z.number().int().nonnegative(),
        midi: z.number().int().min(0).max(127),
        noteName: z.string().min(1),
        velocity: z.number().min(0).max(1),
        startSeconds: z.number().finite().nonnegative(),
        durationSeconds: z.number().finite().positive(),
      }),
    )
    .min(1),
  tempos: z.array(
    z.object({
      time: z.number().finite().nonnegative(),
      bpm: z.number().finite().positive(),
    }),
  ),
});

export function parseMidiFile(
  filename: string,
  data: ArrayBuffer,
): MidiProject {
  let midi: Midi;

  try {
    midi = new Midi(data);
  } catch {
    throw new Error("Could not read this MIDI file.");
  }

  const notes = midi.tracks
    .flatMap((track, trackIndex) =>
      track.notes.map((note) => ({
        track: trackIndex,
        channel: track.channel,
        program: track.instrument.number,
        midi: note.midi,
        noteName: note.name,
        velocity: note.velocity,
        startSeconds: note.time,
        durationSeconds: note.duration,
      })),
    )
    .sort((a, b) => a.startSeconds - b.startSeconds);

  const result = midiProjectSchema.safeParse({
    filename,
    durationSeconds: midi.duration,
    notes,
    tempos: midi.header.tempos.map(({ time, bpm }) => ({ time, bpm })),
  });

  if (!result.success) {
    throw new Error(
      notes.length === 0
        ? "No notes found in this MIDI file."
        : "This MIDI file has invalid timing or note data.",
    );
  }

  return result.data;
}
