import type { SaleEvent } from "@duck-desk/shared";
import "./styles.css";

const button = document.querySelector<HTMLButtonElement>("#fake-sale");
const status = document.querySelector<HTMLParagraphElement>("#status");

button?.addEventListener("click", () => {
  const event: SaleEvent = {
    type: "sale",
    buyer: "PopupTester",
    amount: 28,
    item: "Extension Debug Sale",
    timestamp: Date.now()
  };

  chrome.runtime.sendMessage({ kind: "duck-desk:event", event }, (response) => {
    if (status) {
      status.textContent = response?.ok ? "Fake sale sent" : response?.error ?? "Failed";
    }
  });
});
