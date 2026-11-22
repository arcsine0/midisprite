import { useState, type ChangeEvent } from "react";

export function MidiImportPanel() {
  const [filename, setFilename] = useState<string>();

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    setFilename(event.currentTarget.files?.[0]?.name);
  }

  return (
    <section aria-labelledby="source-heading" className="space-y-3">
      <h2
        className="text-xs font-semibold uppercase tracking-wider text-base-content/60"
        id="source-heading"
      >
        Source
      </h2>
      <label className="label" htmlFor="midi-file">
        MIDI file
      </label>
      <input
        accept=".mid,.midi,audio/midi,audio/x-midi"
        className="file-input file-input-sm w-full"
        id="midi-file"
        name="midi"
        onChange={selectFile}
        title={filename}
        type="file"
      />
    </section>
  );
}
