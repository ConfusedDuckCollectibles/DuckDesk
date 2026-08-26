import "./styles.css";

const appStatus = document.querySelector<HTMLElement>("#app-status");
const pageStatus = document.querySelector<HTMLElement>("#page-status");
const lastEvent = document.querySelector<HTMLElement>("#last-event");
const refreshStatus = document.querySelector<HTMLButtonElement>("#refresh-status");

refreshStatus?.addEventListener("click", () => {
  void renderHealth();
});

void renderHealth();

async function renderHealth(): Promise<void> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const isSellerPage = tabs[0]?.url?.startsWith("https://www.whatnot.com/") ?? false;
  setStatus(pageStatus, isSellerPage ? "Connected" : "Open Whatnot", isSellerPage);

  if (isSellerPage) {
    void chrome.runtime.sendMessage({ kind: "duck-desk:heartbeat", whatnotPageActive: true });
  }

  try {
    const response = await fetch("http://localhost:8741/health");
    const body = await response.json() as { ok?: boolean; lastRealEventAt?: number };
    setStatus(appStatus, body.ok ? "Running" : "Needs attention", Boolean(body.ok));
    if (lastEvent) {
      lastEvent.textContent = body.lastRealEventAt
        ? `Last event ${formatRelativeTime(body.lastRealEventAt)}`
        : "No events yet";
    }
  } catch {
    setStatus(appStatus, "Open Duck Desk", false);
    if (lastEvent) {
      lastEvent.textContent = "Open Duck Desk to connect";
    }
  }
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  return `${Math.floor(seconds / 60)}m ago`;
}

function setStatus(element: HTMLElement | null, label: string, ready: boolean): void {
  if (!element) {
    return;
  }
  element.textContent = label;
  element.classList.toggle("is-ready", ready);
}
