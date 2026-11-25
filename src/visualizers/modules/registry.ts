export const moduleRegistry = [
  { id: "bars", label: "Spectrum Bars", exclusiveGroup: "spectrum" },
  { id: "oscillator", label: "Oscilloscope" },
  { id: "spectrum", label: "Spectrum Trace", exclusiveGroup: "spectrum" },
  { id: "orbit", label: "Instrument Radar" },
  { id: "pitch-map", label: "Pitch Histogram" },
  { id: "launchpad", label: "MIDI Launchpad" },
  { id: "singer", label: "Singing Face" },
  { id: "beat-pulse", label: "Beat Pulse" },
] as const;

export type ModuleId = (typeof moduleRegistry)[number]["id"];
export type ModuleIds = [ModuleId, ModuleId, ModuleId, ModuleId];

export const DEFAULT_MODULES: ModuleIds = [
  "bars",
  "oscillator",
  "launchpad",
  "orbit",
];

export function getModuleLabel(id: ModuleId) {
  return moduleRegistry.find((module) => module.id === id)?.label ?? "Module";
}

export function getModuleExclusiveGroup(id: ModuleId) {
  const module = moduleRegistry.find((entry) => entry.id === id);
  return module && "exclusiveGroup" in module
    ? module.exclusiveGroup
    : undefined;
}
