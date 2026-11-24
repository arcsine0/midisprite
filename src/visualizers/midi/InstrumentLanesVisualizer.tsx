import programNames from "../../../assets/audio/samples/FluidR3_GM/names.json";
import { getInstrumentColor, getInstrumentKey } from "./instrumentColors";
import { NeonGlowDefs } from "../NeonGlowDefs";
import type { VisualizerProps } from "../types";

export function InstrumentLanesVisualizer({
  notes,
  frame,
  fps,
}: VisualizerProps) {
  const time = frame / fps;
  const instruments = Array.from(
    new Map(notes.map((note) => [getInstrumentKey(note), note])).values(),
  );
  const laneHeight = Math.min(116, 1560 / Math.max(1, instruments.length));
  const top = (1920 - laneHeight * instruments.length) / 2;

  return (
    <svg aria-hidden="true" viewBox="0 0 1080 1920" className="h-full w-full">
      <defs>
        <NeonGlowDefs id="lane-glow" />
      </defs>
      {instruments.map((instrument, index) => {
        const key = getInstrumentKey(instrument);
        const y = top + index * laneHeight;
        const activeNotes = notes.filter(
          (note) =>
            getInstrumentKey(note) === key &&
            time >= note.startSeconds &&
            time < note.startSeconds + note.durationSeconds,
        );
        const color = getInstrumentColor(instrument);
        const name =
          instrument.channel === 9
            ? "Drums"
            : (programNames[instrument.program] ?? "Instrument").replaceAll(
                "_",
                " ",
              );

        return (
          <g key={key}>
            <text
              fill={activeNotes.length ? "#effff6" : "#42524b"}
              fontFamily="monospace"
              fontSize={Math.min(26, laneHeight * 0.35)}
              x="72"
              y={y + laneHeight * 0.55}
            >
              {name.toUpperCase()}
            </text>
            <line
              stroke={activeNotes.length ? color : "#26332d"}
              strokeOpacity={activeNotes.length ? 0.8 : 0.5}
              strokeWidth={activeNotes.length ? 5 : 2}
              x1="360"
              x2="1008"
              y1={y + laneHeight / 2}
              y2={y + laneHeight / 2}
            />
            {activeNotes.map((note) => {
              const x = 360 + (note.midi / 127) * 648;
              const width = 12 + note.velocity * 48;

              return (
                <g
                  filter="url(#lane-glow)"
                  key={`${note.startSeconds}-${note.midi}`}
                >
                  <rect
                    fill={color}
                    height={laneHeight * 0.28}
                    opacity={0.24 + note.velocity * 0.76}
                    rx={laneHeight * 0.12}
                    width={width}
                    x={x - width / 2}
                    y={y + laneHeight * 0.36}
                  />
                  <circle
                    cx={x}
                    cy={y + laneHeight / 2}
                    fill="#ffffff"
                    opacity={note.velocity}
                    r={5 + note.velocity * 11}
                  />
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
