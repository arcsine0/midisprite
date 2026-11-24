import {
  AUDIO_ANALYSIS_FPS,
  SPECTRUM_BANDS,
  WAVEFORM_SAMPLES_PER_FRAME,
} from "../../core/project/audioFeatures";

const FFT_SIZE = 2048;
const WAVEFORM_WINDOW_SIZE = 512;
const bitReversed = Uint16Array.from({ length: FFT_SIZE }, (_, index) => {
  let value = index;
  let reversed = 0;
  for (let bit = 0; bit < Math.log2(FFT_SIZE); bit++) {
    reversed = (reversed << 1) | (value & 1);
    value >>= 1;
  }
  return reversed;
});
const windowValues = Float64Array.from(
  { length: FFT_SIZE },
  (_, index) => 0.5 - 0.5 * Math.cos((Math.PI * 2 * index) / (FFT_SIZE - 1)),
);
const windowSum = windowValues.reduce((sum, value) => sum + value, 0);
const cosine = Float64Array.from({ length: FFT_SIZE / 2 }, (_, index) =>
  Math.cos((Math.PI * 2 * index) / FFT_SIZE),
);
const sine = Float64Array.from({ length: FFT_SIZE / 2 }, (_, index) =>
  Math.sin((Math.PI * 2 * index) / FFT_SIZE),
);

export async function analyzeAudio(
  samples: Float32Array,
  sampleRate: number,
  durationSeconds: number,
) {
  const frameCount = Math.ceil(durationSeconds * AUDIO_ANALYSIS_FPS);
  const waveform = new Array<number>(frameCount * WAVEFORM_SAMPLES_PER_FRAME);
  const spectrum = new Array<number>(frameCount * SPECTRUM_BANDS);
  const real = new Float64Array(FFT_SIZE);
  const imaginary = new Float64Array(FFT_SIZE);
  const hopSize = sampleRate / AUDIO_ANALYSIS_FPS;
  const nyquistBin = FFT_SIZE / 2;

  for (let frame = 0; frame < frameCount; frame++) {
    const center = Math.floor(frame * hopSize);
    const waveformStart =
      center + Math.floor((hopSize - WAVEFORM_WINDOW_SIZE) / 2);

    for (let index = 0; index < WAVEFORM_SAMPLES_PER_FRAME; index++) {
      const sampleIndex =
        waveformStart +
        Math.floor((index * WAVEFORM_WINDOW_SIZE) / WAVEFORM_SAMPLES_PER_FRAME);
      waveform[frame * WAVEFORM_SAMPLES_PER_FRAME + index] =
        samples[sampleIndex] ?? 0;
    }

    for (let index = 0; index < FFT_SIZE; index++) {
      const sampleIndex = center + index - FFT_SIZE / 2;
      real[bitReversed[index]] =
        (samples[sampleIndex] ?? 0) * windowValues[index];
      imaginary[bitReversed[index]] = 0;
    }

    for (let size = 2; size <= FFT_SIZE; size *= 2) {
      const halfSize = size / 2;
      const twiddleStride = FFT_SIZE / size;
      for (let block = 0; block < FFT_SIZE; block += size) {
        for (let offset = 0; offset < halfSize; offset++) {
          const even = block + offset;
          const odd = even + halfSize;
          const twiddle = offset * twiddleStride;
          const oddReal =
            real[odd] * cosine[twiddle] + imaginary[odd] * sine[twiddle];
          const oddImaginary =
            imaginary[odd] * cosine[twiddle] - real[odd] * sine[twiddle];
          real[odd] = real[even] - oddReal;
          imaginary[odd] = imaginary[even] - oddImaginary;
          real[even] += oddReal;
          imaginary[even] += oddImaginary;
        }
      }
    }

    for (let band = 0; band < SPECTRUM_BANDS; band++) {
      const lowBin = Math.max(
        1,
        Math.floor(Math.pow(nyquistBin, band / SPECTRUM_BANDS)),
      );
      const highBin = Math.max(
        lowBin + 1,
        Math.floor(Math.pow(nyquistBin, (band + 1) / SPECTRUM_BANDS)),
      );
      let magnitude = 0;
      let bins = 0;
      for (let bin = lowBin; bin < Math.min(highBin, nyquistBin); bin++) {
        magnitude += Math.hypot(real[bin], imaginary[bin]) * (2 / windowSum);
        bins++;
      }
      const decibels = 20 * Math.log10(Math.max(1e-5, magnitude / bins));
      spectrum[frame * SPECTRUM_BANDS + band] = Math.max(
        0,
        Math.min(1, (decibels + 60) / 60),
      );
    }

    if (frame > 0 && frame % 60 === 0) await yieldToMain();
  }

  return { waveform, spectrum };
}

async function yieldToMain() {
  const taskScheduler = (
    globalThis as typeof globalThis & {
      scheduler?: { yield?: () => Promise<void> };
    }
  ).scheduler;
  if (taskScheduler?.yield) {
    await taskScheduler.yield();
    return;
  }
  await new Promise((resolve) => setTimeout(resolve, 0));
}
