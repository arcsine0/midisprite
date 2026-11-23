# Midisprite

Deterministic 16-bit MIDI visualizer sequences, synthesized and rendered with Remotion.

## Setup

Requires Node.js and npm. Install the pinned dependencies, then start the preview app:

```sh
npm install
npm run dev
```

Remotion's composition studio is available with `npm run studio`. Run `npm run typecheck` to check TypeScript.

## Preview flow

- Select a local `.mid` or `.midi` file and press **Process**. Parsing and offline audio synthesis happen in the browser.
- The Player runs for the MIDI duration. Waveform, oscillator, and radial bars use the same frame timeline as its audio.
- Random mode chooses seeded visualizer segments. Segment length and seed are adjustable in the controls.
- Preview synthesis uses local FluidR3 General MIDI samples for all 128 melodic programs and the 47 available GM drum notes. Nine pitch roots per instrument keep the bundled bank compact; Tone.Sampler transposes between them. The rendered WAV is 44.1 kHz mono, 16-bit PCM. See [sample credits](assets/audio/samples/FluidR3_GM/ATTRIBUTION.md).
- `npm run render` still renders the default composition props; exporting the currently processed MIDI is not wired yet.

Render output is written to the ignored `out/` directory. All Remotion packages are pinned to the same exact version for reproducible installs.
