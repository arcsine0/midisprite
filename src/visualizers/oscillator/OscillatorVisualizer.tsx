import type { VisualizerProps } from "../types";
import { WAVEFORM_SAMPLES_PER_FRAME } from "../../core/project/audioFeatures";

export function OscillatorVisualizer({ waveform, frame }: VisualizerProps) {
  const start = frame * WAVEFORM_SAMPLES_PER_FRAME;
  const points = Array.from(
    { length: WAVEFORM_SAMPLES_PER_FRAME },
    (_, index) => {
      const x = (index / (WAVEFORM_SAMPLES_PER_FRAME - 1)) * 1080;
      const y = 960 - (waveform[start + index] ?? 0) * 560;
      return `${x},${y}`;
    },
  );

  return (
    <svg aria-hidden="true" viewBox="0 0 1080 1920" className="h-full w-full">
      <path d="M80 960H1000" fill="none" stroke="#174c4b" strokeWidth="3" />
      <path
        d={`M${points.join(" L")}`}
        fill="none"
        stroke="#00f1d5"
        strokeOpacity="0.2"
        strokeWidth="42"
      />
      <path
        d={`M${points.join(" L")}`}
        fill="none"
        stroke="#a5fff2"
        strokeWidth="10"
      />
    </svg>
  );
}
