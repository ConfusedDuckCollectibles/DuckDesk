import "./styles.css";

const appStatus = document.querySelector<HTMLElement>("#app-status");
const pageStatus = document.querySelector<HTMLElement>("#page-status");
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
    setStatus(appStatus, response.ok ? "Running" : "Needs attention", response.ok);
  } catch {
    setStatus(appStatus, "Open Duck Desk", false);
  }
}

function setStatus(element: HTMLElement | null, label: string, ready: boolean): void {
  if (!element) {
    return;
  }
  element.textContent = label;
  element.classList.toggle("is-ready", ready);
}
