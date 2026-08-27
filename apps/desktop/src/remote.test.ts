import assert from "node:assert/strict";
import test from "node:test";
import {
  RemotePairingSession,
  isPrivateNetworkAddress,
  normalizeRemoteAction
} from "./remote.js";

test("private network checks accept LAN and loopback addresses only", () => {
  assert.equal(isPrivateNetworkAddress("127.0.0.1"), true);
  assert.equal(isPrivateNetworkAddress("::ffff:192.168.1.20"), true);
  assert.equal(isPrivateNetworkAddress("10.0.0.4"), true);
  assert.equal(isPrivateNetworkAddress("172.16.4.8"), true);
  assert.equal(isPrivateNetworkAddress("172.31.255.1"), true);
  assert.equal(isPrivateNetworkAddress("172.32.0.1"), false);
  assert.equal(isPrivateNetworkAddress("8.8.8.8"), false);
  assert.equal(isPrivateNetworkAddress(undefined), false);
});

test("pairing tokens authorize private clients and rotate cleanly", () => {
  const session = new RemotePairingSession(8741);
  const first = session.getConnectionInfo("192.168.1.5");
  assert.equal(first.available, true);
  const token = new URL(first.url ?? "").searchParams.get("token");
  assert.equal(session.authorize(token, "192.168.1.22"), true);
  assert.equal(session.authorize(token, "8.8.8.8"), false);
  assert.equal(session.authorize("wrong", "192.168.1.22"), false);

  session.rotate();
  assert.equal(session.authorize(token, "192.168.1.22"), false);
  assert.notEqual(session.getConnectionInfo("192.168.1.5").pairingCode, first.pairingCode);
});

test("remote clients expire and action bursts are rate limited", () => {
  const session = new RemotePairingSession(8741);
  const clientId = session.touchClient("phone-client-01", 1_000);
  assert.equal(clientId, "phone-client-01");
  assert.equal(session.activeClientCount(1_100), 1);
  for (let index = 0; index < 12; index += 1) {
    assert.equal(session.allowAction(clientId ?? "", 1_200 + index), true);
  }
  assert.equal(session.allowAction(clientId ?? "", 1_300), false);
  assert.equal(session.activeClientCount(20_000), 0);
});

test("remote action validation only accepts known commands and values", () => {
  assert.deepEqual(normalizeRemoteAction({ type: "set_scene", scene: "winner" }), {
    type: "set_scene",
    scene: "winner"
  });
  assert.deepEqual(normalizeRemoteAction({ type: "trigger_sound", kind: "sale" }), {
    type: "trigger_sound",
    kind: "sale"
  });
  assert.deepEqual(normalizeRemoteAction({ type: "trigger_gif", id: "abc-123" }), {
    type: "trigger_gif",
    id: "abc-123"
  });
  assert.equal(normalizeRemoteAction({ type: "set_scene", scene: "private" }), null);
  assert.equal(normalizeRemoteAction({ type: "trigger_sound", kind: "airhorn" }), null);
  assert.equal(normalizeRemoteAction({ type: "trigger_gif", id: "../secret" }), null);
  assert.equal(normalizeRemoteAction({ type: "unknown" }), null);
});
