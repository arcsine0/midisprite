import type { MidiNote } from "../../core/project/midiProject";
import { SPECTRUM_BANDS } from "../../core/project/audioFeatures";
import { VISUALIZER_ACCENTS } from "../../core/visualPalette";
import { getInstrumentColor, getLaunchpadKey } from "../midi/instrumentColors";
import type { ModuleId } from "./registry";

type Props = {
  frame: number;
  beatPulse: number;
  id: ModuleId;
  launchpadPads: MidiNote[];
  maxPitch: number;
  minPitch: number;
  notes: MidiNote[];
  recentNotes: MidiNote[];
  spectrum: number[];
  spectrumStart: number;
  time: number;
  waveformPoints: string[];
};

type CubePoint = { x: number; y: number; z: number; face: number };

const CUBE_ASCII = ".:-=+*#%@0123456789";
const CUBE_FACE_NORMALS = [
  [0, 0, 1],
  [0, 0, -1],
  [-1, 0, 0],
  [1, 0, 0],
  [0, -1, 0],
  [0, 1, 0],
];
const CUBE_FACE_COLORS = [
  "#7ef9e5",
  "#65e7ff",
  "#c2f56a",
  "#44b9d0",
  "#91d9b4",
  "#a8df67",
];
const RADAR_PULSE_SECONDS = 0.8;
const CUBE_POINTS = (() => {
  const points = new Map<string, CubePoint>();
  const addFacePoint = (x: number, y: number, z: number, face: number) => {
    const key = `${x.toFixed(2)}:${y.toFixed(2)}:${z.toFixed(2)}`;
    if (!points.has(key)) points.set(key, { x, y, z, face });
  };
  for (let row = 0; row <= 6; row++) {
    for (let column = 0; column <= 6; column++) {
      const x = -1 + column / 3;
      const y = -1 + row / 3;
      addFacePoint(x, y, 1, 0);
      addFacePoint(x, y, -1, 1);
      addFacePoint(-1, y, x, 2);
      addFacePoint(1, y, x, 3);
      addFacePoint(x, -1, y, 4);
      addFacePoint(x, 1, y, 5);
    }
  }
  return Array.from(points.values());
})();

export function ModuleChart({
  beatPulse,
  frame,
  id,
  launchpadPads,
  maxPitch,
  minPitch,
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
  } else if (id === "beat-pulse") {
    const pulse = beatPulse;
    const rotationY = Math.PI / 4 + time * (Math.PI / 4);
    const rotationX = -Math.PI / 9 + time * (Math.PI / 16);
    const cosineY = Math.cos(rotationY);
    const sineY = Math.sin(rotationY);
    const cosineX = Math.cos(rotationX);
    const sineX = Math.sin(rotationX);
    const asciiCube = CUBE_POINTS.map((point, index) => {
      const x = point.x * cosineY + point.z * sineY;
      const z = -point.x * sineY + point.z * cosineY;
      const y = point.y * cosineX - z * sineX;
      const depth = point.y * sineX + z * cosineX;
      const [normalX, normalY, normalZ] = CUBE_FACE_NORMALS[point.face];
      const rotatedNormalZ =
        normalY * sineX + (-normalX * sineY + normalZ * cosineY) * cosineX;
      const perspective = 1 / (1.9 - depth * 0.42);
      const projectedX = 246 + x * 126 * perspective;
      const projectedY = 236 + y * 126 * perspective;
      const dx = projectedX - 246;
      const dy = projectedY - 236;
      const distance = Math.hypot(dx, dy);
      const push = pulse * 28;
      return {
        depth,
        face: point.face,
        faceDepth: rotatedNormalZ,
        glyph: CUBE_ASCII[(index + Math.floor(time * 3)) % CUBE_ASCII.length],
        x: projectedX + (dx / Math.max(1, distance)) * push,
        y: projectedY + (dy / Math.max(1, distance)) * push,
      };
    }).sort((a, b) => a.depth - b.depth);
    chart = (
      <>
        {asciiCube.map((point, index) => (
          <text
            key={index}
            dominantBaseline="central"
            fill={CUBE_FACE_COLORS[point.face]}
            fillOpacity={0.14 + ((point.faceDepth + 1) / 2) * 0.74}
            fontFamily="monospace"
            fontSize={12 + pulse * 3}
            textAnchor="middle"
            x={point.x}
            y={point.y}
          >
            {point.glyph}
          </text>
        ))}
      </>
    );
  } else if (id === "launchpad") {
    const activity = new Map<string, number>();
    for (const note of recentNotes) {
      const key = getLaunchpadKey(note);
      const energy =
        note.velocity * Math.max(0, 1 - (time - note.startSeconds) / 1.5);
      activity.set(key, Math.min(1, (activity.get(key) ?? 0) + energy));
    }
    chart = Array.from({ length: 16 }, (_, index) => {
      const pad = launchpadPads[index];
      const x = 96 + (index % 4) * 76;
      const y = 88 + Math.floor(index / 4) * 76;
      if (!pad) {
        return (
          <g key={`empty-${index}`}>
            <rect
              fill="#0a141a"
              height="62"
              rx="3"
              stroke="#263740"
              width="62"
              x={x}
              y={y}
            />
            <text
              fill="#425761"
              fontFamily="MatrixType"
              fontSize="10"
              textAnchor="middle"
              x={x + 31}
              y={y + 39}
            >
              {String(index + 1).padStart(2, "0")}
            </text>
          </g>
        );
      }
      const key = getLaunchpadKey(pad);
      const energy = activity.get(key) ?? 0;
      const color =
        pad.channel === 9
          ? VISUALIZER_ACCENTS[pad.midi % VISUALIZER_ACCENTS.length]
          : getInstrumentColor(pad);
      return (
        <g key={key}>
          <rect
            fill={energy ? color : "#0a141a"}
            fillOpacity={energy ? 0.22 + energy * 0.68 : 1}
            height="62"
            rx="3"
            stroke={energy ? color : "#263740"}
            strokeWidth={energy ? 2 + energy * 2 : 1}
            width="62"
            x={x}
            y={y}
          />
          <circle
            cx={x + 52}
            cy={y + 10}
            fill={energy ? color : "#273740"}
            r="3"
          />
          <text
            fill={energy ? "#e8fffa" : "#6d838b"}
            fontFamily="MatrixType"
            fontSize="10"
            textAnchor="middle"
            x={x + 31}
            y={y + 39}
          >
            {pad.channel === 9 ? pad.noteName : `T${pad.track + 1}`}
          </text>
        </g>
      );
    });
  } else if (id === "singer") {
    const singingNotes = recentNotes.filter(isLeadOrVoice);
    const energy = singingNotes.reduce(
      (loudest, note) =>
        Math.max(
          loudest,
          note.velocity * Math.max(0, 1 - (time - note.startSeconds) / 1.5),
        ),
      0,
    );
    const color = singingNotes.length
      ? getInstrumentColor(singingNotes[singingNotes.length - 1])
      : "#65e7ff";
    const floatY = Math.sin(time * Math.PI * 1.3) * 4;
    const shakeX = Math.sin(time * Math.PI * 20) * energy * 2.5;
    const shakeY = Math.sin(time * Math.PI * 26) * energy * 1.5;
    chart = (
      <g transform={`translate(${shakeX} ${floatY + shakeY})`}>
        <circle
          cx="246"
          cy="218"
          fill="#09161d"
          r="104"
          stroke={color}
          strokeOpacity={0.55 + energy * 0.45}
          strokeWidth="3"
        />
        <path
          d="M190 194 L208 202 M284 202 L302 194"
          stroke={color}
          strokeWidth="5"
        />
        <circle cx="207" cy="218" fill={color} r="6" />
        <circle cx="285" cy="218" fill={color} r="6" />
        <rect fill={color} height="7" rx="3" width="18" x="172" y="240" />
        <rect fill={color} height="7" rx="3" width="18" x="302" y="240" />
        {energy > 0.06 ? (
          <ellipse
            cx="246"
            cy="258"
            fill={color}
            rx={14 + energy * 16}
            ry={7 + energy * 20}
          />
        ) : (
          <path
            d="M220 252 Q246 278 272 252"
            fill="none"
            stroke={color}
            strokeWidth="6"
          />
        )}
      </g>
    );
  } else if (id === "orbit") {
    const pitchSpan = Math.max(1, maxPitch - minPitch);
    const sweepAngle = (time * Math.PI) / 2 - Math.PI / 2;
    const sweepStart = sweepAngle - 0.14;
    const sweepEnd = sweepAngle + 0.14;
    const sweepX = 246 + Math.cos(sweepStart) * 146;
    const sweepY = 236 + Math.sin(sweepStart) * 146;
    const sweepEndX = 246 + Math.cos(sweepEnd) * 146;
    const sweepEndY = 236 + Math.sin(sweepEnd) * 146;
    chart = (
      <>
        {[42, 76, 110, 146].map((radius) => (
          <circle
            key={radius}
            cx="246"
            cy="236"
            fill="none"
            r={radius}
            stroke="#273640"
          />
        ))}
        <path d="M100 236 H392 M246 90 V382" stroke="#273640" />
        <path
          d={`M246 236 L${sweepX} ${sweepY} A146 146 0 0 1 ${sweepEndX} ${sweepEndY} Z`}
          fill="#65e7ff"
          fillOpacity="0.12"
        />
        {notes.map((note, index) => {
          const pitch = (note.midi - minPitch) / pitchSpan;
          const angle = pitch * Math.PI * 2 - Math.PI / 2;
          const pulseAge =
            ((((sweepAngle - angle) % (Math.PI * 2)) + Math.PI * 2) %
              (Math.PI * 2)) /
            (Math.PI / 2);
          if (pulseAge > RADAR_PULSE_SECONDS) return null;
          const radius = 146 - (pulseAge / RADAR_PULSE_SECONDS) * 112;
          const x = 246 + Math.cos(angle) * radius;
          const y = 236 + Math.sin(angle) * radius;
          return (
            <g key={`${note.track}-${note.startSeconds}-${note.midi}-${index}`}>
              <circle
                cx={x}
                cy={y}
                fill={getInstrumentColor(note)}
                opacity={
                  (1 - pulseAge / RADAR_PULSE_SECONDS) *
                  (0.3 + note.velocity * 0.7)
                }
                r={1.5 + note.velocity * 3.5}
              />
            </g>
          );
        })}
        <line
          stroke="#7ef9e5"
          strokeOpacity="0.72"
          strokeWidth="2"
          x1="246"
          x2={246 + Math.cos(sweepAngle) * 146}
          y1="236"
          y2={236 + Math.sin(sweepAngle) * 146}
        />
        <circle cx="246" cy="236" fill="#dffefa" r="4" />
      </>
    );
  } else {
    const pitchClasses = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];
    const binCount = maxPitch - minPitch + 1;
    const density = Array.from({ length: binCount }, () => 0);
    for (const note of notes) {
      const age = time - note.startSeconds;
      const bin = note.midi - minPitch;
      if (bin >= 0 && bin < binCount) {
        const attack = Math.max(0, Math.min(1, age / 0.12));
        const tween = attack * attack * (3 - 2 * attack);
        density[bin] += note.velocity * tween * Math.max(0, 1 - age / 8);
      }
    }
    const peak = Math.max(0.001, ...density);
    const plot = { x: 42, y: 96, width: 414, height: 270 };
    const binWidth = plot.width / binCount;
    chart = (
      <>
        {[0.25, 0.5, 0.75, 1].map((level) => (
          <g key={level}>
            <line
              stroke="#273640"
              x1={plot.x}
              x2={plot.x + plot.width}
              y1={plot.y + plot.height * (1 - level)}
              y2={plot.y + plot.height * (1 - level)}
            />
            <text
              fill="#78909b"
              fontFamily="MatrixType"
              fontSize="10"
              textAnchor="end"
              x={plot.x - 6}
              y={plot.y + plot.height * (1 - level) - 3}
            >
              {level.toFixed(2)}
            </text>
          </g>
        ))}
        {density.map((value, index) => {
          const pitch = minPitch + index;
          const intensity = value / peak;
          const height = intensity * plot.height;
          const x = plot.x + index * binWidth;
          return (
            <rect
              key={pitch}
              fill={VISUALIZER_ACCENTS[pitch % VISUALIZER_ACCENTS.length]}
              fillOpacity={0.36 + intensity * 0.64}
              height={height}
              width={Math.max(0.75, binWidth - 1)}
              x={x + 0.5}
              y={plot.y + plot.height - height}
            />
          );
        })}
        {density.map((_, index) => {
          const pitch = minPitch + index;
          if (pitch % 12 !== 0) return null;
          return (
            <text
              key={`octave-${pitch}`}
              fill="#9aabb0"
              fontFamily="MatrixType"
              fontSize="10"
              textAnchor="middle"
              x={plot.x + index * binWidth}
              y={plot.y + plot.height + 18}
            >
              {`${pitchClasses[0]}${Math.floor(pitch / 12) - 1}`}
            </text>
          );
        })}
      </>
    );
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

function isLeadOrVoice(note: MidiNote) {
  // GM programs 52–54 are voice patches; 80–87 are lead synths.
  return (
    note.channel !== 9 &&
    ((note.program >= 80 && note.program <= 87) ||
      (note.program >= 52 && note.program <= 54))
  );
}
