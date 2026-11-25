import type { MidiNote } from "../../core/project/midiProject";
import { SPECTRUM_BANDS } from "../../core/project/audioFeatures";
import { VISUALIZER_ACCENTS } from "../../core/visualPalette";
import { getInstrumentColor, getInstrumentKey } from "../midi/instrumentColors";
import type { ModuleId } from "./registry";

type Props = {
  frame: number;
  id: ModuleId;
  instruments: MidiNote[];
  notes: MidiNote[];
  recentNotes: MidiNote[];
  spectrum: number[];
  spectrumStart: number;
  time: number;
  waveformPoints: string[];
};

export function ModuleChart({
  frame,
  id,
  instruments,
  notes,
  recentNotes,
  spectrum,
  spectrumStart,
  time,
  waveformPoints,
}: Props) {
  const level = (band: number) =>
    Math.max(0, spectrum[spectrumStart + band] ?? 0);

  let chart;
  if (id === "oscillator") {
    chart = (
      <path
        d={`M24 236 L${waveformPoints.join(" L")}`}
        fill="none"
        stroke="#7ef9e5"
        strokeWidth="3"
      />
    );
  } else if (id === "bars") {
    chart = Array.from({ length: SPECTRUM_BANDS }, (_, index) => {
      const value = level(index);
      const height = 16 + value * 238;
      const x = 20 + (index / SPECTRUM_BANDS) * 452;
      return (
        <rect
          key={index}
          fill={VISUALIZER_ACCENTS[index % VISUALIZER_ACCENTS.length]}
          height={height}
          opacity={0.48 + value * 0.52}
          width="8"
          x={x}
          y={370 - height}
        />
      );
    });
  } else if (id === "spectrum") {
    const points = Array.from({ length: SPECTRUM_BANDS * 2 }, (_, index) => {
      const value = level(Math.floor(index / 2));
      const x = 20 + (index / (SPECTRUM_BANDS * 2 - 1)) * 452;
      const y =
        340 -
        value * 220 -
        Math.sin(index * 0.3 + frame / 12) * (2 + value * 12);
      return `${x},${y}`;
    });
    chart = (
      <path
        d={`M${points.join(" L")}`}
        fill="none"
        stroke="#65e7ff"
        strokeWidth="3"
      />
    );
  } else if (id === "orbit") {
    const active = recentNotes.reduce((map, note) => {
      const key = getInstrumentKey(note);
      map.set(key, (map.get(key) ?? 0) + note.velocity);
      return map;
    }, new Map<string, number>());
    chart = (
      <>
        {[54, 100, 146].map((radius) => (
          <circle
            key={radius}
            cx="246"
            cy="246"
            fill="none"
            r={radius}
            stroke="#273640"
          />
        ))}
        {instruments.slice(0, 8).map((note, index) => {
          const angle =
            (index / Math.max(1, Math.min(8, instruments.length))) *
              Math.PI *
              2 -
            Math.PI / 2;
          const key = getInstrumentKey(note);
          const pulse = Math.min(1, active.get(key) ?? 0);
          const x = 246 + Math.cos(angle) * 146;
          const y = 246 + Math.sin(angle) * 146;
          return (
            <g key={key}>
              <line
                stroke={getInstrumentColor(note)}
                strokeOpacity="0.5"
                x1="246"
                x2={x}
                y1="246"
                y2={y}
              />
              <circle
                cx={x}
                cy={y}
                fill={getInstrumentColor(note)}
                r={5 + pulse * 9}
              />
              <circle
                cx={x}
                cy={y}
                fill="none"
                r={12 + pulse * 16}
                stroke={getInstrumentColor(note)}
                strokeOpacity={0.55}
              />
            </g>
          );
        })}
        <circle cx="246" cy="246" fill="#dffefa" r="4" />
      </>
    );
  } else {
    chart = notes.slice(-80).map((note, index) => {
      const x =
        22 + (((note.startSeconds - Math.max(0, time - 8)) % 8) / 8) * 448;
      const y = 96 + ((127 - note.midi) / 127) * 250;
      return (
        <circle
          key={`${note.track}-${note.startSeconds}-${index}`}
          cx={x}
          cy={y}
          fill={getInstrumentColor(note)}
          opacity={0.45 + note.velocity * 0.55}
          r={2 + note.velocity * 4}
        />
      );
    });
  }

  return (
    <svg
      aria-hidden="true"
      className="block h-full w-full"
      viewBox="0 0 492 474"
    >
      {chart}
    </svg>
  );
}
