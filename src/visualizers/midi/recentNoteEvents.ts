import type { MidiNote } from "../../core/project/midiProject";

const MAX_VISIBLE_EVENTS = 48;

export function getRecentNoteEvents(
  notes: MidiNote[],
  time: number,
  lifetime = 1.2,
) {
  const cutoff = Math.max(0, time - lifetime);
  let start = 0;
  let end = notes.length;

  while (start < end) {
    const middle = Math.floor((start + end) / 2);
    if (notes[middle].startSeconds < cutoff) start = middle + 1;
    else end = middle;
  }

  const first = start;
  end = notes.length;
  while (start < end) {
    const middle = Math.floor((start + end) / 2);
    if (notes[middle].startSeconds <= time) start = middle + 1;
    else end = middle;
  }

  return notes.slice(Math.max(first, start - MAX_VISIBLE_EVENTS), start);
}
