import { SPECTRUM_BANDS } from "../../core/project/audioFeatures";
import { NeonGlowDefs } from "../NeonGlowDefs";
import { VISUALIZER_ACCENTS } from "../../core/visualPalette";
import type { VisualizerProps } from "../types";

const COLORS = [...VISUALIZER_ACCENTS].reverse();

export function BarVisualizer({ spectrum, frame }: VisualizerProps) {
  const start = frame * SPECTRUM_BANDS;
  const barCount = 48;
  const columnWidth = 1080 / barCount;
  const baseline = 1320;

  return (
    <svg aria-hidden="true" viewBox="0 0 1080 1920" className="h-full w-full">
      <defs>
        <NeonGlowDefs id="bar-glow" />
        <linearGradient id="bar-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="14%" stopColor="#9cffff" />
          <stop offset="100%" stopColor="#25cfff" />
        </linearGradient>
      </defs>
      <path
        d={`M0 ${baseline}H1080`}
        filter="url(#bar-glow)"
        stroke="#f7ffff"
        strokeOpacity="0.72"
        strokeWidth="5"
      />
      {Array.from({ length: barCount }, (_, index) => {
        const band = Math.floor((index / barCount) * SPECTRUM_BANDS);
        const level = spectrum[start + band] ?? 0;
        const height = 12 + Math.pow(level, 0.58) * 930;
        const x = index * columnWidth + columnWidth * 0.18;
        const width = columnWidth * 0.64;
        const color =
          COLORS[
            Math.min(
              COLORS.length - 1,
              Math.floor((index / barCount) * COLORS.length),
            )
          ];

        return (
          <g filter="url(#bar-glow)" key={index}>
            <rect
              fill={color}
              height={height}
              opacity={0.72 + level * 0.28}
              rx="3"
              width={width}
              x={x}
              y={baseline - height}
            />
            <rect
              fill="url(#bar-fill)"
              height={Math.max(8, height * 0.34)}
              opacity={0.26 + level * 0.56}
              rx="2"
              width={width}
              x={x}
              y={baseline + 12}
            />
          </g>
        );
      })}
    </svg>
  );
}
