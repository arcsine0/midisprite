import type { MidiNote } from "../../core/project/midiProject";

const COLORS = [
  "#50f4d7",
  "#79e849",
  "#f2d94e",
  "#ff9d52",
  "#ff6b91",
  "#ce83ff",
  "#68a9ff",
  "#f4f2e8",
];

export function getInstrumentColor(note: MidiNote) {
  return note.channel === 9 ? "#ffae42" : COLORS[note.program % COLORS.length];
}

export function getInstrumentKey(note: MidiNote) {
  return `${note.track}:${note.channel}:${note.program}`;
}
