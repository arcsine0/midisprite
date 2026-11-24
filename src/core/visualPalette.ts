export const VISUALIZER_PALETTE = {
  ink: "#050812",
  cyan: "#22eaff",
  lime: "#aaff3d",
  gold: "#ffd447",
  amber: "#ff9638",
  blue: "#68baff",
  pale: "#e8ffc2",
  white: "#f4fff7",
} as const;

export const VISUALIZER_ACCENTS = [
  VISUALIZER_PALETTE.cyan,
  VISUALIZER_PALETTE.lime,
  VISUALIZER_PALETTE.gold,
  VISUALIZER_PALETTE.amber,
  VISUALIZER_PALETTE.blue,
  VISUALIZER_PALETTE.pale,
] as const;
