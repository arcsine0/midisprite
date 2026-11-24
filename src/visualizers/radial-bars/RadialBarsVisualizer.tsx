import { SPECTRUM_BANDS } from "../../core/project/audioFeatures";
import { NeonGlowDefs } from "../NeonGlowDefs";
import { VISUALIZER_ACCENTS } from "../../core/visualPalette";
import type { VisualizerProps } from "../types";

export function RadialBarsVisualizer({
  spectrum,
  frame,
  fps,
}: VisualizerProps) {
  const start = frame * SPECTRUM_BANDS;
  const centerX = 540;
  const centerY = 960;
  const low =
    [0, 1, 2, 3, 4].reduce(
      (sum, index) => sum + (spectrum[start + index] ?? 0),
      0,
    ) / 5;
  const innerRadius = 240 + low * 44;
  const barCount = 72;
  const time = frame / fps;

  return (
    <svg aria-hidden="true" viewBox="0 0 1080 1920" className="h-full w-full">
      <defs>
        <NeonGlowDefs id="radial-glow" />
      </defs>
      <circle
        cx={centerX}
        cy={centerY}
        fill="none"
        r={innerRadius - 30}
        stroke="#ff43df"
        strokeOpacity={0.24 + low * 0.36}
        strokeWidth="5"
      />
      <circle
        cx={centerX}
        cy={centerY}
        fill="#080817"
        filter="url(#radial-glow)"
        r={innerRadius - 54}
        stroke="#ffffff"
        strokeOpacity={0.56 + low * 0.44}
        strokeWidth={5 + low * 8}
      />
      {Array.from({ length: barCount }, (_, index) => {
        const band = Math.floor((index / barCount) * SPECTRUM_BANDS);
        const level = spectrum[start + band] ?? 0;
        const angle = (index / barCount) * Math.PI * 2 - Math.PI / 2;
        const visualLevel = Math.pow(level, 0.58);
        const outerRadius = innerRadius + 24 + visualLevel * 470;
        const x1 = centerX + Math.cos(angle) * innerRadius;
        const y1 = centerY + Math.sin(angle) * innerRadius;
        const x2 = centerX + Math.cos(angle) * outerRadius;
        const y2 = centerY + Math.sin(angle) * outerRadius;
        const color =
          VISUALIZER_ACCENTS[
            Math.floor((index / barCount) * VISUALIZER_ACCENTS.length)
          ];

        return (
          <g filter="url(#radial-glow)" key={index}>
            <line
              stroke={color}
              strokeLinecap="round"
              strokeOpacity={0.44 + visualLevel * 0.52}
              strokeWidth="21"
              x1={x1}
              x2={x2}
              y1={y1}
              y2={y2}
            />
            <line
              stroke="#ffffff"
              strokeLinecap="round"
              strokeOpacity={0.38 + visualLevel * 0.62}
              strokeWidth="7"
              x1={x1}
              x2={x2}
              y1={y1}
              y2={y2}
            />
          </g>
        );
      })}
      <circle
        cx={centerX}
        cy={centerY}
        fill="none"
        r={innerRadius + 18 + Math.sin(time * 2) * 4}
        stroke="#ffffff"
        strokeOpacity={0.34 + low * 0.54}
        strokeWidth={4 + low * 8}
      />
    </svg>
  );
}
