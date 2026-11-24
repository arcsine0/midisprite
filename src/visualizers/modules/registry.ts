export const moduleRegistry = [
  { id: "bars", label: "Bar Visualizer" },
  { id: "oscillator", label: "Oscilloscope" },
  { id: "spectrum", label: "Spectrum Trace" },
  { id: "orbit", label: "Instrument Orbit" },
  { id: "pitch-map", label: "Pitch Density" },
] as const;

export type ModuleId = (typeof moduleRegistry)[number]["id"];
export type ModuleIds = [ModuleId, ModuleId, ModuleId, ModuleId];

export const DEFAULT_MODULES: ModuleIds = [
  "bars",
  "oscillator",
  "spectrum",
  "orbit",
];

export function getModuleLabel(id: ModuleId) {
  return moduleRegistry.find((module) => module.id === id)?.label ?? "Module";
}
