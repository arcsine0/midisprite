import { instrumentSets, type InstrumentSetId } from "../audio/instrumentSets";
import {
  getModuleLabel,
  getModuleExclusiveGroup,
  moduleRegistry,
  type ModuleId,
  type ModuleIds,
} from "../../visualizers/modules/registry";

type Props = {
  modules: ModuleIds;
  onModuleChange: (slot: number, id: ModuleId) => void;
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
};

export function VisualizerControls({
  modules,
  onModuleChange,
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
}: Props) {
  return (
    <section aria-labelledby="visualizer-heading" className="mt-8 space-y-3">
      <h2
        className="text-xs font-semibold uppercase tracking-wider text-base-content/60"
        id="visualizer-heading"
      >
        Modules
      </h2>
      {modules.map((module, slot) => {
        const id = `module-${slot + 1}`;
        return (
          <div key={id}>
            <label className="label" htmlFor={id}>{`Module ${slot + 1}`}</label>
            <select
              className="select select-sm w-full"
              disabled={randomize}
              id={id}
              onChange={(event) =>
                onModuleChange(slot, event.currentTarget.value as ModuleId)
              }
              value={module}
            >
              {moduleRegistry.map(({ id: moduleId }) => {
                const group = getModuleExclusiveGroup(moduleId);
                const conflicts =
                  moduleId !== module &&
                  group !== undefined &&
                  modules.some(
                    (selected, selectedSlot) =>
                      selectedSlot !== slot &&
                      getModuleExclusiveGroup(selected) === group,
                  );
                return (
                  <option disabled={conflicts} key={moduleId} value={moduleId}>
                    {getModuleLabel(moduleId)}
                  </option>
                );
              })}
            </select>
          </div>
        );
      })}

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
              Segment (sec)
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
