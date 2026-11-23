import {
  visualizerRegistry,
  type VisualizerId,
} from "../../visualizers/registry";

type Props = {
  visualizerId: VisualizerId;
  onVisualizerChange: (id: VisualizerId) => void;
  randomize: boolean;
  onRandomizeChange: (enabled: boolean) => void;
  segmentSeconds: number;
  onSegmentSecondsChange: (seconds: number) => void;
  seed: number;
  onSeedChange: (seed: number) => void;
};

export function VisualizerControls({
  visualizerId,
  onVisualizerChange,
  randomize,
  onRandomizeChange,
  segmentSeconds,
  onSegmentSecondsChange,
  seed,
  onSeedChange,
}: Props) {
  return (
    <section aria-labelledby="visualizer-heading" className="mt-8 space-y-3">
      <h2
        className="text-xs font-semibold uppercase tracking-wider text-base-content/60"
        id="visualizer-heading"
      >
        Visualizer
      </h2>
      <label className="label" htmlFor="visualizer-style">
        Style
      </label>
      <select
        className="select select-sm w-full"
        disabled={randomize}
        id="visualizer-style"
        onChange={(event) =>
          onVisualizerChange(event.currentTarget.value as VisualizerId)
        }
        value={visualizerId}
      >
        {visualizerRegistry.map(({ id, label }) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </select>

      <label
        className="label cursor-pointer justify-start gap-3"
        htmlFor="randomize"
      >
        <input
          checked={randomize}
          className="checkbox checkbox-sm"
          id="randomize"
          onChange={(event) => onRandomizeChange(event.currentTarget.checked)}
          type="checkbox"
        />
        <span>Randomize</span>
      </label>

      {randomize && (
        <div
          className="space-y-3 border-s border-base-300 ps-3"
          id="random-settings"
        >
          <div>
            <label className="label" htmlFor="segment-seconds">
              Segment length (sec)
            </label>
            <input
              className="input input-sm w-full"
              id="segment-seconds"
              max="60"
              min="1"
              onChange={(event) =>
                onSegmentSecondsChange(event.currentTarget.valueAsNumber)
              }
              step="1"
              type="number"
              value={segmentSeconds}
            />
          </div>
          <div>
            <label className="label" htmlFor="random-seed">
              Seed
            </label>
            <input
              className="input input-sm w-full"
              id="random-seed"
              max="4294967295"
              min="0"
              onChange={(event) =>
                onSeedChange(event.currentTarget.valueAsNumber)
              }
              step="1"
              type="number"
              value={seed}
            />
          </div>
        </div>
      )}
    </section>
  );
}
