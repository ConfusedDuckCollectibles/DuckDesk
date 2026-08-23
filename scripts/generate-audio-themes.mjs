import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sampleRate = 32_000;
const soundKinds = ["sale", "bid", "action", "tip", "share"];
const themeNames = [
  "neon_pulse",
  "arcade_8bit",
  "broadcast",
  "crystal",
  "duck_party",
  "luxury",
  "retro",
  "stadium",
  "storm",
  "zen"
];
const eventMotifs = {
  sale: [0, 4, 7, 12],
  bid: [0, 7],
  action: [0, 3, 7],
  tip: [7, 12, 16],
  share: [0, 5, 9, 12]
};
const eventDurations = {
  sale: 1.05,
  bid: 0.42,
  action: 0.72,
  tip: 0.86,
  share: 0.82
};

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(projectRoot, "apps", "overlay", "public", "audio");

for (const theme of themeNames) {
  const themeDirectory = path.join(outputRoot, theme);
  fs.mkdirSync(themeDirectory, { recursive: true });
  for (const kind of soundKinds) {
    const duration = eventDurations[kind] + (theme === "crystal" || theme === "zen" ? 0.55 : 0);
    const samples = new Float64Array(Math.ceil(duration * sampleRate));
    const random = createRandom(`${theme}:${kind}`);
    renderTheme(theme, kind, samples, random);
    normalize(samples);
    fs.writeFileSync(path.join(themeDirectory, `${kind}.wav`), encodeWav(samples));
  }
}

console.log(`Rendered ${themeNames.length * soundKinds.length} original Duck Desk audio cues.`);

function renderTheme(theme, kind, samples, random) {
  const motif = eventMotifs[kind];
  if (theme === "neon_pulse") {
    addKick(samples, 0.01, 0.18, 95, 42, 0.48);
    arpeggio(samples, motif, 330, 0.035, 0.075, 0.18, {
      wave: "triangle",
      amp: 0.24,
      endRatio: 1.08,
      vibrato: 8,
      vibratoRate: 24
    });
    addTone(samples, { start: 0.02, duration: 0.32, frequency: 82, endFrequency: 164, wave: "sine", amp: 0.22, decay: 2.6 });
    addNoise(samples, random, { start: 0.025, duration: 0.09, amp: 0.08, filter: 0.42, attack: 0.01 });
    addEcho(samples, 0.12, 0.28, 2);
    return;
  }

  if (theme === "arcade_8bit") {
    arpeggio(samples, motif, 392, 0.018, 0.065, 0.13, { wave: "square", amp: 0.16, decay: 1.2 });
    addTone(samples, { start: 0.015, duration: 0.12, frequency: kind === "sale" ? 1047 : 784, wave: "square", amp: 0.11, decay: 8 });
    if (kind === "action" || kind === "share") {
      arpeggio(samples, [...motif].reverse(), 196, 0.31, 0.045, 0.085, { wave: "square", amp: 0.1, decay: 3 });
    }
    bitCrush(samples, 8, 4);
    return;
  }

  if (theme === "broadcast") {
    addWhoosh(samples, random, 0, Math.min(0.3, samples.length / sampleRate * 0.4), 0.18);
    addKick(samples, 0.16, 0.16, 72, 48, 0.32);
    chord(samples, motif.slice(-3), 220, 0.18, 0.42, { wave: "sine", amp: 0.12, decay: 2.2 });
    addTone(samples, { start: 0.18, duration: 0.32, frequency: note(440, motif.at(-1)), wave: "triangle", amp: 0.16, decay: 3.4 });
    return;
  }

  if (theme === "crystal") {
    motif.slice(0, kind === "bid" ? 2 : 4).forEach((offset, index) => {
      addBell(samples, 0.025 + index * 0.105, note(660, offset), 0.92 - index * 0.06, 0.22);
    });
    addEcho(samples, 0.17, 0.24, 3);
    return;
  }

  if (theme === "duck_party") {
    const starts = kind === "bid" ? [0.02] : [0.02, 0.19, 0.36];
    starts.forEach((start, index) => {
      const high = note(510, motif[index % motif.length]);
      addTone(samples, {
        start,
        duration: 0.2,
        frequency: high,
        endFrequency: high * (index % 2 === 0 ? 0.48 : 0.7),
        wave: "triangle",
        amp: 0.24,
        vibrato: 28,
        vibratoRate: 19,
        decay: 2
      });
      addTone(samples, { start: start + 0.025, duration: 0.15, frequency: high * 1.9, endFrequency: high * 1.1, wave: "sine", amp: 0.08, decay: 4 });
    });
    addPop(samples, starts.at(-1) + 0.17, 0.14);
    return;
  }

  if (theme === "luxury") {
    chord(samples, [0, 4, 9], 196, 0.02, 0.65, { wave: "triangle", amp: 0.09, attack: 0.04, decay: 1.8 });
    motif.slice(0, 3).forEach((offset, index) => {
      addBell(samples, 0.08 + index * 0.16, note(392, offset), 0.55, 0.11);
    });
    addTone(samples, { start: 0, duration: 0.72, frequency: 98, wave: "sine", amp: 0.14, attack: 0.06, decay: 2.6 });
    return;
  }

  if (theme === "retro") {
    addNoise(samples, random, { start: 0, duration: samples.length / sampleRate, amp: 0.018, filter: 0.08, attack: 0.01, release: 0.01 });
    arpeggio(samples, motif, 247, 0.03, 0.085, 0.19, { wave: "saw", amp: 0.1, decay: 2.1 });
    arpeggio(samples, motif.map((offset) => offset - 12), 247, 0.03, 0.085, 0.19, { wave: "square", amp: 0.07, decay: 2.4 });
    addClick(samples, 0.015, 0.2, random);
    addEcho(samples, 0.095, 0.18, 2);
    return;
  }

  if (theme === "stadium") {
    addKick(samples, 0.015, 0.25, 92, 40, 0.56);
    if (kind !== "bid") {
      addSnare(samples, random, 0.25, 0.17, 0.3);
      addKick(samples, 0.48, 0.22, 86, 38, 0.42);
    }
    chord(samples, motif.slice(-3), 147, 0.12, 0.38, { wave: "saw", amp: 0.075, attack: 0.025, decay: 1.5 });
    addNoise(samples, random, { start: 0.1, duration: 0.5, amp: 0.05, filter: 0.3, attack: 0.16, release: 0.2 });
    return;
  }

  if (theme === "storm") {
    addNoise(samples, random, { start: 0, duration: Math.min(0.11, samples.length / sampleRate), amp: 0.55, filter: 0.78, attack: 0.002, release: 0.09 });
    addNoise(samples, random, { start: 0.07, duration: samples.length / sampleRate - 0.07, amp: 0.2, filter: 0.035, attack: 0.02, release: 0.28 });
    addTone(samples, { start: 0.05, duration: 0.68, frequency: kind === "bid" ? 78 : 52, endFrequency: 34, wave: "sine", amp: 0.4, attack: 0.008, decay: 2.1, vibrato: 3, vibratoRate: 7 });
    if (kind === "sale" || kind === "tip") {
      addTone(samples, { start: 0.11, duration: 0.44, frequency: 196, endFrequency: 74, wave: "saw", amp: 0.06, decay: 3.8 });
    }
    return;
  }

  chord(samples, [0, 7, 14], 174, 0.02, 1.15, { wave: "sine", amp: 0.075, attack: 0.16, decay: 1.25 });
  motif.slice(0, kind === "bid" ? 1 : 3).forEach((offset, index) => {
    addBell(samples, 0.08 + index * 0.22, note(349, offset), 0.9, 0.09);
  });
  addNoise(samples, random, { start: 0, duration: samples.length / sampleRate, amp: 0.012, filter: 0.012, attack: 0.25, release: 0.32 });
}

function arpeggio(samples, offsets, base, start, step, duration, options) {
  offsets.forEach((offset, index) => {
    const frequency = note(base, offset);
    addTone(samples, {
      start: start + index * step,
      duration,
      frequency,
      endFrequency: frequency * (options.endRatio ?? 1),
      ...options
    });
  });
}

function chord(samples, offsets, base, start, duration, options) {
  offsets.forEach((offset) => {
    addTone(samples, { start, duration, frequency: note(base, offset), ...options });
  });
}

function addTone(samples, options) {
  const startSample = Math.max(0, Math.floor(options.start * sampleRate));
  const length = Math.min(samples.length - startSample, Math.floor(options.duration * sampleRate));
  const attack = options.attack ?? Math.min(0.018, options.duration * 0.18);
  const release = options.release ?? Math.min(0.12, options.duration * 0.42);
  let phase = options.phase ?? 0;
  for (let index = 0; index < length; index += 1) {
    const time = index / sampleRate;
    const progress = length <= 1 ? 1 : index / (length - 1);
    const frequency = options.frequency * Math.pow((options.endFrequency ?? options.frequency) / options.frequency, progress)
      + (options.vibrato ?? 0) * Math.sin(2 * Math.PI * (options.vibratoRate ?? 6) * time);
    phase += 2 * Math.PI * frequency / sampleRate;
    const envelope = makeEnvelope(time, options.duration, attack, release, options.decay ?? 0);
    samples[startSample + index] += oscillator(options.wave ?? "sine", phase) * (options.amp ?? 0.2) * envelope;
  }
}

function addBell(samples, start, frequency, duration, amp) {
  const partials = [
    [1, 1],
    [2.01, 0.42],
    [3.93, 0.2],
    [5.42, 0.11]
  ];
  partials.forEach(([ratio, level], index) => {
    addTone(samples, {
      start,
      duration: duration * (1 - index * 0.08),
      frequency: frequency * ratio,
      wave: "sine",
      amp: amp * level,
      attack: 0.003,
      release: duration * 0.72,
      decay: 4.5 + index
    });
  });
}

function addKick(samples, start, duration, frequency, endFrequency, amp) {
  addTone(samples, { start, duration, frequency, endFrequency, wave: "sine", amp, attack: 0.002, release: duration * 0.72, decay: 5 });
}

function addSnare(samples, random, start, duration, amp) {
  addNoise(samples, random, { start, duration, amp, filter: 0.7, attack: 0.002, release: duration * 0.82 });
  addTone(samples, { start, duration: duration * 0.65, frequency: 182, wave: "triangle", amp: amp * 0.25, decay: 7 });
}

function addPop(samples, start, amp) {
  addTone(samples, { start, duration: 0.1, frequency: 980, endFrequency: 180, wave: "sine", amp, attack: 0.001, release: 0.08, decay: 5 });
}

function addClick(samples, start, amp, random) {
  addNoise(samples, random, { start, duration: 0.025, amp, filter: 0.9, attack: 0.001, release: 0.02 });
}

function addWhoosh(samples, random, start, duration, amp) {
  addNoise(samples, random, { start, duration, amp, filter: 0.24, attack: duration * 0.7, release: duration * 0.22 });
  addTone(samples, { start: start + duration * 0.5, duration: duration * 0.5, frequency: 160, endFrequency: 720, wave: "sine", amp: amp * 0.22, attack: duration * 0.18, release: duration * 0.2 });
}

function addNoise(samples, random, options) {
  const startSample = Math.max(0, Math.floor(options.start * sampleRate));
  const length = Math.min(samples.length - startSample, Math.floor(options.duration * sampleRate));
  let filtered = 0;
  for (let index = 0; index < length; index += 1) {
    const time = index / sampleRate;
    const white = random() * 2 - 1;
    filtered += (white - filtered) * (options.filter ?? 0.5);
    const envelope = makeEnvelope(time, options.duration, options.attack ?? 0.01, options.release ?? 0.08, options.decay ?? 0);
    samples[startSample + index] += filtered * options.amp * envelope;
  }
}

function addEcho(samples, delaySeconds, feedback, repeats) {
  const delay = Math.floor(delaySeconds * sampleRate);
  for (let repeat = 1; repeat <= repeats; repeat += 1) {
    const gain = Math.pow(feedback, repeat);
    for (let index = delay * repeat; index < samples.length; index += 1) {
      samples[index] += samples[index - delay * repeat] * gain;
    }
  }
}

function bitCrush(samples, bits, hold) {
  const levels = Math.pow(2, bits - 1);
  let held = 0;
  for (let index = 0; index < samples.length; index += 1) {
    if (index % hold === 0) {
      held = Math.round(samples[index] * levels) / levels;
    }
    samples[index] = held;
  }
}

function makeEnvelope(time, duration, attack, release, decay) {
  const attackLevel = attack <= 0 ? 1 : Math.min(1, time / attack);
  const releaseStart = Math.max(0, duration - release);
  const releaseLevel = time <= releaseStart ? 1 : Math.max(0, (duration - time) / Math.max(release, 0.001));
  const decayLevel = decay > 0 ? Math.exp(-decay * time / Math.max(duration, 0.001)) : 1;
  return attackLevel * releaseLevel * decayLevel;
}

function oscillator(wave, phase) {
  if (wave === "square") {
    return Math.sin(phase) >= 0 ? 1 : -1;
  }
  if (wave === "triangle") {
    return 2 * Math.asin(Math.sin(phase)) / Math.PI;
  }
  if (wave === "saw") {
    return 2 * (phase / (2 * Math.PI) - Math.floor(phase / (2 * Math.PI) + 0.5));
  }
  return Math.sin(phase);
}

function note(base, semitones = 0) {
  return base * Math.pow(2, semitones / 12);
}

function normalize(samples) {
  let peak = 0;
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] = Math.tanh(samples[index] * 1.15);
    peak = Math.max(peak, Math.abs(samples[index]));
  }
  const gain = peak > 0 ? 0.9 / peak : 1;
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] *= gain;
  }
}

function encodeWav(samples) {
  const bytesPerSample = 2;
  const buffer = Buffer.alloc(44 + samples.length * bytesPerSample);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(buffer.length - 8, 4);
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
  buffer.writeUInt32LE(samples.length * bytesPerSample, 40);
  for (let index = 0; index < samples.length; index += 1) {
    const value = Math.max(-1, Math.min(1, samples[index]));
    buffer.writeInt16LE(Math.round(value * 32767), 44 + index * bytesPerSample);
  }
  return buffer;
}

function createRandom(seedText) {
  let seed = 2166136261;
  for (const character of seedText) {
    seed ^= character.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}
