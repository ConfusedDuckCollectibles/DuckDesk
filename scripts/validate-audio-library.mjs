import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const audioRoot = path.join(root, "apps", "overlay", "public", "audio");
const sourceRoot = path.join(root, "scripts", "audio-sources");
const manifest = JSON.parse(fs.readFileSync(path.join(audioRoot, "manifest.json"), "utf8"));
const provenance = JSON.parse(fs.readFileSync(path.join(sourceRoot, "provenance.json"), "utf8"));

const expectedThemes = ["neon_pulse", "arcade_8bit", "broadcast", "crystal", "duck_party", "luxury", "retro", "stadium", "storm", "zen"];
const limits = {
  bid: { min: 0.09, max: 0.18, target: -25, variants: 3 },
  action: { min: 0.12, max: 0.25, target: -27, variants: 3 },
  share: { min: 0.25, max: 0.45, target: -24, variants: 1 },
  tip: { min: 0.4, max: 0.7, target: -22, variants: 1 },
  sale: { min: 0.65, max: 0.95, target: -20, variants: 1 }
};

assert.equal(manifest.schemaVersion, 2);
assert.deepEqual(manifest.format, { sampleRate: 48000, bitDepth: 16, channels: 2, codec: "PCM" });
assert.equal(manifest.cues.length, 90);
assert.deepEqual(manifest.playback.cooldownMs, { bid: 250, action: 600, share: 1000, tip: 0, sale: 0 });

const diskFiles = listFiles(audioRoot).filter((file) => file.endsWith(".wav")).map((file) => path.relative(audioRoot, file).split(path.sep).join("/")).sort();
const manifestFiles = manifest.cues.map((cue) => cue.file).sort();
assert.equal(diskFiles.length, 90, "The bundled library must contain exactly 90 WAV files");
assert.deepEqual(diskFiles, manifestFiles, "Audio manifest and bundled WAV files differ");

const reports = [];
for (const theme of expectedThemes) {
  const themeCues = manifest.cues.filter((cue) => cue.theme === theme);
  assert.equal(themeCues.length, 9, `${theme} must contain nine cues`);
  for (const [kind, limit] of Object.entries(limits)) {
    assert.equal(themeCues.filter((cue) => cue.kind === kind).length, limit.variants, `${theme}/${kind} variant count is wrong`);
  }
}

for (const cue of manifest.cues) {
  assert(expectedThemes.includes(cue.theme), `Unknown theme ${cue.theme}`);
  const limit = limits[cue.kind];
  assert(limit, `Unknown sound kind ${cue.kind}`);
  const wav = decodeWav(fs.readFileSync(path.join(audioRoot, cue.file)));
  const duration = wav.left.length / wav.sampleRate;
  const loudness = measureLoudness(wav);
  const peak = measureTruePeak(wav);
  const peakDb = toDb(peak);
  const edgePeak = measureEdgePeak(wav, 0.00025);
  const foldDownRatio = monoFoldDownRatio(wav);

  assert.equal(wav.sampleRate, 48000, `${cue.file} sample rate`);
  assert.equal(wav.channels, 2, `${cue.file} channel count`);
  assert.equal(wav.bits, 16, `${cue.file} bit depth`);
  assert(duration >= limit.min - 0.001 && duration <= limit.max + 0.001, `${cue.file} duration ${duration.toFixed(3)}s`);
  assert(Math.abs(loudness - limit.target) <= 0.75, `${cue.file} loudness ${loudness.toFixed(2)}`);
  assert(peakDb <= -3, `${cue.file} true peak ${peakDb.toFixed(2)} dBTP`);
  assert(peakDb >= -30, `${cue.file} appears silent at ${peakDb.toFixed(2)} dBTP`);
  assert(edgePeak <= 0.0002, `${cue.file} does not begin and end at digital silence`);
  assert(foldDownRatio >= 0.5, `${cue.file} loses too much energy in mono`);
  assert(!wav.clipped, `${cue.file} contains clipped PCM samples`);
  assert(Math.abs(cue.duration - duration) <= 0.002, `${cue.file} duration manifest mismatch`);
  assert(Math.abs(cue.estimatedLufs - loudness) <= 0.12, `${cue.file} loudness manifest mismatch`);
  assert(Math.abs(cue.truePeakDbtp - peakDb) <= 0.12, `${cue.file} peak manifest mismatch`);
  reports.push({ kind: cue.kind, loudness, peakDb });
}

assert(provenance.sources.length >= 100, "Provenance manifest does not cover the source bank");
for (const source of provenance.sources) {
  assert.equal(typeof source.creator, "string");
  assert(source.creator.length > 0, `${source.file} creator is missing`);
  assert(/CC0|Unlicense/.test(source.license), `${source.file} is not CC0/public domain`);
  assert(source.sourceUrl.startsWith("https://"), `${source.file} source URL is invalid`);
  const absolutePath = path.join(sourceRoot, source.file);
  assert(fs.existsSync(absolutePath), `${source.file} is missing`);
  const bytes = fs.readFileSync(absolutePath);
  assert(bytes.length > 44, `${source.file} is malformed`);
  assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), source.sha256, `${source.file} hash mismatch`);
}

for (const [kind, limit] of Object.entries(limits)) {
  const cues = reports.filter((report) => report.kind === kind);
  const average = cues.reduce((total, cue) => total + cue.loudness, 0) / cues.length;
  console.log(`${kind.padEnd(6)} ${cues.length} cues, average ${average.toFixed(2)} LUFS, target ${limit.target} LUFS`);
}
console.log(`Validated ${manifest.cues.length} mastered cues and ${provenance.sources.length} CC0/public-domain source records.`);

function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(child) : [child];
  });
}

function decodeWav(bytes) {
  assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
  assert.equal(bytes.toString("ascii", 8, 12), "WAVE");
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
  assert(format && dataOffset !== undefined && dataSize !== undefined, "Malformed WAV chunks");
  assert.equal(format.codec, 1, "WAV must use PCM");
  const frames = Math.floor(dataSize / (format.channels * format.bits / 8));
  const left = new Float64Array(frames);
  const right = new Float64Array(frames);
  let clipped = false;
  for (let frame = 0; frame < frames; frame += 1) {
    const position = dataOffset + frame * format.channels * 2;
    const leftInt = bytes.readInt16LE(position);
    const rightInt = bytes.readInt16LE(position + 2);
    left[frame] = leftInt / 32768;
    right[frame] = rightInt / 32768;
    clipped ||= Math.abs(leftInt) >= 32767 || Math.abs(rightInt) >= 32767;
  }
  return { ...format, left, right, clipped };
}

function measureLoudness(audio) {
  let energy = 0;
  for (let index = 0; index < audio.left.length; index += 1) energy += audio.left[index] ** 2 + audio.right[index] ** 2;
  return -0.691 + 10 * Math.log10(energy / audio.left.length);
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

function measureEdgePeak(audio, seconds) {
  const frames = Math.round(seconds * audio.sampleRate);
  let peak = 0;
  for (let index = 0; index < frames; index += 1) {
    peak = Math.max(peak, Math.abs(audio.left[index]), Math.abs(audio.right[index]), Math.abs(audio.left[audio.left.length - 1 - index]), Math.abs(audio.right[audio.right.length - 1 - index]));
  }
  return peak;
}

function monoFoldDownRatio(audio) {
  let stereoEnergy = 0;
  let monoEnergy = 0;
  for (let index = 0; index < audio.left.length; index += 1) {
    stereoEnergy += (audio.left[index] ** 2 + audio.right[index] ** 2) * 0.5;
    monoEnergy += ((audio.left[index] + audio.right[index]) * 0.5) ** 2;
  }
  return Math.sqrt(monoEnergy / Math.max(Number.EPSILON, stereoEnergy));
}

function toDb(value) {
  return value > 0 ? 20 * Math.log10(value) : -Infinity;
}
