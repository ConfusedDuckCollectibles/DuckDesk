import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import decodeVorbis from "@audio/decode-vorbis";

const sampleRate = 48_000;
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(projectRoot, "scripts", "audio-sources");
const outputRoot = path.join(projectRoot, "apps", "overlay", "public", "audio");
const sourceCache = new Map();
const usedSources = new Set();
const renderedDate = new Date().toISOString().slice(0, 10);

const U = (theme, cue) => path.join("uisfx", theme, `${cue}.wav`);
const K = (pack, file) => path.join("kenney", pack, file);
const P = (file) => path.join("public-domain-recordings", file);
const L = (file, gain = 1, options = {}) => ({ file, gain, ...options });

const policy = {
  bid: { targetLufs: -25, durations: [0.13, 0.15, 0.17], width: 0.12 },
  action: { targetLufs: -27, durations: [0.18, 0.21, 0.24], width: 0.16 },
  share: { targetLufs: -24, durations: [0.36], width: 0.34 },
  tip: { targetLufs: -22, durations: [0.58], width: 0.52 },
  sale: { targetLufs: -20, durations: [0.84], width: 0.72 }
};

const commonCues = {
  bid: ["press", "release", "snap"],
  action: ["reaction", "select", "badge"],
  share: ["send"]
};

const themes = {
  neon_pulse: {
    cues: { ...commonCues, tip: ["purchase"], sale: ["success"] },
    layers: {
      bid: [L(K("digital-audio", "tone1.ogg"), 0.15)],
      action: [L(K("digital-audio", "zapThreeToneUp.ogg"), 0.13)],
      share: [L(K("digital-audio", "phaserUp4.ogg"), 0.16)],
      tip: [L(K("digital-audio", "powerUp1.ogg"), 0.18)],
      sale: [L(K("digital-audio", "powerUp3.ogg"), 0.17), L(K("digital-audio", "phaseJump2.ogg"), 0.12, { at: 0.22 })]
    },
    character: "electric"
  },
  arcade_8bit: {
    cues: { ...commonCues, tip: ["bonus"], sale: ["level-up"] },
    layers: {
      bid: [L(K("digital-audio", "pepSound1.ogg"), 0.15)],
      action: [L(K("digital-audio", "pepSound2.ogg"), 0.13)],
      share: [L(K("digital-audio", "pepSound3.ogg"), 0.16)],
      tip: [L(K("digital-audio", "pepSound4.ogg"), 0.17)],
      sale: [L(K("digital-audio", "pepSound5.ogg"), 0.16), L(K("digital-audio", "lowThreeTone.ogg"), 0.11, { at: 0.24 })]
    },
    character: "arcade"
  },
  broadcast: {
    cues: { ...commonCues, tip: ["purchase"], sale: ["success"] },
    layers: {
      bid: [L(K("interface-sounds", "confirmation_001.ogg"), 0.12)],
      action: [L(K("interface-sounds", "select_004.ogg"), 0.1)],
      share: [L(K("interface-sounds", "open_002.ogg"), 0.13)],
      tip: [L(K("interface-sounds", "confirmation_003.ogg"), 0.15)],
      sale: [L(K("interface-sounds", "confirmation_004.ogg"), 0.14), L(K("impact-sounds", "impactSoft_medium_000.ogg"), 0.1)]
    },
    character: "broadcast"
  },
  crystal: {
    cues: { ...commonCues, tip: ["purchase"], sale: ["success"] },
    layers: {
      bid: [L(K("interface-sounds", "glass_001.ogg"), 0.17)],
      action: [L(K("interface-sounds", "drop_003.ogg"), 0.14)],
      share: [L(K("interface-sounds", "glass_002.ogg"), 0.17)],
      tip: [L(K("interface-sounds", "glass_005.ogg"), 0.18)],
      sale: [L(K("impact-sounds", "impactGlass_light_000.ogg"), 0.16), L(K("interface-sounds", "glass_006.ogg"), 0.14, { at: 0.23 })]
    },
    character: "crystal"
  },
  duck_party: {
    cues: { ...commonCues, tip: ["bonus"], sale: ["level-up"] },
    layers: {
      bid: [L(K("casino-audio", "chip-lay-1.ogg"), 0.19)],
      action: [L(K("casino-audio", "die-throw-4.ogg"), 0.17)],
      share: [L(K("casino-audio", "card-fan-1.ogg"), 0.19)],
      tip: [L(K("casino-audio", "chips-collide-2.ogg"), 0.2)],
      sale: [L(K("casino-audio", "dice-throw-2.ogg"), 0.19), L(K("casino-audio", "chips-stack-5.ogg"), 0.16, { at: 0.2 })]
    },
    character: "party"
  },
  luxury: {
    cues: { ...commonCues, tip: ["purchase"], sale: ["success"] },
    layers: {
      bid: [L(K("rpg-audio", "handleSmallLeather.ogg"), 0.2)],
      action: [L(K("rpg-audio", "cloth1.ogg"), 0.17)],
      share: [L(K("casino-audio", "card-fan-1.ogg"), 0.17), L(K("rpg-audio", "cloth2.ogg"), 0.11)],
      tip: [L(K("rpg-audio", "handleCoins.ogg"), 0.17), L(K("interface-sounds", "glass_005.ogg"), 0.11, { at: 0.21 })],
      sale: [L(K("rpg-audio", "dropLeather.ogg"), 0.2), L(K("interface-sounds", "glass_006.ogg"), 0.13, { at: 0.28 })]
    },
    character: "luxury"
  },
  retro: {
    cues: { ...commonCues, tip: ["purchase"], sale: ["complete"] },
    layers: {
      bid: [L(P("switch1.wav"), 0.2)],
      action: [L(K("ui-audio", "switch8.ogg"), 0.16)],
      share: [L(K("ui-audio", "switch15.ogg"), 0.17)],
      tip: [L(K("rpg-audio", "metalClick.ogg"), 0.18), L(P("bell1.wav"), 0.09, { at: 0.2 })],
      sale: [L(P("steel1.wav"), 0.15), L(K("ui-audio", "switch36.ogg"), 0.15, { at: 0.24 })]
    },
    character: "retro"
  },
  stadium: {
    cues: { ...commonCues, tip: ["bonus"], sale: ["level-up"] },
    layers: {
      bid: [L(K("impact-sounds", "impactSoft_medium_001.ogg"), 0.16)],
      action: [L(K("impact-sounds", "impactSoft_medium_000.ogg"), 0.14)],
      share: [L(K("impact-sounds", "impactBell_heavy_000.ogg"), 0.13)],
      tip: [L(K("impact-sounds", "impactBell_heavy_000.ogg"), 0.15)],
      sale: [L(K("impact-sounds", "impactSoft_medium_001.ogg"), 0.16), L(K("impact-sounds", "impactBell_heavy_000.ogg"), 0.12, { at: 0.18 })]
    },
    character: "stadium"
  },
  storm: {
    cues: { ...commonCues, tip: ["purchase"], sale: ["success"] },
    layers: {
      bid: [L(K("interface-sounds", "switch_001.ogg"), 0.09)],
      action: [L(K("rpg-audio", "cloth2.ogg"), 0.1)],
      share: [L(K("rpg-audio", "cloth1.ogg"), 0.1)],
      tip: [L(K("interface-sounds", "drop_004.ogg"), 0.1)],
      sale: [L(K("impact-sounds", "impactSoft_medium_000.ogg"), 0.11)]
    },
    character: "storm"
  },
  zen: {
    cues: { ...commonCues, tip: ["purchase"], sale: ["success"] },
    layers: {
      bid: [L(K("impact-sounds", "impactWood_light_000.ogg"), 0.16)],
      action: [L(K("interface-sounds", "drop_003.ogg"), 0.12)],
      share: [L(K("rpg-audio", "bookFlip1.ogg"), 0.14)],
      tip: [L(K("interface-sounds", "pluck_001.ogg"), 0.15)],
      sale: [L(K("impact-sounds", "impactWood_medium_000.ogg"), 0.15), L(K("interface-sounds", "pluck_002.ogg"), 0.12, { at: 0.22 })]
    },
    character: "zen"
  }
};

const rendered = [];
for (const [themeName, theme] of Object.entries(themes)) {
  const directory = path.join(outputRoot, themeName);
  fs.mkdirSync(directory, { recursive: true });
  for (const kind of Object.keys(policy)) {
    for (let variant = 0; variant < theme.cues[kind].length; variant += 1) {
      const duration = policy[kind].durations[variant] ?? policy[kind].durations[0];
      const audio = await renderCue(themeName, theme, kind, theme.cues[kind][variant], duration, variant);
      const fileName = variant === 0 ? `${kind}.wav` : `${kind}-${String(variant + 1).padStart(2, "0")}.wav`;
      fs.writeFileSync(path.join(directory, fileName), encodeWav(audio));
      rendered.push({
        theme: themeName,
        kind,
        variant: variant + 1,
        file: `${themeName}/${fileName}`,
        duration: round(audio.left.length / sampleRate),
        estimatedLufs: round(measureLoudness(audio), 2),
        truePeakDbtp: round(toDb(measureTruePeak(audio)), 2),
        stereoWidth: policy[kind].width
      });
    }
  }
}

if (rendered.length !== 90) throw new Error(`Expected 90 cues, rendered ${rendered.length}`);

fs.writeFileSync(path.join(outputRoot, "manifest.json"), `${JSON.stringify({
  schemaVersion: 2,
  generatedAt: renderedDate,
  format: { sampleRate, bitDepth: 16, channels: 2, codec: "PCM" },
  playback: {
    cooldownMs: { bid: 250, action: 600, share: 1000, tip: 0, sale: 0 },
    priority: ["sale", "tip", "share", "bid", "action"],
    protectedKinds: ["sale", "tip"],
    variants: { bid: 3, action: 3, share: 1, tip: 1, sale: 1 }
  },
  targets: policy,
  cues: rendered
}, null, 2)}\n`);

fs.writeFileSync(path.join(sourceRoot, "provenance.json"), `${JSON.stringify({
  schemaVersion: 1,
  generatedAt: renderedDate,
  policy: "Only CC0 or public-domain sources are accepted.",
  sources: [...usedSources].sort().map(sourceProvenance)
}, null, 2)}\n`);

console.log(`Rendered ${rendered.length} broadcast-safe Duck Desk audio cues at 48 kHz stereo.`);

async function renderCue(themeName, theme, kind, cueName, duration, variant) {
  const audio = stereo(Math.round(duration * sampleRate));
  await mixSource(audio, { file: U(themeName, cueName), gain: kind === "action" ? 0.9 : 1, duration, fadeOut: Math.min(0.08, duration * 0.2) });
  for (const layer of theme.layers[kind]) {
    await mixSource(audio, {
      ...layer,
      rate: (layer.rate ?? 1) * (1 + variant * 0.018),
      duration: Math.max(0.04, duration - (layer.at ?? 0)),
      highpass: layer.highpass ?? (theme.character === "storm" ? 80 : 48),
      lowpass: layer.lowpass ?? (kind === "bid" || kind === "action" ? 7200 : 11_000),
      fadeOut: Math.min(0.09, duration * 0.2)
    });
  }
  addCharacter(audio, theme.character, kind, variant);
  master(audio, policy[kind].targetLufs, policy[kind].width);
  return audio;
}

function addCharacter(audio, character, kind, variant) {
  const duration = audio.left.length / sampleRate;
  if (character === "electric") {
    addSweep(audio, 0.01, Math.min(duration - 0.02, kind === "sale" ? 0.56 : 0.12), 540 + variant * 45, kind === "sale" ? 1480 : 920, kind === "sale" ? 0.09 : 0.035, "sine", 0.18);
  } else if (character === "arcade") {
    addTones(audio, kind === "sale" ? [523, 659, 784, 1047] : [440 + variant * 35], 0.095, kind === "sale" ? 0.085 : 0.055, kind === "sale" ? 0.055 : 0.025, "square", 0);
  } else if (character === "broadcast") {
    addNoise(audio, "tap", 0, Math.min(0.07, duration), 0.025, `broadcast:${kind}:${variant}`, 1500, 0.06);
  } else if (character === "crystal") {
    addTones(audio, kind === "sale" ? [988, 1319, 1568] : [880 + variant * 90], 0.13, kind === "sale" ? 0.24 : 0.1, kind === "sale" ? 0.055 : 0.025, "sine", 0.35);
  } else if (character === "party") {
    addSweep(audio, 0.01, Math.min(0.18, duration - 0.02), 260 + variant * 18, 390 + variant * 24, 0.035, "triangle", -0.12);
    if (kind === "sale") addNoise(audio, "confetti", 0.05, 0.38, 0.05, "party-sale", 4600, 0.68);
  } else if (character === "luxury" && (kind === "sale" || kind === "tip")) {
    addTones(audio, kind === "sale" ? [392, 494, 659] : [494, 659], 0.18, 0.3, 0.04, "sine", 0.28);
  } else if (character === "retro") {
    addNoise(audio, "tap", 0, Math.min(0.055, duration), 0.03, `retro:${kind}:${variant}`, 900, 0.04);
  } else if (character === "stadium" && ["share", "tip", "sale"].includes(kind)) {
    addNoise(audio, "crowd", kind === "sale" ? 0.14 : 0.05, kind === "sale" ? 0.6 : Math.min(0.38, duration - 0.08), kind === "sale" ? 0.12 : 0.06, `stadium:${kind}`, 1800, 0.72);
  } else if (character === "storm") {
    if (kind === "bid") addNoise(audio, "crackle", 0.01, 0.1, 0.035, `storm-bid:${variant}`, 2400, 0.16);
    if (kind === "action" || kind === "share") addNoise(audio, "wind", 0.01, duration - 0.03, kind === "share" ? 0.07 : 0.035, `storm:${kind}:${variant}`, 900, 0.5);
    if (kind === "tip") addNoise(audio, "thunder", 0.17, 0.34, 0.06, "storm-tip", 170, 0.25);
    if (kind === "sale") addNoise(audio, "thunder", 0.06, 0.72, 0.18, "storm-sale", 135, 0.62);
  } else if (character === "zen") {
    if (kind === "share") addNoise(audio, "brush", 0.02, 0.32, 0.045, "zen-share", 2100, 0.38);
    if (kind === "sale") addTones(audio, [392, 523, 659], 0.2, 0.32, 0.045, "sine", 0.24);
  }
}

function stereo(length) {
  return { left: new Float64Array(length), right: new Float64Array(length) };
}

async function loadSource(relativePath) {
  if (sourceCache.has(relativePath)) return sourceCache.get(relativePath);
  const absolutePath = path.join(sourceRoot, relativePath);
  if (!fs.existsSync(absolutePath)) throw new Error(`Missing audio source: ${relativePath}`);
  const bytes = fs.readFileSync(absolutePath);
  let decoded;
  if (path.extname(relativePath).toLowerCase() === ".wav") {
    decoded = decodeWav(bytes);
  } else if (path.extname(relativePath).toLowerCase() === ".ogg") {
    const audioBuffer = await decodeVorbis(bytes);
    decoded = {
      left: Float64Array.from(audioBuffer.channelData[0] ?? []),
      right: Float64Array.from(audioBuffer.channelData[1] ?? audioBuffer.channelData[0] ?? []),
      sampleRate: audioBuffer.sampleRate
    };
  } else {
    throw new Error(`Unsupported source format: ${relativePath}`);
  }
  trimSilence(decoded);
  removeDc(decoded.left);
  removeDc(decoded.right);
  if (!decoded.left.length || !decoded.right.length) throw new Error(`Malformed audio source: ${relativePath}`);
  usedSources.add(relativePath);
  sourceCache.set(relativePath, decoded);
  return decoded;
}

function decodeWav(bytes) {
  if (bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WAVE") throw new Error("Invalid WAV header");
  let offset = 12;
  let format;
  let dataOffset;
  let dataSize;
  while (offset + 8 <= bytes.length) {
    const id = bytes.toString("ascii", offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    if (id === "fmt ") format = { codec: bytes.readUInt16LE(offset + 8), channels: bytes.readUInt16LE(offset + 10), sampleRate: bytes.readUInt32LE(offset + 12), bits: bytes.readUInt16LE(offset + 22) };
    if (id === "data") {
      dataOffset = offset + 8;
      dataSize = size;
      break;
    }
    offset += 8 + size + (size % 2);
  }
  if (!format || dataOffset === undefined || dataSize === undefined || format.codec !== 1 || format.bits !== 16 || ![1, 2].includes(format.channels)) throw new Error("Only 16-bit PCM mono/stereo WAV sources are supported");
  const length = Math.floor(dataSize / (format.channels * 2));
  const left = new Float64Array(length);
  const right = new Float64Array(length);
  for (let frame = 0; frame < length; frame += 1) {
    const position = dataOffset + frame * format.channels * 2;
    left[frame] = bytes.readInt16LE(position) / 32768;
    right[frame] = format.channels === 2 ? bytes.readInt16LE(position + 2) / 32768 : left[frame];
  }
  return { left, right, sampleRate: format.sampleRate };
}

function trimSilence(source) {
  let first = -1;
  for (let index = 0; index < source.left.length; index += 1) {
    if (Math.max(Math.abs(source.left[index]), Math.abs(source.right[index])) >= 0.0007) {
      first = index;
      break;
    }
  }
  if (first > 0) {
    const start = Math.max(0, first - Math.round(source.sampleRate * 0.004));
    source.left = source.left.subarray(start);
    source.right = source.right.subarray(start);
  }
}

async function mixSource(output, options) {
  const source = await loadSource(options.file);
  const outputStart = Math.max(0, Math.round((options.at ?? 0) * sampleRate));
  const sourceStart = Math.max(0, Math.round((options.sourceStart ?? 0) * source.sampleRate));
  const rate = options.rate ?? 1;
  const outputLength = Math.min(output.left.length - outputStart, Math.round((options.duration ?? output.left.length / sampleRate) * sampleRate));
  const fadeIn = Math.round((options.fadeIn ?? 0.003) * sampleRate);
  const fadeOut = Math.round((options.fadeOut ?? 0.04) * sampleRate);
  const filters = [{ lp: 0, hp: 0, previous: 0 }, { lp: 0, hp: 0, previous: 0 }];
  for (let index = 0; index < outputLength; index += 1) {
    const sourcePosition = sourceStart + index * source.sampleRate * rate / sampleRate;
    if (sourcePosition >= source.left.length - 1) break;
    const envelope = Math.max(0, Math.min(1, fadeIn ? index / fadeIn : 1, fadeOut ? (outputLength - 1 - index) / fadeOut : 1));
    output.left[outputStart + index] += filter(interpolate(source.left, sourcePosition), filters[0], options) * (options.gain ?? 1) * envelope;
    output.right[outputStart + index] += filter(interpolate(source.right, sourcePosition), filters[1], options) * (options.gain ?? 1) * envelope;
  }
}

function interpolate(samples, position) {
  const index = Math.floor(position);
  const fraction = position - index;
  return (samples[index] ?? 0) + ((samples[index + 1] ?? samples[index] ?? 0) - (samples[index] ?? 0)) * fraction;
}

function filter(value, state, options) {
  if (options.highpass) {
    const alpha = 1 / (1 + 2 * Math.PI * options.highpass / sampleRate);
    state.hp = alpha * (state.hp + value - state.previous);
    state.previous = value;
    value = state.hp;
  }
  if (options.lowpass) {
    const alpha = 1 - Math.exp(-2 * Math.PI * options.lowpass / sampleRate);
    state.lp += alpha * (value - state.lp);
    value = state.lp;
  }
  return value;
}

function addSweep(audio, at, duration, from, to, gain, waveform, pan) {
  const start = Math.round(at * sampleRate);
  const length = Math.max(1, Math.round(duration * sampleRate));
  let phase = 0;
  for (let index = 0; index < length && start + index < audio.left.length; index += 1) {
    const progress = index / Math.max(1, length - 1);
    phase += 2 * Math.PI * (from * (to / from) ** progress) / sampleRate;
    panMix(audio, start + index, wave(phase, waveform) * Math.sin(Math.PI * progress) ** 1.4 * gain, pan);
  }
}

function addTones(audio, notes, step, lengthSeconds, gain, waveform, pan) {
  notes.forEach((frequency, noteIndex) => {
    const start = Math.round(noteIndex * step * sampleRate);
    const length = Math.round(lengthSeconds * sampleRate);
    let phase = 0;
    for (let index = 0; index < length && start + index < audio.left.length; index += 1) {
      const progress = index / Math.max(1, length - 1);
      phase += 2 * Math.PI * frequency / sampleRate;
      const envelope = Math.sin(Math.PI * progress) * Math.exp(-progress * 1.4);
      panMix(audio, start + index, wave(phase, waveform) * envelope * gain, pan * (noteIndex % 2 ? 1 : -1));
    }
  });
}

function addNoise(audio, type, at, duration, gain, seed, center, spread) {
  const randomLeft = mulberry32(hashString(`${seed}:left`));
  const randomRight = mulberry32(hashString(`${seed}:right`));
  const start = Math.round(at * sampleRate);
  const length = Math.min(audio.left.length - start, Math.round(duration * sampleRate));
  const filters = [{ low: 0, slow: 0 }, { low: 0, slow: 0 }];
  for (let index = 0; index < length; index += 1) {
    const progress = index / Math.max(1, length - 1);
    const frequency = center * (type === "wind" ? 0.75 + 0.5 * Math.sin(progress * Math.PI) : 1);
    const left = shapedNoise(randomLeft() * 2 - 1, filters[0], frequency, type);
    const right = shapedNoise(randomRight() * 2 - 1, filters[1], frequency * 1.04, type);
    const mid = (left + right) * 0.5;
    const side = (left - right) * spread * 0.5;
    const envelope = noiseEnvelope(type, progress) * gain;
    audio.left[start + index] += (mid + side) * envelope;
    audio.right[start + index] += (mid - side) * envelope;
  }
}

function shapedNoise(value, state, center, type) {
  const alpha = 1 - Math.exp(-2 * Math.PI * Math.max(70, center) / sampleRate);
  state.low += alpha * (value - state.low);
  const slowAlpha = 1 - Math.exp(-2 * Math.PI * Math.max(30, center * 0.16) / sampleRate);
  state.slow += slowAlpha * (state.low - state.slow);
  const band = state.low - state.slow;
  if (type === "thunder") return state.slow * 1.8 + band * 0.35;
  if (type === "crowd") return state.low * 0.55 + band * 0.7;
  if (type === "tap") return band * 1.6;
  return band;
}

function noiseEnvelope(type, progress) {
  if (type === "tap" || type === "crackle") return Math.exp(-progress * 13) * Math.sin(Math.PI * Math.min(1, progress * 5));
  if (type === "thunder") return Math.sin(Math.PI * progress) ** 0.45 * Math.exp(-progress * 0.7);
  if (type === "confetti") return Math.sin(Math.PI * progress) ** 0.7 * (0.55 + 0.45 * Math.sin(progress * 39) ** 2);
  if (type === "crowd") return Math.sin(Math.PI * progress) ** 0.7;
  return Math.sin(Math.PI * progress) ** 1.1;
}

function panMix(audio, index, sample, pan) {
  audio.left[index] += sample * Math.sqrt((1 - pan) * 0.5);
  audio.right[index] += sample * Math.sqrt((1 + pan) * 0.5);
}

function wave(phase, waveform) {
  if (waveform === "square") return Math.sin(phase) >= 0 ? 1 : -1;
  if (waveform === "triangle") return 2 * Math.asin(Math.sin(phase)) / Math.PI;
  return Math.sin(phase);
}

function master(audio, targetLufs, width) {
  removeDc(audio.left);
  removeDc(audio.right);
  highpass(audio.left, 42);
  highpass(audio.right, 42);
  setWidth(audio, width);
  edgeFades(audio, 0.003, Math.min(0.055, audio.left.length / sampleRate * 0.16));
  const measured = measureLoudness(audio);
  applyGain(audio, Math.min(8, Number.isFinite(measured) ? Math.pow(10, (targetLufs - measured) / 20) : 1));
  softLimit(audio);
  const ceiling = Math.pow(10, -3.2 / 20);
  const peak = measureTruePeak(audio);
  if (peak > ceiling) applyGain(audio, ceiling / peak);
}

function setWidth(audio, width) {
  for (let index = 0; index < audio.left.length; index += 1) {
    const mid = (audio.left[index] + audio.right[index]) * 0.5;
    const side = (audio.left[index] - audio.right[index]) * 0.5 * width;
    audio.left[index] = mid + side;
    audio.right[index] = mid - side;
  }
}

function edgeFades(audio, fadeInSeconds, fadeOutSeconds) {
  const fadeIn = Math.round(fadeInSeconds * sampleRate);
  const fadeOut = Math.round(fadeOutSeconds * sampleRate);
  for (let index = 0; index < fadeIn; index += 1) {
    const gain = Math.sin(index / Math.max(1, fadeIn - 1) * Math.PI * 0.5) ** 2;
    audio.left[index] *= gain;
    audio.right[index] *= gain;
  }
  for (let index = 0; index < fadeOut; index += 1) {
    const gain = Math.sin(index / Math.max(1, fadeOut - 1) * Math.PI * 0.5) ** 2;
    const target = audio.left.length - 1 - index;
    audio.left[target] *= gain;
    audio.right[target] *= gain;
  }
}

function highpass(samples, cutoff) {
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

function removeDc(samples) {
  if (!samples.length) return;
  let sum = 0;
  for (const sample of samples) sum += sample;
  const mean = sum / samples.length;
  for (let index = 0; index < samples.length; index += 1) samples[index] -= mean;
}

function applyGain(audio, gain) {
  for (let index = 0; index < audio.left.length; index += 1) {
    audio.left[index] *= gain;
    audio.right[index] *= gain;
  }
}

function softLimit(audio) {
  const drive = 1.18;
  for (let index = 0; index < audio.left.length; index += 1) {
    audio.left[index] = Math.tanh(audio.left[index] * drive) / drive;
    audio.right[index] = Math.tanh(audio.right[index] * drive) / drive;
  }
}

function measureLoudness(audio) {
  let energy = 0;
  for (let index = 0; index < audio.left.length; index += 1) energy += audio.left[index] ** 2 + audio.right[index] ** 2;
  const meanSquare = energy / Math.max(1, audio.left.length);
  return meanSquare > 0 ? -0.691 + 10 * Math.log10(meanSquare) : -Infinity;
}

function measureTruePeak(audio) {
  let peak = 0;
  for (const channel of [audio.left, audio.right]) {
    for (let index = 0; index < channel.length - 1; index += 1) {
      const from = channel[index];
      const to = channel[index + 1];
      for (let step = 0; step < 4; step += 1) peak = Math.max(peak, Math.abs(from + (to - from) * step / 4));
    }
  }
  return peak;
}

function encodeWav(audio) {
  const dataSize = audio.left.length * 4;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(2, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 4, 28);
  buffer.writeUInt16LE(4, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let index = 0; index < audio.left.length; index += 1) {
    buffer.writeInt16LE(floatToInt16(audio.left[index]), 44 + index * 4);
    buffer.writeInt16LE(floatToInt16(audio.right[index]), 46 + index * 4);
  }
  return buffer;
}

function floatToInt16(value) {
  const clamped = Math.max(-1, Math.min(1, value));
  return Math.round(clamped * (clamped < 0 ? 32768 : 32767));
}

function sourceProvenance(relativePath) {
  const sha256 = crypto.createHash("sha256").update(fs.readFileSync(path.join(sourceRoot, relativePath))).digest("hex");
  const base = { file: relativePath.split(path.sep).join("/"), sha256, downloadedOrRenderedAt: renderedDate };
  if (relativePath.startsWith("uisfx/")) return { ...base, creator: "UISFX contributors", license: "CC0-1.0", sourceUrl: "https://github.com/romainsimon/uisfx", upstreamCommit: "99d287a1d27ef49c02a5262184a7fda91612321e", note: "Lossless 48 kHz render of a deterministic CC0 audio recipe." };
  if (relativePath.startsWith("public-domain-recordings/")) return { ...base, creator: "sound-cc0 contributors", license: "CC0 / Unlicense", sourceUrl: "https://github.com/code4fukui/sound-cc0", upstreamCommit: "0bdbbe370c42897e12b7c5b0b26d96228e0d2931" };
  const pack = relativePath.split(path.sep)[1];
  const urls = {
    "casino-audio": "https://kenney.nl/assets/casino-audio",
    "digital-audio": "https://kenney.nl/assets/digital-audio",
    "impact-sounds": "https://kenney.nl/assets/impact-sounds",
    "interface-sounds": "https://kenney.nl/assets/interface-sounds",
    "rpg-audio": "https://kenney.nl/assets/rpg-audio",
    "ui-audio": "https://kenney.nl/assets/ui-audio"
  };
  return { ...base, creator: "Kenney Vleugels", license: "CC0-1.0", sourceUrl: urls[pack] };
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function toDb(value) {
  return value > 0 ? 20 * Math.log10(value) : -Infinity;
}

function round(value, digits = 3) {
  return Number(value.toFixed(digits));
}
