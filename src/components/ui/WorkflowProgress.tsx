type Step = { id: string; label: string };

type Props = {
  activeStep: string;
  complete?: boolean;
  indeterminate?: boolean;
  label: string;
  percent: number;
  steps: readonly Step[];
};

export function WorkflowProgress({
  activeStep,
  complete = false,
  indeterminate = false,
  label,
  percent,
  steps,
}: Props) {
  const activeIndex = complete
    ? steps.length
    : steps.findIndex(({ id }) => id === activeStep);

  return (
    <div className="space-y-1.5" role="status">
      <progress
        aria-label={label}
        aria-valuetext={indeterminate ? label : `${percent}%`}
        className="progress progress-primary h-1.5 w-full"
        max={100}
        value={indeterminate ? undefined : percent}
      />
      <div className="flex items-center justify-between gap-2">
        <ol aria-label={`${label} steps`} className="flex gap-2">
          {steps.map(({ id, label: stepLabel }, index) => {
            const active = id === activeStep;
            const complete = activeIndex >= 0 && index < activeIndex;
            return (
              <li
                className={`flex items-center gap-1 text-[9px] font-medium tracking-wide ${
                  active
                    ? "text-primary"
                    : complete
                      ? "text-base-content/60"
                      : "text-base-content/30"
                }`}
                key={id}
              >
                <span
                  aria-hidden="true"
                  className={`size-1.5 rounded-full ${
                    active || complete ? "bg-primary" : "bg-base-content/20"
                  }`}
                />
                {stepLabel}
              </li>
            );
          })}
        </ol>
        <span className="font-mono text-[10px] tabular-nums">
          {indeterminate ? label.toUpperCase() : `${Math.round(percent)}%`}
        </span>
      </div>
    </div>
  );
}
