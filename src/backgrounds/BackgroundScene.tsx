import { SPECTRUM_BANDS } from "../core/project/audioFeatures";
import { VISUALIZER_PALETTE } from "../core/visualPalette";
import type { BackgroundId } from "./registry";

type Props = {
  backgroundId: BackgroundId;
  frame: number;
  fps: number;
  spectrum: number[];
};

export function BackgroundScene({ backgroundId, frame, fps, spectrum }: Props) {
  if (backgroundId === "edge-spectrum") {
    const start = frame * SPECTRUM_BANDS;

    return (
      <div className="absolute inset-0" style={{ backgroundColor: "#05090e" }}>
        <svg
          aria-hidden="true"
          className="h-full w-full"
          preserveAspectRatio="none"
          viewBox="0 0 1080 1920"
        >
          {Array.from({ length: SPECTRUM_BANDS }, (_, index) => {
            const level = Math.pow(spectrum[start + index] ?? 0, 0.72);
            const width = level * 390;
            const y =
              210 + ((SPECTRUM_BANDS - index - 0.5) / SPECTRUM_BANDS) * 1480;
            const color =
              index < 18 ? VISUALIZER_PALETTE.cyan : VISUALIZER_PALETTE.lime;

            return (
              <g key={index}>
                <rect
                  fill={color}
                  height="26"
                  opacity={0.08 + level * 0.19}
                  rx="8"
                  width={width}
                  x="0"
                  y={y - 13}
                />
                <rect
                  fill={color}
                  height="26"
                  opacity={0.08 + level * 0.19}
                  rx="8"
                  width={width}
                  x={1080 - width}
                  y={y - 13}
                />
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  const time = frame / fps;
  const driftX = 50 + Math.sin(time * 0.045) * 18;
  const driftY = 50 + Math.cos(time * 0.04) * 18;
  const shade = Math.round(2 + (Math.sin(time * 0.06) + 1) * 1.5);
  const deep = `rgb(${shade}, ${shade + 4}, ${shade + 13})`;
  const teal = `rgb(${shade}, ${shade + 12}, ${shade + 17})`;

  if (backgroundId === "moving-grid") {
    const offset = (frame * 0.35) % 96;

    return (
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "#050812",
          backgroundImage: `linear-gradient(rgba(34, 234, 255, 0.2) 2px, transparent 2px), linear-gradient(90deg, rgba(170, 255, 61, 0.12) 2px, transparent 2px), linear-gradient(150deg in oklab, ${VISUALIZER_PALETTE.ink}, #07131a 58%, #080c17)`,
          backgroundPosition: `0 ${offset}px, ${offset}px 0, center`,
          backgroundSize: "80px 80px, 80px 80px, 100% 100%",
        }}
      />
    );
  }

  if (backgroundId === "aurora-drift") {
    return (
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "#050711",
          backgroundImage: `linear-gradient(120deg in oklab, transparent 18%, rgba(34, 234, 255, 0.12) 42%, transparent 68%), linear-gradient(245deg in oklab, rgba(170, 255, 61, 0.08), transparent 48%, rgba(255, 212, 71, 0.06)), linear-gradient(180deg in oklab, ${VISUALIZER_PALETTE.ink}, #071019)`,
          backgroundPosition: `${driftX}% ${driftY}%, ${100 - driftX}% ${100 - driftY}%, center`,
          backgroundSize: "220% 220%, 190% 190%, 100% 100%",
        }}
      />
    );
  }

  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundColor: "#050812",
        backgroundImage: `linear-gradient(${135 + Math.sin(time * 0.04) * 10}deg in oklab, ${deep}, #050812 52%, ${teal})`,
        backgroundPosition: `${driftX}% ${driftY}%`,
        backgroundSize: "160% 160%",
      }}
    />
  );
}
