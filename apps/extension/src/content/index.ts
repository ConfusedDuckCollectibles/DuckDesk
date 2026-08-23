import { createWhatnotObserver } from "./adapters/whatnot";

const observer = createWhatnotObserver((event) => {
  void chrome.runtime.sendMessage({
    kind: "duck-desk:event",
    event
  }).catch(() => undefined);
});

observer.start();

function sendHeartbeat(): void {
  void chrome.runtime.sendMessage({
    kind: "duck-desk:heartbeat",
    whatnotPageActive: true
  }).catch(() => undefined);
}

sendHeartbeat();
window.setInterval(sendHeartbeat, 10_000);
window.addEventListener("focus", sendHeartbeat);
