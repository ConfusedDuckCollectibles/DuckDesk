import "./styles.css";

type DesktopStatus = {
  ok: boolean;
  port: number;
  overlayUrl: string;
  clients: number;
  salesCount: number;
  grossSales: number;
  bidCount: number;
  audienceActions: number;
  theme: OverlayTheme;
  lastError?: string;
};

type OverlayTheme = "neon" | "arena" | "duck";

type DesktopApi = {
  getStatus: () => Promise<DesktopStatus>;
  copyOverlayUrl: () => Promise<void>;
  openOverlay: () => Promise<void>;
  revealExtension: () => Promise<void>;
  sendTestSale: () => Promise<void>;
  sendTestBid: () => Promise<void>;
  sendTestAction: () => Promise<void>;
  setTheme: (theme: OverlayTheme) => Promise<DesktopStatus>;
  onStatus: (callback: (status: DesktopStatus) => void) => void;
  onEvent: (callback: (event: { buyer: string; amount: number; item?: string }) => void) => void;
};

declare global {
  interface Window {
    duckDesk: DesktopApi;
  }
}

const statusPill = readElement<HTMLSpanElement>("status-pill");
const overlayUrl = readElement<HTMLInputElement>("overlay-url");
const clientCount = readElement<HTMLElement>("client-count");
const salesCount = readElement<HTMLElement>("sales-count");
const grossSales = readElement<HTMLElement>("gross-sales");
const bidCount = readElement<HTMLElement>("bid-count");
const audienceCount = readElement<HTMLElement>("audience-count");
const eventLog = readElement<HTMLOListElement>("event-log");
const copyUrl = readElement<HTMLButtonElement>("copy-url");
const openOverlay = readElement<HTMLButtonElement>("open-overlay");
const revealExtension = readElement<HTMLButtonElement>("reveal-extension");
const sendTest = readElement<HTMLButtonElement>("send-test");
const sendBid = readElement<HTMLButtonElement>("send-bid");
const sendAction = readElement<HTMLButtonElement>("send-action");
const activeThemeLabel = readElement<HTMLElement>("active-theme-label");
const libraryStatus = readElement<HTMLElement>("library-status");
const themeCards = Array.from(document.querySelectorAll<HTMLButtonElement>(".theme-card"));
const addonActions = Array.from(document.querySelectorAll<HTMLButtonElement>(".addon-action"));

const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

copyUrl.addEventListener("click", async () => {
  await window.duckDesk.copyOverlayUrl();
  copyUrl.textContent = "Copied";
  window.setTimeout(() => {
    copyUrl.textContent = "Copy";
  }, 1200);
});

openOverlay.addEventListener("click", () => {
  void window.duckDesk.openOverlay();
});

revealExtension.addEventListener("click", () => {
  void window.duckDesk.revealExtension();
});

sendTest.addEventListener("click", () => {
  void window.duckDesk.sendTestSale();
});

sendBid.addEventListener("click", () => {
  void window.duckDesk.sendTestBid();
});

sendAction.addEventListener("click", () => {
  void window.duckDesk.sendTestAction();
});

for (const card of themeCards) {
  card.addEventListener("click", async () => {
    const theme = card.dataset.theme;
    if (theme === "neon" || theme === "arena" || theme === "duck") {
      renderStatus(await window.duckDesk.setTheme(theme));
    }
  });
}

for (const action of addonActions) {
  action.addEventListener("click", () => {
    const card = action.closest<HTMLElement>(".addon-card");
    if (!card) {
      return;
    }

    card.classList.toggle("is-added");
    action.textContent = card.classList.contains("is-added") ? "Added" : action.dataset.defaultLabel ?? "Add";
    updateLibraryStatus();
  });
  action.dataset.defaultLabel = action.textContent ?? "Add";
}

window.duckDesk.onStatus(renderStatus);
window.duckDesk.onEvent((event) => {
  const item = document.createElement("li");
  item.textContent = formatEventLog(event);
  eventLog.prepend(item);

  while (eventLog.children.length > 8) {
    eventLog.lastElementChild?.remove();
  }
});

void window.duckDesk.getStatus().then(renderStatus);
updateLibraryStatus();

function renderStatus(status: DesktopStatus): void {
  statusPill.textContent = status.ok ? "Running" : "Needs Attention";
  statusPill.classList.toggle("ok", status.ok);
  overlayUrl.value = status.overlayUrl;
  clientCount.textContent = String(status.clients);
  salesCount.textContent = String(status.salesCount);
  grossSales.textContent = dollars.format(status.grossSales);
  bidCount.textContent = String(status.bidCount);
  audienceCount.textContent = String(status.audienceActions);
  activeThemeLabel.textContent = themeName(status.theme);

  for (const card of themeCards) {
    card.classList.toggle("is-active", card.dataset.theme === status.theme);
  }
}

function formatEventLog(event: { type?: string; buyer?: string; bidder?: string; actor?: string; amount?: number; item?: string; message?: string }): string {
  if (event.type === "sale") {
    return `SOLD @${event.buyer} ${dollars.format(event.amount ?? 0)}${event.item ? ` - ${event.item}` : ""}`;
  }

  if (event.type === "bid") {
    return `BID @${event.bidder} ${dollars.format(event.amount ?? 0)}${event.item ? ` - ${event.item}` : ""}`;
  }

  return `AUDIENCE @${event.actor}${event.message ? ` - ${event.message}` : ""}`;
}

function themeName(theme: OverlayTheme): string {
  if (theme === "arena") {
    return "Auction Arena";
  }

  if (theme === "duck") {
    return "Duck Pop";
  }

  return "Neon Circuit";
}

function updateLibraryStatus(): void {
  const added = document.querySelectorAll(".addon-card.is-added").length;
  const total = addonActions.length;
  libraryStatus.textContent = added === 0 ? `${total} Available` : `${added} Added`;
}

function readElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element #${id}`);
  }

  return element as T;
}
