import { getInstrumentColor } from "./instrumentColors";
import { getRecentNoteEvents } from "./recentNoteEvents";
import { NeonGlowDefs } from "../NeonGlowDefs";
import { MidiParticleLayer } from "./MidiParticleLayer";
import { VISUALIZER_PALETTE } from "../../core/visualPalette";
import type { VisualizerProps } from "../types";

const CENTER_X = 540;
const CENTER_Y = 960;
const TAU = Math.PI * 2;

export function PrismBurstVisualizer({ notes, frame, fps }: VisualizerProps) {
  const time = frame / fps;
  const events = getRecentNoteEvents(notes, time, 1.1);
  const latest = events.reduce(
    (value, note) => Math.max(value, 1 - (time - note.startSeconds) / 1.1),
    0,
  );

  return (
    <svg aria-hidden="true" viewBox="0 0 1080 1920" className="h-full w-full">
      <defs>
        <NeonGlowDefs id="prism-glow" />
        <radialGradient id="prism-core">
          <stop offset="0%" stopColor={VISUALIZER_PALETTE.white} />
          <stop offset="34%" stopColor={VISUALIZER_PALETTE.gold} />
          <stop offset="72%" stopColor={VISUALIZER_PALETTE.amber} />
          <stop
            offset="100%"
            stopColor={VISUALIZER_PALETTE.cyan}
            stopOpacity="0.08"
          />
        </radialGradient>
      </defs>
      {[330, 520, 720].map((radius) => (
        <circle
          cx={CENTER_X}
          cy={CENTER_Y}
          fill="none"
          key={radius}
          r={radius + latest * 32}
          stroke={
            radius === 520 ? VISUALIZER_PALETTE.gold : VISUALIZER_PALETTE.cyan
          }
          strokeOpacity={0.12 + latest * 0.36}
          strokeWidth={2 + latest * 3}
        />
      ))}
      {events.map((note) => {
        const age = time - note.startSeconds;
        const progress = Math.max(0, Math.min(1, age / 1.1));
        const fade = 1 - progress;
        const angle =
          ((note.midi % 12) / 12) * TAU -
          Math.PI / 2 +
          note.track * 0.34 +
          (note.channel === 9 ? Math.PI / 12 : 0);
        const reach = 200 + progress * 360 + note.velocity * 160;
        const innerRadius = 116 + progress * 120;
        const x1 = CENTER_X + Math.cos(angle) * innerRadius;
        const y1 = CENTER_Y + Math.sin(angle) * innerRadius;
        const x2 = CENTER_X + Math.cos(angle) * reach;
        const y2 = CENTER_Y + Math.sin(angle) * reach;
        const color = getInstrumentColor(note);

        return (
          <g
            filter="url(#prism-glow)"
            key={`${note.track}-${note.startSeconds}-${note.midi}`}
          >
            <circle
              cx={CENTER_X + Math.cos(angle) * (reach - 18)}
              cy={CENTER_Y + Math.sin(angle) * (reach - 18)}
              fill="none"
              opacity={fade * 0.62}
              r={18 + progress * 42}
              stroke={color}
              strokeWidth={3 + note.velocity * 5}
            />
            <line
              stroke={color}
              strokeLinecap="square"
              strokeOpacity={0.28 + fade * 0.72}
              strokeWidth={4 + note.velocity * 13}
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
              r={3 + note.velocity * 9}
            />
          </g>
        );
      })}
      <MidiParticleLayer
        centerX={CENTER_X}
        centerY={CENTER_Y}
        filterId="prism-glow"
        frame={frame}
        fps={fps}
        notes={notes}
      />
      <circle
        cx={CENTER_X}
        cy={CENTER_Y}
        fill="url(#prism-core)"
        filter="url(#prism-glow)"
        opacity={0.84 + latest * 0.16}
        r={84 + latest * 34}
      />
      <circle
        cx={CENTER_X}
        cy={CENTER_Y}
        fill="none"
        r={112 + latest * 28}
        stroke="#ffffff"
        strokeOpacity={0.48 + latest * 0.52}
        strokeWidth={5 + latest * 9}
      />
    </svg>
  );
}
