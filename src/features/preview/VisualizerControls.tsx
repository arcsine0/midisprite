import {
  visualizerRegistry,
  type VisualizerId,
} from "../../visualizers/registry";
import {
  backgroundRegistry,
  type BackgroundId,
} from "../../backgrounds/registry";
import { instrumentSets, type InstrumentSetId } from "../audio/instrumentSets";

type Props = {
  visualizerId: VisualizerId;
  onVisualizerChange: (id: VisualizerId) => void;
  randomize: boolean;
  onRandomizeChange: (enabled: boolean) => void;
  segmentSeconds: number;
  onSegmentSecondsChange: (seconds: number) => void;
  seed: number;
  onSeedChange: (seed: number) => void;
  instrumentSetId: InstrumentSetId;
  onInstrumentSetChange: (id: InstrumentSetId) => void;
  instrumentSetBusy: boolean;
  instrumentSetError?: string;
  backgroundId: BackgroundId;
  onBackgroundChange: (id: BackgroundId) => void;
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
  instrumentSetId,
  onInstrumentSetChange,
  instrumentSetBusy,
  instrumentSetError,
  backgroundId,
  onBackgroundChange,
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
        {Array.from(new Set(visualizerRegistry.map(({ group }) => group))).map(
          (group) => (
            <optgroup key={group} label={group}>
              {visualizerRegistry
                .filter((visualizer) => visualizer.group === group)
                .map(({ id, label }) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
            </optgroup>
          ),
        )}
      </select>

      <label className="label" htmlFor="background-style">
        Background
      </label>
      <select
        className="select select-sm w-full"
        id="background-style"
        onChange={(event) =>
          onBackgroundChange(event.currentTarget.value as BackgroundId)
        }
        value={backgroundId}
      >
        {Array.from(new Set(backgroundRegistry.map(({ group }) => group))).map(
          (group) => (
            <optgroup key={group} label={group}>
              {backgroundRegistry
                .filter((background) => background.group === group)
                .map(({ id, label }) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
            </optgroup>
          ),
        )}
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

      <div className="space-y-2 border-t border-base-300 pt-4">
        <label className="label" htmlFor="instrument-set">
          Instrument set
        </label>
        <select
          className="select select-sm w-full"
          disabled={instrumentSetBusy}
          id="instrument-set"
          name="instrument-set"
          onChange={(event) =>
            onInstrumentSetChange(event.currentTarget.value as InstrumentSetId)
          }
          value={instrumentSetId}
        >
          {instrumentSets.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
        {instrumentSetBusy && (
          <p className="text-xs text-base-content/60">
            Updating preview audio…
          </p>
        )}
        {instrumentSetError && (
          <p className="text-xs text-error" role="alert">
            {instrumentSetError}
          </p>
        )}
      </div>
    </section>
  );
}
