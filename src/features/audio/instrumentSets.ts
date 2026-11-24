import type { MidiNote } from "../../core/project/midiProject";
import programNames from "../../../assets/audio/samples/FluidR3_GM/names.json";

export const instrumentSets = [
  { id: "gm", label: "GM Blend" },
  { id: "arcade", label: "Arcade" },
  { id: "keys", label: "Keys" },
  { id: "guitar", label: "Guitar Band" },
] as const;

export type InstrumentSetId = (typeof instrumentSets)[number]["id"];

const FAMILY_FALLBACKS = [
  "acoustic_grand_piano",
  "celesta",
  "accordion",
  "acoustic_guitar_nylon",
  "electric_bass_finger",
  "violin",
  "cello",
  "choir_aahs",
  "brass_section",
  "whistle",
  "ocarina",
  "lead_1_square",
  "lead_2_sawtooth",
  "lead_6_voice",
  "acoustic_guitar_steel",
  "synth_drum",
] as const;

export function getInstrumentSample(
  note: MidiNote,
  setId: InstrumentSetId,
  availableSamples: ReadonlySet<string>,
) {
  let sample: string;

  if (setId === "arcade") {
    sample = note.midi < 48 ? "synth_bass_1" : "lead_1_square";
  } else if (setId === "keys") {
    sample = note.midi < 48 ? "electric_bass_finger" : "electric_piano_1";
  } else if (setId === "guitar") {
    sample = note.midi < 48 ? "electric_bass_pick" : "acoustic_guitar_nylon";
  } else {
    const original = programNames[note.program];
    sample =
      original && availableSamples.has(original)
        ? original
        : FAMILY_FALLBACKS[Math.floor(note.program / 8)];
  }

  if (!availableSamples.has(sample)) {
    throw new Error(`Missing samples for ${sample.replaceAll("_", " ")}.`);
  }
  return sample;
}
