export type MidiNote = {
  track: number;
  channel: number;
  program: number;
  midi: number;
  noteName: string;
  velocity: number;
  startSeconds: number;
  durationSeconds: number;
};

export type MidiTempo = {
  time: number;
  bpm: number;
};

export type MidiProject = {
  filename: string;
  durationSeconds: number;
  notes: MidiNote[];
  tempos: MidiTempo[];
};
