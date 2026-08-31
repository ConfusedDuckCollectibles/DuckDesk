import assert from "node:assert/strict";
import os from "node:os";
import test from "node:test";
import {
  compareVersions,
  createDiagnosticsArchive,
  privacySummary,
  redactSettingsSummary,
  redactText
} from "./diagnostics.js";

test("redaction strips tokens, ids, and home directory paths", () => {
  const home = os.homedir();
  const text = redactText(`url=http://localhost:8741/pack-media/11111111-2222-4333-a444-555555555555/sale.gif?token=secret-value path=${home}/secret`);
  assert.equal(text.includes("secret-value"), false);
  assert.equal(text.includes(home), false);
  assert.match(text, /token=\[redacted\]/);
  assert.match(text, /~\/secret/);
});

test("settings summaries never include media URLs or sound payloads", () => {
  const summary = redactSettingsSummary({
    version: 1,
    theme: "neon",
    customSounds: { sale: { storedFileName: "sale.wav", displayName: "cheer.wav" } },
    customGifs: [{ id: "1", label: "x", url: "https://media.giphy.com/media/abc/giphy.gif?token=nope" }],
    addOns: ["stream_skins"]
  });
  const encoded = JSON.stringify(summary);
  assert.equal(encoded.includes("giphy"), false);
  assert.equal(encoded.includes("cheer.wav"), false);
  assert.equal(encoded.includes("token"), false);
  assert.deepEqual(summary.customSoundKinds, { sale: true });
  assert.equal(summary.gifCount, 1);
});

test("version compare understands alpha release order", () => {
  assert.equal(compareVersions("0.1.0-alpha.5", "0.1.0-alpha.5"), "current");
  assert.equal(compareVersions("0.1.0-alpha.9", "0.1.0-alpha.10"), "available");
  assert.equal(compareVersions("0.1.0-alpha.10", "0.1.0-alpha.11"), "available");
  assert.equal(compareVersions("0.1.0-alpha.11", "0.1.0-alpha.10"), "current");
  assert.equal(compareVersions("0.1.0-alpha.11", "v0.1.0"), "available");
  assert.equal(compareVersions("0.1.0-alpha.5", "v0.1.1"), "available");
  assert.equal(compareVersions("0.2.0", "0.1.9"), "current");
});

test("diagnostic archives include the privacy summary and omit secrets", async () => {
  const archive = await createDiagnosticsArchive([
    { name: "health.json", data: JSON.stringify({ ok: true }) }
  ]);
  assert.ok(archive.length > 40);
  assert.match(privacySummary(), /does not include event message text/i);
});
