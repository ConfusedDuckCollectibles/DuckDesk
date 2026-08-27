import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { DEFAULT_ALERT_VISUALS } from "@duck-desk/shared";
import {
  createShowProfile,
  createShowSessionReset,
  emptyShowStats,
  loadShowProfileLibrary,
  parseShowProfile,
  sanitizeProfileName,
  saveShowProfileLibrary,
  serializeProfileExport,
  upsertShowProfile,
  type ShowLook
} from "./show-session.js";

function sampleLook(overrides: Partial<ShowLook> = {}): ShowLook {
  return {
    theme: "neon",
    skin: "card_shop",
    addOns: ["stream_skins", "activity_feed"],
    soundsEnabled: true,
    soundVolume: 0.8,
    audioTheme: "neon_pulse",
    streamTitle: "Friday Cards",
    gifPlacement: "center",
    gifSize: "medium",
    milestoneThresholds: [100, 250],
    hypeMeterSeconds: 30,
    promoBanners: ["Follow for drops"],
    sceneMode: "ending",
    goals: [{ kind: "sales", target: 500, label: "Sales Goal" }],
    auctionTimerSeconds: 45,
    hideTopBanner: false,
    themeEffectsEnabled: true,
    alertVisuals: DEFAULT_ALERT_VISUALS,
    framePreset: "broadcast",
    reducedMotion: false,
    ...overrides
  };
}

test("start new show clears session totals and live leftovers", () => {
  const reset = createShowSessionReset();
  assert.deepEqual(reset.stats, { ...emptyShowStats });
  assert.equal(reset.lastRealEventAt, 0);
  assert.equal(reset.sceneMode, "none");
  assert.equal(reset.demoMode, false);
  assert.equal(reset.jumbotronCameraEnabled, false);
  assert.deepEqual(reset.completedMilestones, []);
});

test("named profiles upsert by name and keep a bounded library", () => {
  const first = createShowProfile("Friday Cards", sampleLook());
  const second = createShowProfile("Friday Cards", sampleLook({ streamTitle: "Saturday Cards" }));
  const profiles = upsertShowProfile(upsertShowProfile([], first), second);
  assert.equal(profiles.length, 1);
  assert.equal(profiles[0].id, first.id);
  assert.equal(profiles[0].look.streamTitle, "Saturday Cards");
});

test("exported profiles round-trip without executable fields", () => {
  const profile = createShowProfile("Quiet Night", sampleLook({ reducedMotion: true, sceneMode: "starting" }));
  const exported = serializeProfileExport(profile);
  const parsed = parseShowProfile(JSON.parse(JSON.stringify(exported)));
  assert.equal(parsed.format, "duckdesk-profile");
  assert.equal(parsed.look.reducedMotion, true);
  assert.equal(parsed.look.sceneMode, "starting");
  assert.equal(parsed.look.theme, "neon");
});

test("malformed profile libraries are quarantined", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "duckdesk-profiles-"));
  const filePath = path.join(directory, "show-profiles.json");
  fs.writeFileSync(filePath, "{not json");
  const loaded = loadShowProfileLibrary(filePath);
  assert.equal(loaded.quarantined, true);
  assert.deepEqual(loaded.profiles, []);
  assert.equal(fs.existsSync(filePath), false);
});

test("profile libraries save and reload", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "duckdesk-profiles-"));
  const filePath = path.join(directory, "show-profiles.json");
  const profile = createShowProfile("Arena Night", sampleLook({ theme: "arena", skin: "sports_desk" }));
  saveShowProfileLibrary(filePath, [profile]);
  const loaded = loadShowProfileLibrary(filePath);
  assert.equal(loaded.quarantined, false);
  assert.equal(loaded.profiles[0].name, "Arena Night");
  assert.equal(loaded.profiles[0].look.skin, "sports_desk");
});

test("profile names drop control characters", () => {
  assert.equal(sanitizeProfileName("  Friday\nCards\u0000  "), "Friday Cards");
  assert.equal(sanitizeProfileName("   "), "Untitled look");
});
