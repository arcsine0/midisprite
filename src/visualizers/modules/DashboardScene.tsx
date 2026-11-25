import { useMemo } from "react";
import type { MidiNote, MidiTempo } from "../../core/project/midiProject";
import {
  SPECTRUM_BANDS,
  WAVEFORM_SAMPLES_PER_FRAME,
} from "../../core/project/audioFeatures";
import {
  getInstrumentColor,
  getInstrumentKey,
  getLaunchpadKey,
} from "../midi/instrumentColors";
import { getRecentNoteEvents } from "../midi/recentNoteEvents";
import { ModuleChart } from "./ModuleChart";
import { PixelatedLayer } from "./PixelatedLayer";
import { getModuleLabel, type ModuleId, type ModuleIds } from "./registry";

type Props = {
  frame: number;
  fps: number;
  modules: ModuleIds;
  moduleEffects: { opacity: number; offset: number }[];
  notes: MidiNote[];
  pixelationSupported: boolean;
  tempos: MidiTempo[];
  waveform: number[];
  spectrum: number[];
};

const GRID = "#1a2933";
const MUTED = "#78909b";
const WHITE = "#d6e5e8";
const MODULE_POSITIONS = [
  [48, 132],
  [540, 132],
  [48, 1304],
  [540, 1304],
] as const;
const PANEL_WIDTH = 492;
const PANEL_HEIGHT = 474;
const ROLL = { x: 48, y: 614, width: 984, height: 682 };

function getNotesInRange(
  notes: MidiNote[],
  startTime: number,
  endTime: number,
) {
  let start = 0;
  let end = notes.length;
  while (start < end) {
    const middle = (start + end) >>> 1;
    if (notes[middle].startSeconds < startTime) start = middle + 1;
    else end = middle;
  }
  const first = start;
  end = notes.length;
  while (start < end) {
    const middle = (start + end) >>> 1;
    if (notes[middle].startSeconds <= endTime) start = middle + 1;
    else end = middle;
  }
  return notes.slice(Math.max(first, start - 1000), start);
}

export function DashboardScene({
  frame,
  fps,
  modules,
  moduleEffects,
  notes,
  pixelationSupported,
  tempos,
  waveform,
  spectrum,
}: Props) {
  const time = frame / fps;
  const sampleStart = frame * WAVEFORM_SAMPLES_PER_FRAME;
  let waveformLevel = 0;
  const waveformPoints = Array.from(
    { length: WAVEFORM_SAMPLES_PER_FRAME },
    (_, index) => {
      const sample = waveform[sampleStart + index] ?? 0;
      waveformLevel = Math.max(waveformLevel, Math.abs(sample));
      const x = 24 + (index / (WAVEFORM_SAMPLES_PER_FRAME - 1)) * 426;
      const y = 236 - sample * 160;
      return `${x},${y}`;
    },
  );
  const waveformPeak = (offset: number) => {
    let peak = 0;
    for (
      let index = offset;
      index < offset + WAVEFORM_SAMPLES_PER_FRAME;
      index++
    ) {
      peak = Math.max(peak, Math.abs(waveform[index] ?? 0));
    }
    return peak;
  };
  let beatPulse = 0;
  for (let age = 0; age < 4; age++) {
    const currentFrame = frame - age;
    if (currentFrame <= 0) continue;
    const start = currentFrame * WAVEFORM_SAMPLES_PER_FRAME;
    const attack = Math.max(
      0,
      waveformPeak(start) -
        waveformPeak(start - WAVEFORM_SAMPLES_PER_FRAME) -
        0.025,
    );
    beatPulse = Math.max(
      beatPulse,
      Math.min(1, attack * 16) * Math.exp(-age / 2),
    );
  }
  const spectrumStart = frame * SPECTRUM_BANDS;
  const recentNotes = getRecentNoteEvents(notes, time, 1.5);
  const instrumentCount = useMemo(
    () => new Set(notes.map(getInstrumentKey)).size,
    [notes],
  );
  const launchpadPads = useMemo(() => {
    const pads = new Map<string, MidiNote>();
    for (const note of notes) {
      pads.set(getLaunchpadKey(note), note);
      if (pads.size === 16) break;
    }
    return Array.from(pads.values());
  }, [notes]);
  const maxNoteDuration = useMemo(
    () =>
      notes.reduce(
        (longest, note) => Math.max(longest, note.durationSeconds),
        0,
      ),
    [notes],
  );
  const { minPitch, maxPitch } = useMemo(() => {
    if (notes.length === 0) return { minPitch: 60, maxPitch: 72 };
    const lowest = notes.reduce(
      (pitch, note) => Math.min(pitch, note.midi),
      127,
    );
    const highest = notes.reduce(
      (pitch, note) => Math.max(pitch, note.midi),
      0,
    );
    let minPitch = Math.max(0, lowest - 1);
    let maxPitch = Math.min(127, highest + 1);
    if (maxPitch - minPitch < 12) {
      const center = (lowest + highest) / 2;
      minPitch = Math.max(0, Math.floor(center - 6));
      maxPitch = Math.min(127, minPitch + 12);
      minPitch = Math.max(0, maxPitch - 12);
    }
    return { minPitch, maxPitch };
  }, [notes]);
  const rollStart = Math.max(0, time - 2);
  const rollEnd = rollStart + 8;
  const rollNotes = getNotesInRange(
    notes,
    Math.max(0, rollStart - maxNoteDuration),
    rollEnd,
  ).filter(
    (note) =>
      note.startSeconds + note.durationSeconds > rollStart &&
      note.midi >= minPitch &&
      note.midi <= maxPitch,
  );
  const pitchNotes = getNotesInRange(notes, Math.max(0, time - 8), time);
  const pitchHeight = ROLL.height - 76;
  const pitchCount = maxPitch - minPitch + 1;
  const noteHeight = pitchHeight / pitchCount;
  const playheadX = ((time - rollStart) / 8) * (ROLL.width - 60);
  const tempo = tempos.reduce(
    (current, item) => (item.time <= time ? item.bpm : current),
    120,
  );
  const tempoMap = tempos.length ? tempos : [{ time: 0, bpm: 120 }];
  const beatMarks = tempoMap.flatMap((item, index) => {
    const start = Math.max(rollStart, item.time);
    const nextTempoTime = tempoMap[index + 1]?.time ?? rollEnd;
    const end = Math.min(rollEnd, nextTempoTime);
    const beatSeconds = 60 / item.bpm;
    const firstBeat = Math.ceil((start - item.time) / beatSeconds);
    const count = Math.max(0, Math.ceil((end - start) / beatSeconds) + 1);
    return Array.from({ length: count }, (_, beat) => {
      const beatNumber = firstBeat + beat;
      return {
        time: item.time + beatNumber * beatSeconds,
        strong: beatNumber % 4 === 0,
      };
    }).filter((mark) => mark.time >= start && mark.time < end);
  });

  return (
    <div style={{ height: 1920, position: "relative", width: 1080 }}>
      <svg
        aria-hidden="true"
        className="block h-full w-full"
        style={{ inset: 0, position: "absolute" }}
        viewBox="0 0 1080 1920"
      >
        <defs>
          <linearGradient id="monitor-metal" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#667178" />
            <stop offset="18%" stopColor="#3c474e" />
            <stop offset="72%" stopColor="#29333a" />
            <stop offset="100%" stopColor="#161d22" />
          </linearGradient>
          <filter
            height="140%"
            id="monitor-shadow"
            width="125%"
            x="-12%"
            y="-12%"
          >
            <feDropShadow
              dx="0"
              dy="7"
              floodColor="#000000"
              floodOpacity="0.76"
              stdDeviation="6"
            />
          </filter>
        </defs>
        <rect fill="#04080c" height="1920" width="1080" />
        <text
          fill={WHITE}
          fontFamily="MatrixType Display"
          fontSize="24"
          fontWeight="700"
          x="48"
          y="66"
        >
          MIDISPRITE / SIGNAL ANALYZER
        </text>
        <text
          fill={MUTED}
          fontFamily="MatrixType"
          fontSize="16"
          textAnchor="end"
          x="1032"
          y="66"
        >
          MIDI / {tempo.toFixed(0)} BPM / {time.toFixed(2)} SEC
        </text>
        <line stroke={GRID} strokeWidth="2" x1="48" x2="1032" y1="92" y2="92" />

        {MODULE_POSITIONS.map(([x, y], slot) => (
          <g
            key={slot}
            opacity={moduleEffects[slot].opacity}
            transform={`translate(${x + moduleEffects[slot].offset} ${y})`}
          >
            <ModulePanel
              frame={frame}
              id={modules[slot]}
              activeEventCount={recentNotes.length}
              instrumentCount={instrumentCount}
              launchpadPadCount={launchpadPads.length}
              spectrum={spectrum}
              spectrumStart={spectrumStart}
            />
          </g>
        ))}

        <g transform={`translate(${ROLL.x} ${ROLL.y})`}>
          <path
            d={`M16 0 H${ROLL.width - 16} L${ROLL.width} 16 V${ROLL.height - 16} L${ROLL.width - 16} ${ROLL.height} H16 L0 ${ROLL.height - 16} V16 Z`}
            fill="url(#monitor-metal)"
            filter="url(#monitor-shadow)"
            stroke="#10171b"
            strokeWidth="3"
          />
          <path
            d={`M18 7 H${ROLL.width - 18} L${ROLL.width - 7} 18 V${ROLL.height - 18} L${ROLL.width - 18} ${ROLL.height - 7} H18 L7 ${ROLL.height - 18} V18 Z`}
            fill="none"
            opacity="0.7"
            stroke="#78838a"
            strokeWidth="2"
          />
          <rect
            fill="#141d22"
            height={ROLL.height - 70}
            stroke="#0a1014"
            strokeWidth="3"
            width={ROLL.width - 24}
            x="12"
            y="48"
          />
          <rect
            fill="#050b10"
            height={ROLL.height - 76}
            width={ROLL.width - 32}
            x="20"
            y="50"
          />
          <MonitorScrew x={14} y={14} />
          <MonitorScrew x={ROLL.width - 14} y={14} />
          <MonitorScrew x={14} y={ROLL.height - 14} />
          <MonitorScrew x={ROLL.width - 14} y={ROLL.height - 14} />
          <text
            fill={WHITE}
            fontFamily="MatrixType"
            fontSize="18"
            fontWeight="600"
            x="18"
            y="30"
          >
            PIANO ROLL
          </text>
          <text
            fill={MUTED}
            fontFamily="MatrixType"
            fontSize="14"
            textAnchor="end"
            x={ROLL.width - 18}
            y="30"
          >
            {instrumentCount} PARTS / {notes.length} EVENTS
          </text>
          <g transform="translate(44 50)">
            {Array.from({ length: pitchCount }, (_, index) => {
              const pitch = maxPitch - index;
              const y = index * noteHeight;
              const octave = pitch % 12 === 0;
              return (
                <g key={pitch}>
                  {octave && (
                    <rect
                      fill="#0c151c"
                      height={noteHeight}
                      width={ROLL.width - 60}
                      x="0"
                      y={y}
                    />
                  )}
                  <line
                    stroke={octave ? "#2a3d47" : GRID}
                    strokeWidth={octave ? 1.5 : 1}
                    x1="0"
                    x2={ROLL.width - 60}
                    y1={y + noteHeight}
                    y2={y + noteHeight}
                  />
                  {octave && (
                    <text
                      fill={MUTED}
                      fontFamily="MatrixType"
                      fontSize="13"
                      x="-37"
                      y={y + noteHeight - 2}
                    >{`C${Math.floor(pitch / 12) - 1}`}</text>
                  )}
                </g>
              );
            })}
            {beatMarks.map((mark, index) => {
              const x = ((mark.time - rollStart) / 8) * (ROLL.width - 60);
              return (
                <line
                  key={`${mark.time}-${index}`}
                  stroke={mark.strong ? "#30414a" : GRID}
                  strokeWidth={mark.strong ? 2 : 1}
                  x1={x}
                  x2={x}
                  y1="0"
                  y2={pitchHeight}
                />
              );
            })}
            {rollNotes.map((note, index) => {
              const visibleStart = Math.max(note.startSeconds, rollStart);
              const visibleEnd = Math.min(
                note.startSeconds + note.durationSeconds,
                rollEnd,
              );
              const x = ((visibleStart - rollStart) / 8) * (ROLL.width - 60);
              const width = Math.max(
                3,
                ((visibleEnd - visibleStart) / 8) * (ROLL.width - 60),
              );
              const y = (maxPitch - note.midi) * noteHeight + 1;
              return (
                <rect
                  key={`${note.track}-${note.startSeconds}-${note.midi}-${index}`}
                  fill={getInstrumentColor(note)}
                  height={Math.max(3, noteHeight - 2)}
                  opacity={0.48 + note.velocity * 0.52}
                  rx="1"
                  width={Math.min(width, ROLL.width - 60 - x)}
                  x={x}
                  y={y}
                />
              );
            })}
            <line
              stroke="#f3fbfa"
              strokeOpacity="0.8"
              strokeWidth="2"
              x1={playheadX}
              x2={playheadX}
              y1="0"
              y2={pitchHeight}
            />
            {notes.length === 0 && (
              <text
                fill={MUTED}
                fontFamily="MatrixType"
                fontSize="18"
                textAnchor="middle"
                x={(ROLL.width - 60) / 2}
                y={pitchHeight / 2}
              >
                NO MIDI LOADED
              </text>
            )}
          </g>
          <text
            fill={MUTED}
            fontFamily="MatrixType"
            fontSize="13"
            x="44"
            y={ROLL.height - 12}
          >{`${rollStart.toFixed(1)} SEC`}</text>
          <text
            fill={MUTED}
            fontFamily="MatrixType"
            fontSize="13"
            textAnchor="end"
            x={ROLL.width - 16}
            y={ROLL.height - 12}
          >{`${rollEnd.toFixed(1)} SEC`}</text>
        </g>

        <line
          stroke={GRID}
          strokeWidth="2"
          x1="48"
          x2="1032"
          y1="1790"
          y2="1790"
        />
        <text
          fill={MUTED}
          fontFamily="MatrixType"
          fontSize="14"
          x="48"
          y="1822"
        >{`SIGNAL ${recentNotes.length ? "ACTIVE" : "IDLE"}  /  FRAME ${frame}`}</text>
        <text
          fill={MUTED}
          fontFamily="MatrixType"
          fontSize="14"
          textAnchor="end"
          x="1032"
          y="1822"
        >
          32-BIT DISPLAY
        </text>
      </svg>
      <PixelatedLayer
        height={1920}
        left={0}
        supported={pixelationSupported}
        top={0}
        width={1080}
      >
        <div style={{ height: 1920, position: "relative", width: 1080 }}>
          {MODULE_POSITIONS.map(([left, top], slot) => (
            <div
              key={`module-${slot}`}
              style={{
                height: PANEL_HEIGHT,
                left,
                opacity: moduleEffects[slot].opacity,
                position: "absolute",
                top,
                transform: `translateX(${moduleEffects[slot].offset}px)`,
                width: PANEL_WIDTH,
              }}
            >
              <ModuleChart
                beatPulse={beatPulse}
                frame={frame}
                id={modules[slot]}
                launchpadPads={launchpadPads}
                maxPitch={maxPitch}
                minPitch={minPitch}
                notes={pitchNotes}
                recentNotes={recentNotes}
                spectrum={spectrum}
                spectrumStart={spectrumStart}
                time={time}
                waveformPoints={waveformPoints}
              />
            </div>
          ))}
        </div>
      </PixelatedLayer>
    </div>
  );
}

function ModulePanel({
  activeEventCount,
  frame,
  id,
  instrumentCount,
  launchpadPadCount,
  spectrum,
  spectrumStart,
}: {
  activeEventCount: number;
  frame: number;
  id: ModuleId;
  instrumentCount: number;
  launchpadPadCount: number;
  spectrum: number[];
  spectrumStart: number;
}) {
  return (
    <g>
      <path
        d={`M12 0 H${PANEL_WIDTH - 12} L${PANEL_WIDTH} 12 V${PANEL_HEIGHT - 12} L${PANEL_WIDTH - 12} ${PANEL_HEIGHT} H12 L0 ${PANEL_HEIGHT - 12} V12 Z`}
        fill="url(#monitor-metal)"
        filter="url(#monitor-shadow)"
        stroke="#10171b"
        strokeWidth="3"
      />
      <path
        d={`M17 7 H${PANEL_WIDTH - 17} L${PANEL_WIDTH - 7} 17 V${PANEL_HEIGHT - 17} L${PANEL_WIDTH - 17} ${PANEL_HEIGHT - 7} H17 L7 ${PANEL_HEIGHT - 17} V17 Z`}
        fill="none"
        opacity="0.7"
        stroke="#78838a"
        strokeWidth="2"
      />
      <rect
        fill="#141d22"
        height="354"
        stroke="#0a1014"
        strokeWidth="3"
        width={PANEL_WIDTH - 28}
        x="14"
        y="48"
      />
      <rect
        fill="#050b10"
        height="342"
        width={PANEL_WIDTH - 40}
        x="20"
        y="54"
      />
      <g stroke={GRID} strokeWidth="1">
        {[24, 172, 320, 468].map((x) => (
          <line key={`v${x}`} x1={x} x2={x} y1="70" y2="388" />
        ))}
        {[118, 218, 318].map((y) => (
          <line key={`h${y}`} x1="20" x2="472" y1={y} y2={y} />
        ))}
      </g>
      <MonitorScrew x={14} y={14} />
      <MonitorScrew x={PANEL_WIDTH - 14} y={14} />
      <MonitorScrew x={14} y={PANEL_HEIGHT - 14} />
      <MonitorScrew x={PANEL_WIDTH - 14} y={PANEL_HEIGHT - 14} />
      <text
        fill={WHITE}
        fontFamily="MatrixType"
        fontSize="18"
        fontWeight="700"
        x="30"
        y="30"
      >
        {getModuleLabel(id).toUpperCase()}
      </text>
      <text
        fill={MUTED}
        fontFamily="MatrixType"
        fontSize="13"
        textAnchor="end"
        x={PANEL_WIDTH - 38}
        y="30"
      >
        {id === "bars" ||
        id === "spectrum" ||
        id === "oscillator" ||
        id === "beat-pulse"
          ? "AUDIO / LIVE"
          : "MIDI / LIVE"}
      </text>
      <circle cx={PANEL_WIDTH - 20} cy="25" fill="#8caa6b" r="3" />
      <text fill={MUTED} fontFamily="MatrixType" fontSize="12" x="18" y="425">
        {id === "launchpad"
          ? `${launchpadPadCount} SOURCES`
          : id === "singer"
            ? "GM VOICE / LEAD"
            : id === "orbit"
              ? `${instrumentCount} INSTRUMENTS`
              : id === "pitch-map"
                ? "PITCH / INTENSITY"
                : id === "beat-pulse"
                  ? "WAVEFORM PEAK"
                  : `FRAME ${frame}`}
      </text>
      <text
        fill={MUTED}
        fontFamily="MatrixType"
        fontSize="12"
        textAnchor="end"
        x={PANEL_WIDTH - 18}
        y="425"
      >
        {id === "launchpad" || id === "singer" || id === "orbit"
          ? `ACTIVE ${activeEventCount}`
          : id === "pitch-map"
            ? "8 SEC WINDOW"
            : `LEVEL ${Math.max(0, ...spectrum.slice(spectrumStart, spectrumStart + SPECTRUM_BANDS)).toFixed(2)}`}
      </text>
    </g>
  );
}

function MonitorScrew({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        fill="#141a1e"
        r="5"
        stroke="#7c878b"
        strokeWidth="2"
      />
      <path
        d={`M${x - 2} ${y + 2} L${x + 2} ${y - 2}`}
        stroke="#080c0f"
        strokeWidth="1.5"
      />
    </g>
  );
}
