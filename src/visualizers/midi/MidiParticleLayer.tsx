import { getInstrumentColor } from "./instrumentColors";
import { getRecentNoteEvents } from "./recentNoteEvents";
import { VISUALIZER_PALETTE } from "../../core/visualPalette";
import type { MidiNote } from "../../core/project/midiProject";

const TAU = Math.PI * 2;
const PARTICLES_PER_NOTE = 5;

type Props = {
  centerX: number;
  centerY: number;
  filterId: string;
  frame: number;
  fps: number;
  notes: MidiNote[];
};

function unit(seed: number) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

export function MidiParticleLayer({
  centerX,
  centerY,
  filterId,
  frame,
  fps,
  notes,
}: Props) {
  const time = frame / fps;
  const events = getRecentNoteEvents(notes, time, 1.3);
  const particles = events.flatMap((note, eventIndex) => {
    const lifetime =
      0.72 + Math.min(note.durationSeconds, 1) * 0.16 + note.velocity * 0.32;
    const age = time - note.startSeconds;
    if (age < 0 || age > lifetime) return [];

    const progress = age / lifetime;
    const opacity = Math.pow(1 - progress, 1.7) * (0.36 + note.velocity * 0.64);
    const phase = note.track * 0.57 + note.program * 0.13 + note.midi * 0.031;
    const baseAngle =
      ((note.midi % 12) / 12) * TAU - Math.PI / 2 + phase * 0.12;

    return Array.from({ length: PARTICLES_PER_NOTE }, (_, particleIndex) => {
      const angle = baseAngle + (particleIndex / PARTICLES_PER_NOTE) * TAU;
      const speed = 165 + note.velocity * 285 + (particleIndex % 2) * 36;
      const drift = phase + particleIndex * 0.71;
      const positionAt = (elapsed: number) => {
        const distance = speed * elapsed;
        return {
          x:
            centerX +
            Math.cos(angle) * distance +
            Math.sin(elapsed * 3.2 + drift) * 17 * elapsed,
          y:
            centerY +
            Math.sin(angle) * distance +
            Math.cos(elapsed * 3.8 + drift) * 14 * elapsed,
        };
      };
      const current = positionAt(age);
      const previous = positionAt(Math.max(0, age - 0.11));

      return {
        key: `${eventIndex}-${particleIndex}`,
        color: getInstrumentColor(note),
        opacity,
        size: (2.6 + note.velocity * 4.4) * (1 - progress * 0.24),
        x: current.x,
        y: current.y,
        tailX: previous.x,
        tailY: previous.y,
      };
    });
  });

  const motes = Array.from({ length: 28 }, (_, index) => {
    const drift = 5 + unit(index + 20) * 24;
    const x = (unit(index) * 1080 + time * drift) % 1080;
    const y =
      (unit(index + 100) * 1920 + Math.sin(time * 0.55 + index) * 18 + 1920) %
      1920;
    const color =
      index % 3 === 0
        ? VISUALIZER_PALETTE.cyan
        : index % 3 === 1
          ? VISUALIZER_PALETTE.lime
          : VISUALIZER_PALETTE.gold;

    return {
      key: index,
      color,
      opacity: 0.08 + (Math.sin(time * 0.7 + index * 2.1) + 1) * 0.055,
      radius: 1.7 + unit(index + 200) * 2.1,
      x,
      y,
    };
  });

  return (
    <g aria-hidden="true">
      {motes.map((mote) => (
        <circle
          cx={mote.x}
          cy={mote.y}
          fill={mote.color}
          key={`mote-${mote.key}`}
          opacity={mote.opacity}
          r={mote.radius}
        />
      ))}
      <g filter={`url(#${filterId})`}>
        {particles.map((particle) => (
          <g key={particle.key}>
            <line
              stroke={particle.color}
              strokeLinecap="round"
              strokeOpacity={particle.opacity * 0.7}
              strokeWidth={particle.size * 0.7}
              x1={particle.tailX}
              x2={particle.x}
              y1={particle.tailY}
              y2={particle.y}
            />
            <circle
              cx={particle.x}
              cy={particle.y}
              fill={particle.color}
              opacity={particle.opacity}
              r={particle.size}
            />
            <circle
              cx={particle.x}
              cy={particle.y}
              fill={VISUALIZER_PALETTE.white}
              opacity={particle.opacity * 0.82}
              r={particle.size * 0.38}
            />
          </g>
        ))}
      </g>
    </g>
  );
}
