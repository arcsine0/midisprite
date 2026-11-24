import { moduleRegistry, type ModuleIds } from "./registry";

export type ModuleSegment = {
  startFrame: number;
  endFrame: number;
  modules: ModuleIds;
};

export function planModuleSequence(
  durationInFrames: number,
  segmentInFrames: number,
  seed: number,
): ModuleSegment[] {
  const ids = moduleRegistry.map(({ id }) => id);
  const segmentLength = Math.max(1, Math.floor(segmentInFrames));
  const segments: ModuleSegment[] = [];
  let state = seed >>> 0;
  let previous: ModuleIds | undefined;

  for (
    let startFrame = 0;
    startFrame < durationInFrames;
    startFrame += segmentLength
  ) {
    const available = [...ids];
    const modules = [0, 1, 2, 3].map((slot) => {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      let index = Math.floor((state / 0x100000000) * available.length);
      if (previous?.[slot] === available[index] && available.length > 1) {
        index = (index + 1) % available.length;
      }
      return available.splice(index, 1)[0];
    }) as ModuleIds;

    segments.push({
      startFrame,
      endFrame: Math.min(durationInFrames, startFrame + segmentLength),
      modules,
    });
    previous = modules;
  }

  return segments;
}

export function getModulesAtFrame(
  frame: number,
  segments: ModuleSegment[],
  fallback: ModuleIds,
) {
  return (
    segments.find(
      (segment) => frame >= segment.startFrame && frame < segment.endFrame,
    )?.modules ?? fallback
  );
}
