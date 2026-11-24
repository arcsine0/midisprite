import { SPECTRUM_BANDS } from "../../core/project/audioFeatures";
import { getInstrumentColor } from "../midi/instrumentColors";
import { NeonGlowDefs } from "../NeonGlowDefs";
import type { VisualizerProps } from "../types";

export function SpectrumNotesVisualizer({
  notes,
  spectrum,
  frame,
  fps,
}: VisualizerProps) {
  const time = frame / fps;
  const start = frame * SPECTRUM_BANDS;
  const columnWidth = 1080 / SPECTRUM_BANDS;
  const baseline = 1450;
  const activeNotes = notes.filter(
    (note) =>
      time >= note.startSeconds &&
      time < note.startSeconds + note.durationSeconds,
  );

  return (
    <svg aria-hidden="true" viewBox="0 0 1080 1920" className="h-full w-full">
      <defs>
        <NeonGlowDefs id="spectrum-glow" />
      </defs>
      {Array.from({ length: SPECTRUM_BANDS }, (_, index) => {
        const level = spectrum[start + index] ?? 0;
        const height = level * 720;
        const x = index * columnWidth + columnWidth * 0.18;

        return (
          <rect
            fill="#35e5be"
            filter="url(#spectrum-glow)"
            height={height}
            key={index}
            opacity={0.2 + level * 0.8}
            rx="8"
            width={columnWidth * 0.64}
            x={x}
            y={baseline - height}
          />
        );
      })}
      <line
        stroke="#285c52"
        strokeWidth="4"
        x1="48"
        x2="1032"
        y1={baseline}
        y2={baseline}
      />
      {activeNotes.map((note) => {
        const x = 48 + ((note.midi - 24) / 96) * 984;
        const band = Math.max(
          0,
          Math.min(
            SPECTRUM_BANDS - 1,
            Math.floor(((note.midi - 24) / 96) * SPECTRUM_BANDS),
          ),
        );
        const y = baseline - (spectrum[start + band] ?? 0) * 720;
        const color = getInstrumentColor(note);

        return (
          <g
            filter="url(#spectrum-glow)"
            key={`${note.track}-${note.startSeconds}-${note.midi}`}
          >
            <line
              stroke={color}
              strokeOpacity="0.3"
              strokeWidth="5"
              x1={x}
              x2={x}
              y1={y - 10}
              y2={baseline + 60}
            />
            <circle
              cx={x}
              cy={y - 12}
              fill={color}
              r={7 + note.velocity * 15}
            />
          </g>
        );
      })}
    </svg>
  );
}
