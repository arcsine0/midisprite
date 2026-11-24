export const backgroundRegistry = [
  { id: "deep-field", label: "Deep Field", group: "Non-reactive" },
  { id: "moving-grid", label: "Moving Grid", group: "Non-reactive" },
  { id: "aurora-drift", label: "Aurora Drift", group: "Non-reactive" },
  { id: "edge-spectrum", label: "Edge Spectrum", group: "Reactive" },
] as const;

export type BackgroundId = (typeof backgroundRegistry)[number]["id"];
