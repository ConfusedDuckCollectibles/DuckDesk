import { normalizeShowEvent, type ShowEvent } from "@duck-desk/shared";

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  void handleMessage(message)
    .then((response) => sendResponse(response))
    .catch((error) => {
      const message = error instanceof Error ? error.message : "Unknown error.";
      sendResponse({ ok: false, error: message });
    });

  return true;
});

async function handleMessage(message: unknown): Promise<{ ok: boolean; error?: string }> {
  if (!isRecord(message)) {
    return { ok: false, error: "Unsupported message." };
  }

  if (message.kind === "duck-desk:heartbeat") {
    await postHeartbeat(message.whatnotPageActive === true);
    return { ok: true };
  }

  if (message.kind !== "duck-desk:event") {
    return { ok: false, error: "Unsupported message." };
  }

  const event = normalizeShowEvent(message.event);
  await postEvent(event);
  return { ok: true };
}

async function postHeartbeat(whatnotPageActive: boolean): Promise<void> {
  const response = await fetch("http://localhost:8741/extension/heartbeat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ whatnotPageActive })
  });

  if (!response.ok) {
    throw new Error(`Duck Desk health check failed with HTTP ${response.status}.`);
  }
}

async function postEvent(event: ShowEvent): Promise<void> {
  const response = await fetch("http://localhost:8741/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(event)
  });

  if (!response.ok) {
    throw new Error(`Local service rejected event with HTTP ${response.status}.`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
