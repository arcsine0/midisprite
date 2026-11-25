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
- The Player runs for the MIDI duration. Bar Visualizer, Oscilloscope, and Radial Bars use features measured from the synthesized audio. Instrument Lanes and Note Orbit use MIDI note events; Spectrum Notes combines both. All motion is frame-derived.
- One Remotion pixelation effect wraps the visualizer and background layer in both Player preview and video composition. It uses 4-pixel blocks for a finer pixel-art finish; HTML-in-canvas requires Chrome 149+ with Canvas Draw Element enabled.
- Background choices are grouped into non-reactive frame-animated colors, gradients and linear-gradient grids, plus the audio-reactive Edge Spectrum layer.
- Random mode chooses seeded visualizer segments. Segment length and seed are adjustable in the controls.
- Preview synthesis uses the filtered local FluidR3 samples, with nine pitch roots per instrument and 47 GM drum notes. Choose GM Blend, Arcade, Keys, or Guitar Band in the controls; GM Blend keeps available GM patches and fills missing patches by family, while the other sets use fixed melodic mappings. Drums stay on the GM kit. Tone.Sampler transposes between roots. The rendered WAV is 44.1 kHz mono, 16-bit PCM. See [sample credits](assets/audio/samples/FluidR3_GM/ATTRIBUTION.md).
- Use the sidebar's **Render** tab to export the current MIDI, soundfont, and visualizer settings through Remotion. It writes an MP4 to the chosen local folder (defaults to the project root's `output/`) with a `[midi-filename]-[datetime].mp4` name. This local render endpoint is available while the Vite preview server is running.

The `npm run render` CLI command still renders the default composition props to `out/`. All Remotion packages are pinned to the same exact version for reproducible installs.
