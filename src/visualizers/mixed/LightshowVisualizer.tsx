import { SPECTRUM_BANDS } from "../../core/project/audioFeatures";
import { getInstrumentColor } from "../midi/instrumentColors";
import { MidiParticleLayer } from "../midi/MidiParticleLayer";
import { getRecentNoteEvents } from "../midi/recentNoteEvents";
import { NeonGlowDefs } from "../NeonGlowDefs";
import { VISUALIZER_PALETTE } from "../../core/visualPalette";
import type { VisualizerProps } from "../types";

const CENTER_X = 540;
const CENTER_Y = 920;
const TAU = Math.PI * 2;

export function LightshowVisualizer({
  notes,
  spectrum,
  frame,
  fps,
}: VisualizerProps) {
  const time = frame / fps;
  const start = frame * SPECTRUM_BANDS;
  const band = (index: number) => Math.max(0, spectrum[start + index] ?? 0);
  const low = [0, 1, 2, 3, 4].reduce((sum, index) => sum + band(index), 0) / 5;
  const mid =
    [8, 9, 10, 11, 12, 13, 14, 15].reduce(
      (sum, index) => sum + band(index),
      0,
    ) / 8;
  const high =
    [24, 25, 26, 27, 28, 29, 30, 31].reduce(
      (sum, index) => sum + band(index),
      0,
    ) / 8;
  const events = getRecentNoteEvents(notes, time, 1.15);
  const hit = events.reduce(
    (value, note) =>
      Math.max(value, (1 - (time - note.startSeconds) / 1.15) * note.velocity),
    0,
  );
  const barCount = 72;
  const ribbons = [
    { offset: -108, phase: 0, color: VISUALIZER_PALETTE.cyan },
    { offset: 0, phase: 1.5, color: VISUALIZER_PALETTE.lime },
    { offset: 108, phase: 3, color: VISUALIZER_PALETTE.gold },
  ];

  return (
    <svg aria-hidden="true" viewBox="0 0 1080 1920" className="h-full w-full">
      <defs>
        <NeonGlowDefs id="lightshow-glow" />
        <radialGradient id="lightshow-core">
          <stop offset="0%" stopColor={VISUALIZER_PALETTE.white} />
          <stop offset="20%" stopColor={VISUALIZER_PALETTE.gold} />
          <stop offset="48%" stopColor={VISUALIZER_PALETTE.amber} />
          <stop offset="76%" stopColor={VISUALIZER_PALETTE.lime} />
          <stop
            offset="100%"
            stopColor={VISUALIZER_PALETTE.cyan}
            stopOpacity="0"
          />
        </radialGradient>
        <linearGradient id="lightshow-ray" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor={VISUALIZER_PALETTE.cyan} />
          <stop offset="52%" stopColor={VISUALIZER_PALETTE.lime} />
          <stop offset="100%" stopColor={VISUALIZER_PALETTE.gold} />
        </linearGradient>
      </defs>
      <circle
        cx={CENTER_X}
        cy={CENTER_Y}
        fill="url(#lightshow-core)"
        filter="url(#lightshow-glow)"
        opacity={0.18 + low * 0.3 + hit * 0.34}
        r={470 + low * 75 + hit * 60}
      />
      {[275, 340, 500].map((radius, index) => (
        <circle
          cx={CENTER_X}
          cy={CENTER_Y}
          fill="none"
          key={radius}
          r={radius + low * (index + 1) * 16 + hit * 22}
          stroke={
            index === 1 ? VISUALIZER_PALETTE.gold : VISUALIZER_PALETTE.cyan
          }
          strokeOpacity={0.12 + low * 0.22 + hit * 0.36}
          strokeWidth={2 + hit * 4}
        />
      ))}
      {Array.from({ length: barCount }, (_, index) => {
        const bandIndex = Math.floor((index / barCount) * SPECTRUM_BANDS);
        const level = band(bandIndex);
        const angle = (index / barCount) * TAU - Math.PI / 2;
        const innerRadius = 210 + low * 28;
        const outerRadius = innerRadius + 65 + Math.pow(level, 0.64) * 450;
        const x1 = CENTER_X + Math.cos(angle) * innerRadius;
        const y1 = CENTER_Y + Math.sin(angle) * innerRadius;
        const x2 = CENTER_X + Math.cos(angle) * outerRadius;
        const y2 = CENTER_Y + Math.sin(angle) * outerRadius;

        return (
          <g key={index}>
            <line
              filter="url(#lightshow-glow)"
              stroke="url(#lightshow-ray)"
              strokeLinecap="square"
              strokeOpacity={0.18 + level * 0.48}
              strokeWidth={12 + level * 9}
              x1={x1}
              x2={x2}
              y1={y1}
              y2={y2}
            />
            <line
              stroke="#f8ffff"
              strokeLinecap="square"
              strokeOpacity={0.22 + level * 0.76}
              strokeWidth={3 + level * 4}
              x1={x1}
              x2={x2}
              y1={y1}
              y2={y2}
            />
          </g>
        );
      })}
      {ribbons.map(({ offset, phase, color }) => {
        const amplitude = 34 + mid * 110 + low * 44;
        const points = Array.from({ length: 72 }, (_, index) => {
          const x = (index / 71) * 1080;
          const wave = Math.sin(
            (index / 71) * Math.PI * 6 + time * 2.1 + phase,
          );
          const detail = Math.sin(
            (index / 71) * Math.PI * 13 - time * 1.4 + phase,
          );
          const y =
            CENTER_Y + offset + wave * amplitude + detail * (12 + high * 25);
          return `${index === 0 ? "M" : "L"}${x},${y}`;
        });

        return (
          <g key={phase}>
            <path
              d={points.join(" ")}
              fill="none"
              filter="url(#lightshow-glow)"
              opacity={0.16 + mid * 0.36 + hit * 0.24}
              stroke={color}
              strokeWidth={24 + hit * 10}
            />
            <path
              d={points.join(" ")}
              fill="none"
              opacity={0.42 + mid * 0.48}
              stroke="#ffffff"
              strokeWidth={3 + high * 4}
            />
          </g>
        );
      })}
      {events.map((note) => {
        const age = time - note.startSeconds;
        const fade = Math.max(0, 1 - age / 1.15);
        const angle =
          ((note.midi % 12) / 12) * TAU - Math.PI / 2 + note.track * 0.29;
        const distance = 255 + age * (250 + note.velocity * 180);
        const x1 = CENTER_X + Math.cos(angle) * 228;
        const y1 = CENTER_Y + Math.sin(angle) * 228;
        const x2 = CENTER_X + Math.cos(angle) * distance;
        const y2 = CENTER_Y + Math.sin(angle) * distance;
        const color = getInstrumentColor(note);

        return (
          <g
            filter="url(#lightshow-glow)"
            key={`${note.track}-${note.startSeconds}-${note.midi}`}
          >
            <line
              stroke={color}
              strokeLinecap="round"
              strokeOpacity={fade * 0.82}
              strokeWidth={3 + note.velocity * 8}
              x1={x1}
              x2={x2}
              y1={y1}
              y2={y2}
            />
            <circle
              cx={x2}
              cy={y2}
              fill="#ffffff"
              opacity={fade}
              r={2 + note.velocity * 6}
            />
          </g>
        );
      })}
      <MidiParticleLayer
        centerX={CENTER_X}
        centerY={CENTER_Y}
        filterId="lightshow-glow"
        frame={frame}
        fps={fps}
        notes={notes}
      />
      <circle
        cx={CENTER_X}
        cy={CENTER_Y}
        fill="url(#lightshow-core)"
        filter="url(#lightshow-glow)"
        opacity={0.8 + low * 0.2 + hit * 0.2}
        r={155 + low * 32 + hit * 35}
      />
      <circle
        cx={CENTER_X}
        cy={CENTER_Y}
        fill="none"
        r={208 + low * 28 + hit * 35}
        stroke="#ffffff"
        strokeOpacity={0.42 + low * 0.52 + hit * 0.32}
        strokeWidth={4 + low * 8 + hit * 7}
      />
    </svg>
  );
}
