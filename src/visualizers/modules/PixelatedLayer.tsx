import type { ReactNode } from "react";
import { pixelate } from "@remotion/effects/pixelate";
import { HtmlInCanvas } from "remotion";

const pixelationEffects = [pixelate({ blockSize: 4 })];

type Props = {
  children: ReactNode;
  height: number;
  left: number;
  supported: boolean;
  top: number;
  width: number;
};

export function PixelatedLayer({
  children,
  height,
  left,
  supported,
  top,
  width,
}: Props) {
  return (
    <div
      style={{
        height,
        left,
        pointerEvents: "none",
        position: "absolute",
        top,
        width,
      }}
    >
      {supported ? (
        <HtmlInCanvas
          effects={pixelationEffects}
          height={height}
          width={width}
          style={{ height: "100%", width: "100%" }}
        >
          {children}
        </HtmlInCanvas>
      ) : (
        children
      )}
    </div>
  );
}
