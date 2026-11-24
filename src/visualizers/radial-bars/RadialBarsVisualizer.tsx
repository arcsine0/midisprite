import { SPECTRUM_BANDS } from "../../core/project/audioFeatures";
import { NeonGlowDefs } from "../NeonGlowDefs";
import type { VisualizerProps } from "../types";

export function RadialBarsVisualizer({ spectrum, frame }: VisualizerProps) {
  const start = frame * SPECTRUM_BANDS;
  const centerX = 540;
  const centerY = 960;
  const innerRadius = 270;

  return (
    <svg aria-hidden="true" viewBox="0 0 1080 1920" className="h-full w-full">
      <defs>
        <NeonGlowDefs id="radial-glow" />
      </defs>
      <circle
        cx={centerX}
        cy={centerY}
        fill="none"
        r={innerRadius - 28}
        stroke="#00d6ce"
        strokeOpacity="0.18"
        strokeWidth="3"
      />
      <circle
        cx={centerX}
        cy={centerY}
        fill="#031512"
        r={innerRadius - 48}
        stroke="#00f1d5"
        strokeOpacity="0.7"
        strokeWidth="5"
      />
      {Array.from({ length: SPECTRUM_BANDS }, (_, index) => {
        const level = spectrum[start + index] ?? 0;
        const angle = (index / SPECTRUM_BANDS) * Math.PI * 2 - Math.PI / 2;
        const visualLevel = Math.pow(level, 0.72);
        const outerRadius = innerRadius + visualLevel * 360;
        const x1 = centerX + Math.cos(angle) * innerRadius;
        const y1 = centerY + Math.sin(angle) * innerRadius;
        const x2 = centerX + Math.cos(angle) * outerRadius;
        const y2 = centerY + Math.sin(angle) * outerRadius;

        return (
          <g filter="url(#radial-glow)" key={index}>
            <line
              stroke="#00f1d5"
              strokeLinecap="round"
              strokeOpacity={visualLevel * 0.3}
              strokeWidth="28"
              x1={x1}
              x2={x2}
              y1={y1}
              y2={y2}
            />
            <line
              stroke="#a5fff2"
              strokeLinecap="round"
              strokeOpacity={0.32 + visualLevel * 0.68}
              strokeWidth="10"
              x1={x1}
              x2={x2}
              y1={y1}
              y2={y2}
            />
          </g>
        );
      })}
    </svg>
  );
}
