import { getInstrumentColor, getInstrumentKey } from "./instrumentColors";
import { getRecentNoteEvents } from "./recentNoteEvents";
import { NeonGlowDefs } from "../NeonGlowDefs";
import { VISUALIZER_PALETTE } from "../../core/visualPalette";
import type { VisualizerProps } from "../types";

const CENTER_X = 540;
const CENTER_Y = 960;
const TAU = Math.PI * 2;

export function InstrumentBloomVisualizer({
  notes,
  frame,
  fps,
}: VisualizerProps) {
  const time = frame / fps;
  const events = getRecentNoteEvents(notes, time, 1.35);
  const instruments = Array.from(
    new Map(notes.map((note) => [getInstrumentKey(note), note])).values(),
  ).slice(0, 8);

  return (
    <svg aria-hidden="true" viewBox="0 0 1080 1920" className="h-full w-full">
      <defs>
        <NeonGlowDefs id="bloom-glow" />
        <radialGradient id="bloom-center">
          <stop offset="0%" stopColor={VISUALIZER_PALETTE.white} />
          <stop offset="30%" stopColor={VISUALIZER_PALETTE.gold} />
          <stop offset="68%" stopColor={VISUALIZER_PALETTE.amber} />
          <stop
            offset="100%"
            stopColor={VISUALIZER_PALETTE.cyan}
            stopOpacity="0.08"
          />
        </radialGradient>
      </defs>
      {[250, 470, 690].map((radius, index) => (
        <circle
          cx={CENTER_X}
          cy={CENTER_Y}
          fill="none"
          key={radius}
          r={radius}
          stroke={index % 2 ? VISUALIZER_PALETTE.gold : VISUALIZER_PALETTE.cyan}
          strokeOpacity={0.14}
          strokeWidth="3"
        />
      ))}
      <circle
        cx={CENTER_X}
        cy={CENTER_Y}
        fill="url(#bloom-center)"
        filter="url(#bloom-glow)"
        opacity="0.94"
        r="94"
      />
      {instruments.map((instrument, index) => {
        const key = getInstrumentKey(instrument);
        const angle = (index / instruments.length) * TAU - Math.PI / 2;
        const anchorRadius = 350;
        const anchorX = CENTER_X + Math.cos(angle) * anchorRadius;
        const anchorY = CENTER_Y + Math.sin(angle) * anchorRadius;
        const color = getInstrumentColor(instrument);
        const instrumentEvents = events.filter(
          (note) => getInstrumentKey(note) === key,
        );
        const pulse = instrumentEvents.reduce(
          (value, note) =>
            Math.max(
              value,
              (1 - (time - note.startSeconds) / 1.35) * note.velocity,
            ),
          0,
        );

        return (
          <g key={key}>
            <line
              stroke={color}
              strokeOpacity={pulse ? 0.34 + pulse * 0.5 : 0.12}
              strokeWidth={2 + pulse * 5}
              x1={CENTER_X}
              x2={anchorX}
              y1={CENTER_Y}
              y2={anchorY}
            />
            <g filter="url(#bloom-glow)">
              {Array.from({ length: 12 }, (_, petal) => {
                const petalAngle =
                  angle +
                  (petal / 12) * TAU +
                  (frame / fps) * (pulse ? 0.22 : 0.08);
                const event =
                  instrumentEvents[
                    petal % Math.max(1, instrumentEvents.length)
                  ];
                const velocity = event?.velocity ?? 0;
                const length = 64 + pulse * 58 + velocity * 52;
                const x1 = anchorX + Math.cos(petalAngle) * 26;
                const y1 = anchorY + Math.sin(petalAngle) * 26;
                const x2 = anchorX + Math.cos(petalAngle) * length;
                const y2 = anchorY + Math.sin(petalAngle) * length;

                return (
                  <line
                    key={petal}
                    stroke={petal % 3 === 0 ? VISUALIZER_PALETTE.white : color}
                    strokeLinecap="round"
                    strokeOpacity={
                      event ? 0.42 + pulse * 0.58 : 0.2 + pulse * 0.22
                    }
                    strokeWidth={event ? 5 + velocity * 8 : 3 + pulse * 3}
                    x1={x1}
                    x2={x2}
                    y1={y1}
                    y2={y2}
                  />
                );
              })}
              {instrumentEvents.map((note) => {
                const age = time - note.startSeconds;
                const fade = Math.max(0, 1 - age / 1.35);
                const petalAngle =
                  angle +
                  ((note.midi % 12) / 12) * TAU +
                  age * (note.channel === 9 ? 0.4 : 0.18);
                const radius = 62 + (1 - fade) * 75 + note.velocity * 40;

                return (
                  <circle
                    cx={anchorX + Math.cos(petalAngle) * radius}
                    cy={anchorY + Math.sin(petalAngle) * radius}
                    fill={VISUALIZER_PALETTE.white}
                    key={`${note.startSeconds}-${note.midi}`}
                    opacity={fade}
                    r={3 + note.velocity * 8}
                  />
                );
              })}
              <circle
                cx={anchorX}
                cy={anchorY}
                fill={color}
                opacity={0.46 + pulse * 0.54}
                r={32 + pulse * 28}
                stroke={VISUALIZER_PALETTE.white}
                strokeOpacity={0.36 + pulse * 0.64}
                strokeWidth={3 + pulse * 4}
              />
            </g>
          </g>
        );
      })}
    </svg>
  );
}
