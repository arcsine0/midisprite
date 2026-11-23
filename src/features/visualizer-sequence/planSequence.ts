import type { VisualizerId } from "../../visualizers/registry";
import { visualizerRegistry } from "../../visualizers/registry";

export type VisualizerSegment = {
  startFrame: number;
  endFrame: number;
  visualizerId: VisualizerId;
};

export function planVisualizerSequence(
  durationInFrames: number,
  segmentInFrames: number,
  seed: number,
): VisualizerSegment[] {
  const ids = visualizerRegistry.map(({ id }) => id);
  const segments: VisualizerSegment[] = [];
  const segmentLength = Math.max(1, Math.floor(segmentInFrames));
  let state = seed >>> 0;
  let previous: VisualizerId | undefined;

  for (
    let startFrame = 0;
    startFrame < durationInFrames;
    startFrame += segmentLength
  ) {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    let index = Math.floor((state / 0x100000000) * ids.length);
    if (ids[index] === previous && ids.length > 1)
      index = (index + 1) % ids.length;
    const visualizerId = ids[index];
    segments.push({
      startFrame,
      endFrame: Math.min(durationInFrames, startFrame + segmentLength),
      visualizerId,
    });
    previous = visualizerId;
  }

  return segments;
}

export function getVisualizerAtFrame(
  frame: number,
  segments: VisualizerSegment[],
  fallback: VisualizerId,
) {
  return (
    segments.find(
      (segment) => frame >= segment.startFrame && frame < segment.endFrame,
    )?.visualizerId ?? fallback
  );
}
