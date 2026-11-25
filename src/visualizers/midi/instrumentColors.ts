import type { MidiNote } from "../../core/project/midiProject";
import {
  VISUALIZER_ACCENTS,
  VISUALIZER_PALETTE,
} from "../../core/visualPalette";

export function getInstrumentColor(note: MidiNote) {
  return note.channel === 9
    ? VISUALIZER_PALETTE.amber
    : VISUALIZER_ACCENTS[note.program % VISUALIZER_ACCENTS.length];
}

export function getInstrumentKey(note: MidiNote) {
  return `${note.track}:${note.channel}:${note.program}`;
}

export function getLaunchpadKey(note: MidiNote) {
  return note.channel === 9 ? `drum:${note.midi}` : getInstrumentKey(note);
}
