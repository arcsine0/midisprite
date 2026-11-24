import { useMemo } from "react";
import type { MidiNote, MidiTempo } from "../../core/project/midiProject";
import {
  SPECTRUM_BANDS,
  WAVEFORM_SAMPLES_PER_FRAME,
} from "../../core/project/audioFeatures";
import { getInstrumentColor, getInstrumentKey } from "../midi/instrumentColors";
import { getRecentNoteEvents } from "../midi/recentNoteEvents";
import { ModuleChart } from "./ModuleChart";
import { PixelatedLayer } from "./PixelatedLayer";
import { getModuleLabel, type ModuleId, type ModuleIds } from "./registry";

type Props = {
  frame: number;
  fps: number;
  modules: ModuleIds;
  notes: MidiNote[];
  pixelationSupported: boolean;
  tempos: MidiTempo[];
  waveform: number[];
  spectrum: number[];
};

const PANEL = "#080e15";
const GRID = "#1a2933";
const MUTED = "#78909b";
const WHITE = "#d6e5e8";
const MODULE_POSITIONS = [
  [48, 132],
  [558, 132],
  [48, 1304],
  [558, 1304],
] as const;
const PANEL_WIDTH = 474;
const PANEL_HEIGHT = 474;
const ROLL = { x: 48, y: 630, width: 984, height: 650 };
const MIN_PITCH = 0;
const MAX_PITCH = 127;

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
  notes,
  pixelationSupported,
  tempos,
  waveform,
  spectrum,
}: Props) {
  const time = frame / fps;
  const sampleStart = frame * WAVEFORM_SAMPLES_PER_FRAME;
  const waveformPoints = Array.from(
    { length: WAVEFORM_SAMPLES_PER_FRAME },
    (_, index) => {
      const x = 24 + (index / (WAVEFORM_SAMPLES_PER_FRAME - 1)) * 426;
      const y = 236 - (waveform[sampleStart + index] ?? 0) * 160;
      return `${x},${y}`;
    },
  );
  const spectrumStart = frame * SPECTRUM_BANDS;
  const recentNotes = getRecentNoteEvents(notes, time, 1.5);
  const { instruments, instrumentCount } = useMemo(() => {
    const byInstrument = new Map(
      notes.map((note) => [getInstrumentKey(note), note]),
    );
    return {
      instruments: Array.from(byInstrument.values()).slice(0, 10),
      instrumentCount: byInstrument.size,
    };
  }, [notes]);
  const maxNoteDuration = useMemo(
    () =>
      notes.reduce(
        (longest, note) => Math.max(longest, note.durationSeconds),
        0,
      ),
    [notes],
  );
  const rollStart = Math.max(0, time - 2);
  const rollEnd = rollStart + 8;
  const rollNotes = getNotesInRange(
    notes,
    Math.max(0, rollStart - maxNoteDuration),
    rollEnd,
  ).filter(
    (note) =>
      note.startSeconds + note.durationSeconds > rollStart &&
      note.midi >= MIN_PITCH &&
      note.midi <= MAX_PITCH,
  );
  const pitchNotes = getNotesInRange(notes, Math.max(0, time - 8), time);
  const pitchHeight = ROLL.height - 76;
  const noteHeight = pitchHeight / (MAX_PITCH - MIN_PITCH + 1);
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
          <g key={slot} transform={`translate(${x} ${y})`}>
            <ModulePanel
              frame={frame}
              id={modules[slot]}
              instrumentCount={instrumentCount}
              spectrum={spectrum}
              spectrumStart={spectrumStart}
            />
          </g>
        ))}

        <g transform={`translate(${ROLL.x} ${ROLL.y})`}>
          <rect
            fill={PANEL}
            height={ROLL.height}
            stroke={GRID}
            strokeWidth="2"
            width={ROLL.width}
          />
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
            {Array.from({ length: MAX_PITCH - MIN_PITCH + 1 }, (_, index) => {
              const pitch = MAX_PITCH - index;
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
              const y = (MAX_PITCH - note.midi) * noteHeight + 1;
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
                position: "absolute",
                top,
                width: PANEL_WIDTH,
              }}
            >
              <ModuleChart
                frame={frame}
                id={modules[slot]}
                instruments={instruments}
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
  frame,
  id,
  instrumentCount,
  spectrum,
  spectrumStart,
}: {
  frame: number;
  id: ModuleId;
  instrumentCount: number;
  spectrum: number[];
  spectrumStart: number;
}) {
  return (
    <g>
      <rect
        fill={PANEL}
        height={PANEL_HEIGHT}
        stroke={GRID}
        strokeWidth="2"
        width={PANEL_WIDTH}
      />
      <text
        fill={WHITE}
        fontFamily="MatrixType"
        fontSize="18"
        fontWeight="700"
        x="18"
        y="30"
      >
        {getModuleLabel(id).toUpperCase()}
      </text>
      <text
        fill={MUTED}
        fontFamily="MatrixType"
        fontSize="13"
        textAnchor="end"
        x={PANEL_WIDTH - 18}
        y="30"
      >
        {id === "bars" || id === "spectrum" || id === "oscillator"
          ? "AUDIO / LIVE"
          : "MIDI / LIVE"}
      </text>
      <g stroke={GRID} strokeWidth="1">
        {[0, 1, 2, 3].map((index) => (
          <line
            key={`v${index}`}
            x1={24 + index * 142}
            x2={24 + index * 142}
            y1="70"
            y2="388"
          />
        ))}
        {[0, 1, 2].map((index) => (
          <line
            key={`h${index}`}
            x1="20"
            x2="454"
            y1={118 + index * 100}
            y2={118 + index * 100}
          />
        ))}
      </g>
      <text fill={MUTED} fontFamily="MatrixType" fontSize="12" x="18" y="425">
        {id === "orbit" || id === "pitch-map"
          ? `${instrumentCount} INSTRUMENTS`
          : `FRAME ${frame}`}
      </text>
      <text
        fill={MUTED}
        fontFamily="MatrixType"
        fontSize="12"
        textAnchor="end"
        x={PANEL_WIDTH - 18}
        y="425"
      >{`LEVEL ${Math.max(0, ...spectrum.slice(spectrumStart, spectrumStart + SPECTRUM_BANDS)).toFixed(2)}`}</text>
    </g>
  );
}
