# Midisprite

Deterministic 16-bit MIDI visualizer sequences, synthesized and rendered with Remotion.

## Setup

Requires Node.js and npm. Install the pinned dependencies, then start the preview app:

```sh
npm install
npm run dev
```

Remotion's composition studio is available with `npm run studio`. The current composition is a static setup placeholder; MIDI parsing, audio synthesis, sequence planning, and video export behavior are not implemented yet.

Run `npm run typecheck` to check TypeScript. Render output is written to the ignored `out/` directory with `npm run render`.

## Current limits

- The MIDI picker only records the selected filename. It does not parse or upload the file.
- The Remotion Player uses a 30 fps, 1080×1920 placeholder composition with no audio.
- No General MIDI sound bank is bundled. Tone.js instrument mapping and offline synthesis still need to be implemented.
- All Remotion packages are pinned to the same exact version for reproducible installs.
