import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_ALERT_VISUALS,
  alertKindFromEventType,
  normalizeAlertVisual,
  normalizeAlertVisualMap,
  patchAlertVisual,
  sanitizeAlertMediaUrl,
  usesThemeAlertArt
} from "../packages/shared/dist/index.js";

test("defaults match the pre-sprint overlay durations and theme look", () => {
  assert.equal(DEFAULT_ALERT_VISUALS.bid.durationMs, 1_600);
  assert.equal(DEFAULT_ALERT_VISUALS.sale.durationMs, 3_400);
  assert.equal(DEFAULT_ALERT_VISUALS.action.durationMs, 2_200);
  assert.equal(DEFAULT_ALERT_VISUALS.tip.durationMs, 3_200);
  assert.equal(DEFAULT_ALERT_VISUALS.share.durationMs, 2_400);
  assert.equal(DEFAULT_ALERT_VISUALS.sale.placement, "below_banner");
  assert.equal(DEFAULT_ALERT_VISUALS.sale.entrance, "broadcast");
  assert.equal(DEFAULT_ALERT_VISUALS.sale.typography, "theme");
  assert.equal(usesThemeAlertArt(DEFAULT_ALERT_VISUALS.sale), true);
});

test("missing version-1 settings migrate to complete per-event defaults", () => {
  const migrated = normalizeAlertVisualMap(undefined);
  assert.deepEqual(migrated, DEFAULT_ALERT_VISUALS);
  const partial = normalizeAlertVisualMap({ sale: { enabled: false, durationMs: 5_000 } });
  assert.equal(partial.sale.enabled, false);
  assert.equal(partial.sale.durationMs, 5_000);
  assert.deepEqual(partial.bid, DEFAULT_ALERT_VISUALS.bid);
});

test("duration clamping is per-event", () => {
  assert.equal(normalizeAlertVisual("bid", { durationMs: 50 }).durationMs, 800);
  assert.equal(normalizeAlertVisual("bid", { durationMs: 9_999 }).durationMs, 4_000);
  assert.equal(normalizeAlertVisual("sale", { durationMs: 50 }).durationMs, 1_500);
});

test("patching one event leaves the others untouched", () => {
  const next = patchAlertVisual("tip", DEFAULT_ALERT_VISUALS, {
    placement: "center",
    accent: "#ff4d6d",
    typography: "modern"
  });
  assert.equal(next.tip.placement, "center");
  assert.equal(next.tip.accent, "#ff4d6d");
  assert.equal(usesThemeAlertArt(next.tip), false);
  assert.deepEqual(next.sale, DEFAULT_ALERT_VISUALS.sale);
  assert.deepEqual(next.bid, DEFAULT_ALERT_VISUALS.bid);
});

test("unknown actions, unsafe accents, and bad media are rejected", () => {
  const visual = normalizeAlertVisual("sale", {
    placement: "orbit",
    entrance: "explode",
    accent: "red",
    mediaUrl: "javascript:alert(1)"
  });
  assert.equal(visual.placement, "below_banner");
  assert.equal(visual.entrance, "broadcast");
  assert.equal(visual.accent, "theme");
  assert.equal(visual.mediaUrl, undefined);
  assert.equal(sanitizeAlertMediaUrl("/gifs/chat-spark.gif"), "/gifs/chat-spark.gif");
  assert.equal(sanitizeAlertMediaUrl("/gifs/../secret.gif"), undefined);
  assert.equal(alertKindFromEventType("audience_action"), "action");
});
