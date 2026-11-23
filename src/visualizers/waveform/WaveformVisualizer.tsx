import type { VisualizerProps } from "../types";

export function WaveformVisualizer({ waveform, frame, fps }: VisualizerProps) {
  const sampleCount = 120;
  const firstFrame = Math.max(0, frame - fps * 4);
  const visibleFrames = Math.max(1, frame - firstFrame);
  const points = Array.from({ length: sampleCount }, (_, index) => {
    const sampleFrame = Math.floor(
      firstFrame + (visibleFrames * index) / (sampleCount - 1),
    );
    const amplitude = Math.min(1, (waveform[sampleFrame] ?? 0) * 8) * 420;
    return `${(index / (sampleCount - 1)) * 1080},${960 - amplitude}`;
  });

  return (
    <svg aria-hidden="true" viewBox="0 0 1080 1920" className="h-full w-full">
      <path
        d={`M${points.join(" L")}`}
        fill="none"
        stroke="#b8f36b"
        strokeWidth="12"
      />
      <path
        d={`M${points.map((point) => point.replace(/,(.+)$/, (_, y) => `,${1920 - Number(y)}`)).join(" L")}`}
        fill="none"
        stroke="#b8f36b"
        strokeOpacity="0.34"
        strokeWidth="12"
      />
    </svg>
  );
}
