import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  PACK_LIMITS,
  assemblePackFiles,
  createDuckPackArchive,
  derivePackApplyState,
  inspectDuckPackArchive,
  inspectDuckPackDirectory,
  loadPackCatalog,
  writeInstalledPack,
  type PackManifest
} from "./packs.js";
import { DEFAULT_ALERT_VISUALS } from "@duck-desk/shared";

const PNG_1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

function silentWav(): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(8000, 24);
  header.writeUInt32LE(8000, 28);
  header.writeUInt16LE(1, 32);
  header.writeUInt16LE(8, 34);
  header.write("data", 36);
  header.writeUInt32LE(0, 40);
  return header;
}

function sampleIdentity(overrides: Partial<PackManifest> = {}) {
  return {
    name: "Night Market",
    author: "Duck Desk",
    packVersion: "1.0.0",
    description: "Reference community pack.",
    license: "MIT" as const,
    preview: "preview.png",
    setup: {
      theme: "neon" as const,
      skin: "cyber_market" as const,
      framePreset: "broadcast" as const,
      promoBanners: ["Tonight only"],
      sceneMode: "starting" as const
    },
    ...overrides
  };
}

function sampleAssets() {
  return [
    { path: "preview.png", data: PNG_1x1, kind: "image" as const },
    { path: "assets/sale.wav", data: silentWav(), kind: "audio" as const, sound: "sale" as const, label: "Sale sting" }
  ];
}

async function sampleArchive(overrides: Partial<PackManifest> = {}, extraFiles: Array<{ name: string; data: Buffer }> = []): Promise<Buffer> {
  const assembled = assemblePackFiles(sampleIdentity(overrides), sampleAssets());
  return createDuckPackArchive([...assembled.files, ...extraFiles]);
}

test("valid packs inspect and list the changes they will make", async () => {
  const inspected = await inspectDuckPackArchive(await sampleArchive());
  assert.equal(inspected.manifest.name, "Night Market");
  assert.equal(inspected.manifest.license, "MIT");
  assert.ok(inspected.review.some((change) => change.label === "Theme" && change.detail === "neon"));
  assert.ok(inspected.review.some((change) => change.label === "Sound" && change.detail.includes("sale")));
});

test("zip traversal paths are rejected", async () => {
  const archive = await sampleArchive();
  const from = Buffer.from("preview.png");
  const to = Buffer.from("../evil.png");
  assert.equal(from.length, to.length);
  let index = 0;
  let replaced = 0;
  while ((index = archive.indexOf(from, index)) !== -1) {
    to.copy(archive, index);
    index += to.length;
    replaced += 1;
  }
  assert.ok(replaced >= 2);
  await assert.rejects(inspectDuckPackArchive(archive), /relative|cannot contain|\.\.|preview/i);
});

test("undeclared zip files are rejected", async () => {
  await assert.rejects(
    inspectDuckPackArchive(await sampleArchive({}, [{ name: "assets/extra.png", data: PNG_1x1 }])),
    /undeclared/i
  );
});

test("hash mismatches are rejected", async () => {
  const assembled = assemblePackFiles(sampleIdentity(), sampleAssets());
  const manifest = JSON.parse(assembled.files[0].data.toString("utf8")) as PackManifest;
  manifest.assets[0].sha256 = "0".repeat(64);
  assembled.files[0].data = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
  await assert.rejects(inspectDuckPackArchive(await createDuckPackArchive(assembled.files)), /Hash mismatch/);
});

test("type spoofing a png as json is rejected", async () => {
  const assembled = assemblePackFiles(sampleIdentity(), [
    { path: "preview.png", data: Buffer.from('{"not":"an image"}'), kind: "image" }
  ]);
  await assert.rejects(inspectDuckPackArchive(await createDuckPackArchive(assembled.files)), /PNG|JPEG|GIF|WebP|signature/i);
});

test("compressed size limits are enforced before unzip", async () => {
  await assert.rejects(inspectDuckPackArchive(Buffer.alloc(PACK_LIMITS.maxCompressedBytes + 1)), /25 MB/);
});

test("unsupported licenses are rejected", async () => {
  await assert.rejects(
    async () => inspectDuckPackArchive(await sampleArchive({ license: "Proprietary" as PackManifest["license"] })),
    /license/i
  );
});

test("install refuses to overwrite another pack directory", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "duckpack-"));
  const nested = path.join(directory, "existing");
  fs.mkdirSync(nested);
  const inspected = await inspectDuckPackArchive(await sampleArchive());
  assert.throws(() => writeInstalledPack(nested, inspected), /overwrite/i);
  fs.rmSync(directory, { recursive: true, force: true });
});

test("malformed pack catalogs are quarantined", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "duckpack-catalog-"));
  const filePath = path.join(directory, "index.json");
  fs.writeFileSync(filePath, "{not json");
  const loaded = loadPackCatalog(filePath);
  assert.equal(loaded.quarantined, true);
  assert.equal(loaded.packs.length, 0);
  assert.ok(fs.readdirSync(directory).some((name) => name.includes(".invalid-")));
  fs.rmSync(directory, { recursive: true, force: true });
});

test("applying a pack is derived without mutating the previous setup object", () => {
  const current = {
    theme: "duck" as const,
    skin: "none" as const,
    addOns: ["activity_feed"] as const,
    alertVisuals: DEFAULT_ALERT_VISUALS,
    promoBanners: ["Keep the original"],
    goals: [{ kind: "sales" as const, target: 100, label: "Old" }],
    sceneMode: "none" as const,
    framePreset: "theme" as const,
    reducedMotion: false
  };
  const next = derivePackApplyState({ ...current, addOns: [...current.addOns] }, {
    theme: "neon",
    skin: "cyber_market",
    promoBanners: ["Tonight only"],
    sceneMode: "starting"
  });
  assert.equal(current.theme, "duck");
  assert.equal(next.theme, "neon");
  assert.equal(next.skin, "cyber_market");
  assert.ok(next.addOns.includes("stream_skins"));
  assert.ok(next.addOns.includes("promo_banners"));
  assert.deepEqual(next.promoBanners, ["Tonight only"]);
});

test("directory packs inspect the same way as archives", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "duckpack-dir-"));
  const assembled = assemblePackFiles(sampleIdentity(), sampleAssets());
  for (const file of assembled.files) {
    const destination = path.join(directory, ...file.name.split("/"));
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, file.data);
  }
  const inspected = inspectDuckPackDirectory(directory);
  assert.equal(inspected.manifest.name, "Night Market");
  fs.rmSync(directory, { recursive: true, force: true });
});
