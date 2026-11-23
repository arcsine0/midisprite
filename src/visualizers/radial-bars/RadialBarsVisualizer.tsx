import type { VisualizerProps } from "../types";

const BAR_COUNT = 32;

export function RadialBarsVisualizer({ notes, frame, fps }: VisualizerProps) {
  const time = frame / fps;
  const levels = Array.from({ length: BAR_COUNT }, () => 0);

  for (const note of notes) {
    if (
      time < note.startSeconds ||
      time >= note.startSeconds + note.durationSeconds
    )
      continue;
    const band = Math.max(
      0,
      Math.min(BAR_COUNT - 1, Math.floor((note.midi / 128) * BAR_COUNT)),
    );
    levels[band] = Math.max(levels[band], note.velocity);
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 1080 1920" className="h-full w-full">
      <circle
        cx="540"
        cy="960"
        r="270"
        fill="none"
        stroke="#b8f36b"
        strokeOpacity="0.18"
        strokeWidth="4"
      />
      {levels.map((level, index) => {
        const angle = (index / BAR_COUNT) * Math.PI * 2 - Math.PI / 2;
        const innerRadius = 300;
        const outerRadius = innerRadius + 80 + level * 420;
        return (
          <line
            key={index}
            x1={540 + Math.cos(angle) * innerRadius}
            y1={960 + Math.sin(angle) * innerRadius}
            x2={540 + Math.cos(angle) * outerRadius}
            y2={960 + Math.sin(angle) * outerRadius}
            stroke="#b8f36b"
            strokeLinecap="round"
            strokeOpacity={0.2 + level * 0.8}
            strokeWidth="14"
          />
        );
      })}
    </svg>
  );
}
