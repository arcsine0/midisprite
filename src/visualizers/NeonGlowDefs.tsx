export function NeonGlowDefs({ id }: { id: string }) {
  return (
    <filter
      colorInterpolationFilters="sRGB"
      height="220%"
      id={id}
      width="220%"
      x="-60%"
      y="-60%"
    >
      <feGaussianBlur result="glow" stdDeviation="10" />
      <feMerge>
        <feMergeNode in="glow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
}
