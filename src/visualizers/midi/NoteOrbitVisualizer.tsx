import programNames from "../../../assets/audio/samples/FluidR3_GM/names.json";
import { getInstrumentColor, getInstrumentKey } from "./instrumentColors";
import { NeonGlowDefs } from "../NeonGlowDefs";
import type { VisualizerProps } from "../types";

export function NoteOrbitVisualizer({ notes, frame, fps }: VisualizerProps) {
  const time = frame / fps;
  const instruments = Array.from(
    new Map(notes.map((note) => [getInstrumentKey(note), note])).values(),
  );
  const centerX = 540;
  const centerY = 960;

  return (
    <svg aria-hidden="true" viewBox="0 0 1080 1920" className="h-full w-full">
      <defs>
        <NeonGlowDefs id="orbit-glow" />
      </defs>
      {[180, 360, 540].map((radius) => (
        <circle
          cx={centerX}
          cy={centerY}
          fill="none"
          key={radius}
          r={radius}
          stroke="#18302b"
          strokeWidth="3"
        />
      ))}
      {instruments.map((instrument, index) => {
        const key = getInstrumentKey(instrument);
        const angle = (index / instruments.length) * Math.PI * 2 - Math.PI / 2;
        const anchorRadius = 540;
        const x = centerX + Math.cos(angle) * anchorRadius;
        const y = centerY + Math.sin(angle) * anchorRadius;
        const color = getInstrumentColor(instrument);
        const activeNotes = notes.filter(
          (note) =>
            getInstrumentKey(note) === key &&
            time >= note.startSeconds &&
            time < note.startSeconds + note.durationSeconds,
        );
        const label =
          instrument.channel === 9
            ? "DRUMS"
            : (programNames[instrument.program] ?? "Instrument")
                .replaceAll("_", " ")
                .toUpperCase();

        return (
          <g key={key}>
            <line
              stroke={color}
              strokeOpacity={activeNotes.length ? 0.6 : 0.12}
              strokeWidth={activeNotes.length ? 6 : 2}
              x1={centerX}
              x2={x}
              y1={centerY}
              y2={y}
            />
            <circle
              cx={x}
              cy={y}
              filter="url(#orbit-glow)"
              fill={activeNotes.length ? color : "#0c1714"}
              r={activeNotes.length ? 24 : 14}
              stroke={color}
              strokeWidth="5"
            />
            <text
              fill={activeNotes.length ? "#effff6" : "#52645d"}
              fontFamily="monospace"
              fontSize="16"
              textAnchor="middle"
              x={x}
              y={y + 48}
            >
              {label.slice(0, 14)}
            </text>
            {activeNotes.map((note) => {
              const noteAngle = angle + ((note.midi % 12) / 12) * Math.PI * 2;
              const radius = 70 + ((note.midi - 24) / 96) * 180;
              const noteX = x + Math.cos(noteAngle) * radius;
              const noteY = y + Math.sin(noteAngle) * radius;

              return (
                <g
                  filter="url(#orbit-glow)"
                  key={`${note.startSeconds}-${note.midi}`}
                >
                  <line
                    stroke={color}
                    strokeOpacity={0.25 + note.velocity * 0.75}
                    strokeWidth="4"
                    x1={x}
                    x2={noteX}
                    y1={y}
                    y2={noteY}
                  />
                  <circle
                    cx={noteX}
                    cy={noteY}
                    fill="#ffffff"
                    r={7 + note.velocity * 14}
                  />
                </g>
              );
            })}
          </g>
        );
      })}
      <circle cx={centerX} cy={centerY} fill="#00f1d5" r="6" />
    </svg>
  );
}
