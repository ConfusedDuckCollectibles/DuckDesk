import { createWhatnotObserver } from "./adapters/whatnot";

const observer = createWhatnotObserver((event) => {
  chrome.runtime.sendMessage({
    kind: "duck-desk:event",
    event
  });
});

observer.start();
