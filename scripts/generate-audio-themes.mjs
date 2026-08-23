import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import decodeMp3 from "@audio/decode-mp3";
import decodeVorbis from "@audio/decode-vorbis";

const sampleRate = 32_000;
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(projectRoot, "scripts", "audio-sources");
const outputRoot = path.join(projectRoot, "apps", "overlay", "public", "audio");
const sourceCache = new Map();

const K = (pack, file) => path.join("kenney", pack, file);
const F = (file) => path.join("freesound", file);
const L = (file, options = {}) => ({ file, ...options });
const C = (duration, layers, master = {}) => ({ duration, layers, master });

const cueDesigns = {
  neon_pulse: {
    bid: C(0.62, [
      L(K("digital-audio", "powerUp1.ogg"), { gain: 0.72, duration: 0.58 })
    ]),
    sale: C(1.26, [
      L(K("digital-audio", "powerUp3.ogg"), { gain: 0.62, duration: 0.92 }),
      L(K("digital-audio", "phaseJump2.ogg"), { at: 0.34, gain: 0.42, duration: 0.8 })
    ]),
    action: C(0.82, [
      L(K("digital-audio", "zapThreeToneUp.ogg"), { gain: 0.68, duration: 0.74 })
    ]),
    tip: C(1.08, [
      L(K("digital-audio", "phaserUp4.ogg"), { gain: 0.52, duration: 0.88 }),
      L(K("digital-audio", "threeTone1.ogg"), { at: 0.32, gain: 0.38, duration: 0.62 })
    ]),
    share: C(1.02, [
      L(K("digital-audio", "twoTone1.ogg"), { gain: 0.58, duration: 0.66 }),
      L(K("digital-audio", "tone1.ogg"), { at: 0.38, gain: 0.36, rate: 1.12, duration: 0.52 })
    ])
  },
  arcade_8bit: {
    bid: C(0.58, [
      L(K("digital-audio", "pepSound1.ogg"), { gain: 0.72, duration: 0.54 })
    ]),
    sale: C(1.18, [
      L(K("digital-audio", "pepSound5.ogg"), { gain: 0.62, duration: 0.7 }),
      L(K("digital-audio", "pepSound3.ogg"), { at: 0.38, gain: 0.52, rate: 0.92, duration: 0.68 })
    ]),
    action: C(0.74, [
      L(K("digital-audio", "pepSound2.ogg"), { gain: 0.7, duration: 0.68 })
    ]),
    tip: C(1.04, [
      L(K("digital-audio", "pepSound4.ogg"), { gain: 0.62, duration: 0.7 }),
      L(K("digital-audio", "lowThreeTone.ogg"), { at: 0.34, gain: 0.34, rate: 1.18, duration: 0.62 })
    ]),
    share: C(0.98, [
      L(K("digital-audio", "pepSound3.ogg"), { gain: 0.6, duration: 0.64 }),
      L(K("digital-audio", "pepSound1.ogg"), { at: 0.32, gain: 0.4, rate: 1.16, duration: 0.58 })
    ])
  },
  broadcast: {
    bid: C(0.58, [
      L(K("interface-sounds", "confirmation_001.ogg"), { gain: 0.72, duration: 0.52 })
    ]),
    sale: C(1.22, [
      L(K("interface-sounds", "open_002.ogg"), { gain: 0.5, lowpass: 7200, duration: 0.82 }),
      L(K("interface-sounds", "confirmation_004.ogg"), { at: 0.3, gain: 0.62, duration: 0.8 })
    ]),
    action: C(0.76, [
      L(K("interface-sounds", "select_004.ogg"), { gain: 0.66, duration: 0.68 })
    ]),
    tip: C(1.06, [
      L(K("interface-sounds", "maximize_004.ogg"), { gain: 0.54, duration: 0.76 }),
      L(K("interface-sounds", "confirmation_003.ogg"), { at: 0.28, gain: 0.48, duration: 0.68 })
    ]),
    share: C(0.96, [
      L(K("interface-sounds", "confirmation_002.ogg"), { gain: 0.64, duration: 0.7 }),
      L(K("interface-sounds", "drop_001.ogg"), { at: 0.3, gain: 0.28, highpass: 180, duration: 0.5 })
    ])
  },
  crystal: {
    bid: C(0.7, [
      L(F("crystal-button-1.mp3"), { sourceStart: 0.03, gain: 0.7, duration: 0.64, highpass: 180 })
    ]),
    sale: C(1.46, [
      L(F("crystal-button-3.mp3"), { sourceStart: 0.03, gain: 0.62, duration: 1.24, highpass: 160 }),
      L(K("interface-sounds", "glass_006.ogg"), { at: 0.46, gain: 0.36, rate: 0.92, duration: 0.82 })
    ]),
    action: C(0.9, [
      L(K("interface-sounds", "glass_003.ogg"), { gain: 0.62, duration: 0.82, highpass: 180 })
    ]),
    tip: C(1.28, [
      L(K("interface-sounds", "glass_005.ogg"), { gain: 0.58, duration: 0.96 }),
      L(F("crystal-button-1.mp3"), { at: 0.32, sourceStart: 0.08, gain: 0.4, rate: 1.08, duration: 0.82 })
    ]),
    share: C(1.18, [
      L(K("interface-sounds", "glass_002.ogg"), { gain: 0.58, duration: 0.84 }),
      L(K("interface-sounds", "glass_004.ogg"), { at: 0.3, gain: 0.36, rate: 1.12, duration: 0.72 })
    ])
  },
  duck_party: {
    bid: C(0.62, [
      L(K("casino-audio", "chip-lay-1.ogg"), { gain: 0.68, duration: 0.56 })
    ]),
    sale: C(1.28, [
      L(K("casino-audio", "dice-throw-2.ogg"), { gain: 0.5, duration: 0.86 }),
      L(K("casino-audio", "chips-stack-5.ogg"), { at: 0.34, gain: 0.56, duration: 0.82 }),
      L(K("interface-sounds", "bong_001.ogg"), { at: 0.54, gain: 0.24, rate: 1.12, duration: 0.62 })
    ]),
    action: C(0.8, [
      L(K("casino-audio", "die-throw-4.ogg"), { gain: 0.62, duration: 0.72 })
    ]),
    tip: C(1.08, [
      L(K("casino-audio", "chips-collide-2.ogg"), { gain: 0.58, duration: 0.82 }),
      L(K("interface-sounds", "bong_001.ogg"), { at: 0.34, gain: 0.25, rate: 1.26, duration: 0.58 })
    ]),
    share: C(1.04, [
      L(K("casino-audio", "card-fan-1.ogg"), { gain: 0.56, duration: 0.8 }),
      L(K("casino-audio", "chip-lay-1.ogg"), { at: 0.4, gain: 0.42, rate: 1.1, duration: 0.5 })
    ])
  },
  luxury: {
    bid: C(0.68, [
      L(K("casino-audio", "card-place-3.ogg"), { gain: 0.6, lowpass: 6800, duration: 0.6 }),
      L(K("interface-sounds", "glass_001.ogg"), { at: 0.12, gain: 0.22, duration: 0.5 })
    ], { targetDb: -20 }),
    sale: C(1.54, [
      L(F("cash-register.mp3"), { sourceStart: 0.02, gain: 0.48, lowpass: 7600, duration: 1.34 }),
      L(K("interface-sounds", "glass_006.ogg"), { at: 0.52, gain: 0.3, lowpass: 7000, duration: 0.76 })
    ], { targetDb: -19 }),
    action: C(0.86, [
      L(K("casino-audio", "card-shove-2.ogg"), { gain: 0.56, lowpass: 6200, duration: 0.78 })
    ], { targetDb: -21 }),
    tip: C(1.24, [
      L(K("casino-audio", "chips-handle-4.ogg"), { gain: 0.46, lowpass: 6500, duration: 0.94 }),
      L(K("interface-sounds", "glass_005.ogg"), { at: 0.38, gain: 0.28, duration: 0.72 })
    ], { targetDb: -20 }),
    share: C(1.1, [
      L(K("casino-audio", "card-fan-1.ogg"), { gain: 0.48, lowpass: 6200, duration: 0.84 }),
      L(K("interface-sounds", "glass_002.ogg"), { at: 0.36, gain: 0.24, duration: 0.64 })
    ], { targetDb: -21 })
  },
  retro: {
    bid: C(0.56, [
      L(K("ui-audio", "switch1.ogg"), { gain: 0.72, lowpass: 6200, duration: 0.5 })
    ]),
    sale: C(1.18, [
      L(K("ui-audio", "switch31.ogg"), { gain: 0.62, lowpass: 5800, duration: 0.7 }),
      L(K("ui-audio", "switch36.ogg"), { at: 0.3, gain: 0.54, lowpass: 5600, duration: 0.68 }),
      L(K("digital-audio", "lowThreeTone.ogg"), { at: 0.46, gain: 0.22, lowpass: 5000, duration: 0.58 })
    ]),
    action: C(0.74, [
      L(K("ui-audio", "switch8.ogg"), { gain: 0.66, lowpass: 6000, duration: 0.66 })
    ]),
    tip: C(1.04, [
      L(K("ui-audio", "switch23.ogg"), { gain: 0.6, lowpass: 5600, duration: 0.7 }),
      L(K("ui-audio", "click1.ogg"), { at: 0.36, gain: 0.4, rate: 0.88, duration: 0.5 })
    ]),
    share: C(0.96, [
      L(K("ui-audio", "switch15.ogg"), { gain: 0.58, lowpass: 6000, duration: 0.66 }),
      L(K("interface-sounds", "switch_007.ogg"), { at: 0.3, gain: 0.38, duration: 0.56 })
    ])
  },
  stadium: {
    bid: C(0.68, [
      L(F("crowd-cheer.mp3"), { sourceStart: 2.7, gain: 0.44, highpass: 120, lowpass: 7600, duration: 0.62 })
    ], { targetDb: -20 }),
    sale: C(1.58, [
      L(F("crowd-cheer.mp3"), { sourceStart: 2.42, gain: 0.52, highpass: 110, lowpass: 8000, duration: 1.46 }),
      L(K("digital-audio", "threeTone1.ogg"), { at: 0.12, gain: 0.26, duration: 0.8 })
    ], { targetDb: -18.5 }),
    action: C(0.92, [
      L(F("crowd-cheer.mp3"), { sourceStart: 3.22, gain: 0.46, highpass: 130, lowpass: 7200, duration: 0.84 }),
      L(K("interface-sounds", "confirmation_001.ogg"), { at: 0.08, gain: 0.28, duration: 0.54 })
    ], { targetDb: -20 }),
    tip: C(1.34, [
      L(F("crowd-cheer.mp3"), { sourceStart: 2.52, gain: 0.5, highpass: 110, lowpass: 7600, duration: 1.22 }),
      L(K("digital-audio", "powerUp1.ogg"), { at: 0.2, gain: 0.24, duration: 0.72 })
    ], { targetDb: -19 }),
    share: C(1.22, [
      L(F("crowd-cheer.mp3"), { sourceStart: 3.6, gain: 0.46, highpass: 130, lowpass: 7200, duration: 1.08 }),
      L(K("interface-sounds", "confirmation_002.ogg"), { at: 0.12, gain: 0.24, duration: 0.64 })
    ], { targetDb: -20 })
  },
  storm: {
    bid: C(0.74, [
      L(F("distant-thunder.mp3"), { sourceStart: 0.28, gain: 0.48, highpass: 58, lowpass: 4200, duration: 0.68 })
    ], { targetDb: -23, highpass: 58 }),
    sale: C(1.56, [
      L(F("distant-thunder.mp3"), { sourceStart: 4, gain: 0.5, highpass: 32, lowpass: 4600, duration: 1.46 }),
      L(F("wind-gust.mp3"), { sourceStart: 0.04, gain: 0.17, highpass: 90, lowpass: 2800, duration: 1.38 }),
      L(K("interface-sounds", "glass_001.ogg"), { at: 0.56, gain: 0.12, lowpass: 5200, duration: 0.6 })
    ], { targetDb: -21, highpass: 32 }),
    action: C(1.04, [
      L(F("wind-gust.mp3"), { sourceStart: 0.02, gain: 0.34, highpass: 120, lowpass: 3400, duration: 0.96 }),
      L(F("distant-thunder.mp3"), { sourceStart: 5.5, gain: 0.22, highpass: 65, lowpass: 3600, duration: 0.82 })
    ], { targetDb: -23, highpass: 58 }),
    tip: C(1.42, [
      L(F("distant-thunder.mp3"), { sourceStart: 5.36, gain: 0.4, highpass: 42, lowpass: 4200, duration: 1.32 }),
      L(K("interface-sounds", "glass_003.ogg"), { at: 0.42, gain: 0.12, lowpass: 5000, duration: 0.72 })
    ], { targetDb: -22, highpass: 42 }),
    share: C(1.3, [
      L(F("wind-gust.mp3"), { sourceStart: 0.24, gain: 0.32, highpass: 120, lowpass: 3200, duration: 1.18 }),
      L(K("interface-sounds", "glass_004.ogg"), { at: 0.34, gain: 0.1, lowpass: 4800, duration: 0.66 })
    ], { targetDb: -23, highpass: 58 })
  },
  zen: {
    bid: C(0.72, [
      L(K("interface-sounds", "pluck_001.ogg"), { gain: 0.54, lowpass: 5200, duration: 0.66 })
    ], { targetDb: -23 }),
    sale: C(1.52, [
      L(K("interface-sounds", "pluck_002.ogg"), { gain: 0.48, lowpass: 5000, duration: 1.02 }),
      L(F("wind-gust.mp3"), { sourceStart: 1.5, gain: 0.1, highpass: 180, lowpass: 2200, duration: 1.38 }),
      L(F("crystal-button-3.mp3"), { at: 0.46, sourceStart: 0.08, gain: 0.16, lowpass: 5200, duration: 0.82 })
    ], { targetDb: -22 }),
    action: C(0.96, [
      L(K("interface-sounds", "drop_003.ogg"), { gain: 0.42, lowpass: 4800, duration: 0.86 })
    ], { targetDb: -24 }),
    tip: C(1.32, [
      L(K("interface-sounds", "pluck_001.ogg"), { gain: 0.44, rate: 0.92, lowpass: 5000, duration: 0.94 }),
      L(K("interface-sounds", "pluck_002.ogg"), { at: 0.38, gain: 0.3, rate: 1.08, lowpass: 5200, duration: 0.82 })
    ], { targetDb: -23 }),
    share: C(1.2, [
      L(K("interface-sounds", "drop_004.ogg"), { gain: 0.4, lowpass: 4600, duration: 0.94 }),
      L(F("crystal-button-1.mp3"), { at: 0.38, sourceStart: 0.12, gain: 0.14, lowpass: 5000, duration: 0.68 })
    ], { targetDb: -24 })
  }
};

let renderedCount = 0;
for (const [theme, designs] of Object.entries(cueDesigns)) {
  const themeDirectory = path.join(outputRoot, theme);
  fs.mkdirSync(themeDirectory, { recursive: true });
  for (const [kind, design] of Object.entries(designs)) {
    const samples = await renderCue(design);
    fs.writeFileSync(path.join(themeDirectory, kind + ".wav"), encodeWav(samples));
    renderedCount += 1;
  }
}

console.log("Rendered " + renderedCount + " curated Duck Desk audio cues.");

async function renderCue(design) {
  const samples = new Float64Array(Math.round(design.duration * sampleRate));
  for (const sourceLayer of design.layers) {
    await mixSource(samples, sourceLayer);
  }
  masterCue(samples, design.master);
  return samples;
}

async function loadSource(relativePath) {
  if (sourceCache.has(relativePath)) {
    return sourceCache.get(relativePath);
  }

  const sourceBytes = fs.readFileSync(path.join(sourceRoot, relativePath));
  const decoder = path.extname(relativePath) === ".mp3" ? decodeMp3 : decodeVorbis;
  const audioBuffer = await decoder(sourceBytes);
  const channels = audioBuffer.channelData;
  let mono = new Float64Array(channels[0]?.length ?? 0);
  for (const channel of channels) {
    for (let index = 0; index < channel.length; index += 1) {
      mono[index] += channel[index] / channels.length;
    }
  }
  removeDc(mono);
  if (relativePath.startsWith("kenney")) {
    const firstAudibleSample = mono.findIndex((sample) => Math.abs(sample) >= 0.001);
    if (firstAudibleSample > 0) {
      const preRoll = Math.round(audioBuffer.sampleRate * 0.005);
      mono = mono.subarray(Math.max(0, firstAudibleSample - preRoll));
    }
  }

  const source = { samples: mono, sampleRate: audioBuffer.sampleRate };
  sourceCache.set(relativePath, source);
  return source;
}

async function mixSource(output, options) {
  const source = await loadSource(options.file);
  const outputStart = Math.max(0, Math.round((options.at ?? 0) * sampleRate));
  const sourceStart = Math.max(0, (options.sourceStart ?? 0) * source.sampleRate);
  const rate = options.rate ?? 1;
  const availableSeconds = (source.samples.length - sourceStart) / source.sampleRate / rate;
  const requestedSeconds = options.duration ?? availableSeconds;
  const outputLength = Math.min(
    output.length - outputStart,
    Math.max(0, Math.round(Math.min(availableSeconds, requestedSeconds) * sampleRate))
  );
  const fadeIn = options.fadeIn ?? Math.min(0.012, requestedSeconds * 0.08);
  const fadeOut = options.fadeOut ?? Math.min(0.08, requestedSeconds * 0.18);
  const lowpassAlpha = options.lowpass
    ? 1 - Math.exp(-2 * Math.PI * options.lowpass / sampleRate)
    : null;
  const highpassAlpha = options.highpass
    ? 1 / (1 + 2 * Math.PI * options.highpass / sampleRate)
    : null;
  let lowpassState = 0;
  let highpassState = 0;
  let previousInput = 0;

  for (let index = 0; index < outputLength; index += 1) {
    const sourcePosition = sourceStart + index * source.sampleRate * rate / sampleRate;
    const leftIndex = Math.floor(sourcePosition);
    const fraction = sourcePosition - leftIndex;
    const left = source.samples[leftIndex] ?? 0;
    const right = source.samples[leftIndex + 1] ?? left;
    let value = left + (right - left) * fraction;

    if (highpassAlpha !== null) {
      highpassState = highpassAlpha * (highpassState + value - previousInput);
      previousInput = value;
      value = highpassState;
    }
    if (lowpassAlpha !== null) {
      lowpassState += lowpassAlpha * (value - lowpassState);
      value = lowpassState;
    }

    const elapsed = index / sampleRate;
    const remaining = (outputLength - 1 - index) / sampleRate;
    const envelope = Math.min(
      fadeIn > 0 ? elapsed / fadeIn : 1,
      fadeOut > 0 ? remaining / fadeOut : 1,
      1
    );
    output[outputStart + index] += value * (options.gain ?? 1) * Math.max(0, envelope);
  }
}

function masterCue(samples, options = {}) {
  removeDc(samples);
  highpassInPlace(samples, options.highpass ?? 42);
  applyEdgeFades(samples, 0.004, 0.045);

  const targetAmplitude = Math.pow(10, (options.targetDb ?? -18.5) / 20);
  const measuredRms = rms(samples);
  const gain = measuredRms > 0 ? Math.min(7, targetAmplitude / measuredRms) : 1;
  for (let index = 0; index < samples.length; index += 1) {
    const value = samples[index] * gain;
    samples[index] = Math.abs(value) <= 0.68
      ? value
      : Math.sign(value) * (0.68 + 0.25 * Math.tanh((Math.abs(value) - 0.68) / 0.25));
  }

  let peak = 0;
  for (const value of samples) {
    peak = Math.max(peak, Math.abs(value));
  }
  const ceiling = Math.pow(10, -3 / 20);
  if (peak > ceiling) {
    const ceilingGain = ceiling / peak;
    for (let index = 0; index < samples.length; index += 1) {
      samples[index] *= ceilingGain;
    }
  }
}

function highpassInPlace(samples, cutoff) {
  const alpha = 1 / (1 + 2 * Math.PI * cutoff / sampleRate);
  let previousInput = 0;
  let previousOutput = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const current = samples[index];
    previousOutput = alpha * (previousOutput + current - previousInput);
    previousInput = current;
    samples[index] = previousOutput;
  }
}

function applyEdgeFades(samples, fadeInSeconds, fadeOutSeconds) {
  const fadeInLength = Math.min(samples.length, Math.round(fadeInSeconds * sampleRate));
  const fadeOutLength = Math.min(samples.length, Math.round(fadeOutSeconds * sampleRate));
  for (let index = 0; index < fadeInLength; index += 1) {
    samples[index] *= index / Math.max(1, fadeInLength - 1);
  }
  for (let index = 0; index < fadeOutLength; index += 1) {
    samples[samples.length - 1 - index] *= index / Math.max(1, fadeOutLength - 1);
  }
}

function removeDc(samples) {
  if (samples.length === 0) {
    return;
  }
  let sum = 0;
  for (const value of samples) {
    sum += value;
  }
  const mean = sum / samples.length;
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] -= mean;
  }
}

function rms(samples) {
  let sum = 0;
  for (const value of samples) {
    sum += value * value;
  }
  return Math.sqrt(sum / Math.max(1, samples.length));
}

function encodeWav(samples) {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * bytesPerSample, 28);
  buffer.writeUInt16LE(bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    buffer.writeInt16LE(
      Math.round(sample * (sample < 0 ? 32768 : 32767)),
      44 + index * bytesPerSample
    );
  }
  return buffer;
}
