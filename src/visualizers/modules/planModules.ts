import {
  getModuleExclusiveGroup,
  moduleRegistry,
  type ModuleId,
  type ModuleIds,
} from "./registry";

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
  const segmentLength = Math.max(1, Math.floor(segmentInFrames));
  const segments: ModuleSegment[] = [];
  let state = seed >>> 0;
  let previous: ModuleIds | undefined;

  for (
    let startFrame = 0;
    startFrame < durationInFrames;
    startFrame += segmentLength
  ) {
    const selected: ModuleId[] = [];
    const modules = [0, 1, 2, 3].map((slot) => {
      const selectedGroups = new Set(
        selected.flatMap((id) => {
          const group = getModuleExclusiveGroup(id);
          return group ? [group] : [];
        }),
      );
      const available = moduleRegistry.filter(({ id }) => {
        const group = getModuleExclusiveGroup(id);
        return !selected.includes(id) && (!group || !selectedGroups.has(group));
      });
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      let index = Math.floor((state / 0x100000000) * available.length);
      if (previous?.[slot] === available[index]?.id && available.length > 1) {
        index = (index + 1) % available.length;
      }
      const id = available[index].id;
      selected.push(id);
      return id;
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
