import { SPECTRUM_BANDS } from "../../core/project/audioFeatures";
import { NeonGlowDefs } from "../NeonGlowDefs";
import type { VisualizerProps } from "../types";

const COLORS = ["#35d047", "#9cdb27", "#e6d51b", "#f6a517", "#f06b16"];

export function BarVisualizer({ spectrum, frame }: VisualizerProps) {
  const start = frame * SPECTRUM_BANDS;
  const columnWidth = 1080 / SPECTRUM_BANDS;
  const baseline = 1350;

  return (
    <svg aria-hidden="true" viewBox="0 0 1080 1920" className="h-full w-full">
      <defs>
        <NeonGlowDefs id="bar-glow" />
        <linearGradient id="bar-floor" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#7bff29" stopOpacity="0.36" />
          <stop offset="100%" stopColor="#7bff29" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M0 ${baseline}H1080`} stroke="#244020" strokeWidth="4" />
      {Array.from({ length: 7 }, (_, index) => (
        <path
          d={`M0 ${baseline + 45 + index * 72}H1080`}
          key={index}
          stroke="#18241a"
          strokeWidth="3"
        />
      ))}
      {Array.from({ length: SPECTRUM_BANDS }, (_, index) => {
        const level = spectrum[start + index] ?? 0;
        const height = Math.pow(level, 0.72) * 870;
        const x = index * columnWidth + columnWidth * 0.2;
        const width = columnWidth * 0.6;
        const color =
          COLORS[
            Math.min(COLORS.length - 1, Math.floor(level * COLORS.length))
          ];

        return (
          <g key={index}>
            <rect
              fill="url(#bar-floor)"
              height={Math.min(410, height * 0.75)}
              opacity={level * 0.8}
              transform={`skewX(-22)`}
              width={width}
              x={x}
              y={baseline + 12}
            />
            <rect
              fill={color}
              height={height}
              filter="url(#bar-glow)"
              opacity={0.55 + level * 0.45}
              width={width}
              x={x}
              y={baseline - height}
            />
          </g>
        );
      })}
    </svg>
  );
}
