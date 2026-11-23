import type { VisualizerProps } from "../types";

export function OscillatorVisualizer({ notes, frame, fps }: VisualizerProps) {
  const time = frame / fps;
  const activeNote = notes
    .filter(
      (note) =>
        time >= note.startSeconds &&
        time < note.startSeconds + note.durationSeconds,
    )
    .reduce<(typeof notes)[number] | undefined>(
      (loudest, note) =>
        !loudest || note.velocity > loudest.velocity ? note : loudest,
      undefined,
    );
  const lastNote =
    activeNote ??
    notes
      .filter((note) => note.startSeconds <= time)
      .reduce<(typeof notes)[number] | undefined>(
        (latest, note) =>
          !latest || note.startSeconds > latest.startSeconds ? note : latest,
        undefined,
      );
  const release =
    lastNote && !activeNote
      ? Math.max(
          0,
          1 - (time - lastNote.startSeconds - lastNote.durationSeconds),
        )
      : 1;
  const cycles = 3 + ((lastNote?.midi ?? 60) % 12);
  const amplitude = 380 * (lastNote?.velocity ?? 0.2) * release;
  const phase = time * Math.PI;
  const points = Array.from({ length: 160 }, (_, index) => {
    const progress = index / 159;
    const x = progress * 1080;
    const y =
      960 + Math.sin(progress * Math.PI * 2 * cycles + phase) * amplitude;
    return `${x},${y}`;
  });

  return (
    <svg aria-hidden="true" viewBox="0 0 1080 1920" className="h-full w-full">
      <path
        d={`M${points.join(" L")}`}
        fill="none"
        stroke="#b8f36b"
        strokeWidth="12"
      />
    </svg>
  );
}
