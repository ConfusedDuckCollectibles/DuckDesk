import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("duckDesk", {
  getStatus: () => ipcRenderer.invoke("duck-desk:get-status"),
  copyOverlayUrl: () => ipcRenderer.invoke("duck-desk:copy-overlay-url"),
  openOverlay: () => ipcRenderer.invoke("duck-desk:open-overlay"),
  revealExtension: () => ipcRenderer.invoke("duck-desk:reveal-extension"),
  sendTestSale: () => ipcRenderer.invoke("duck-desk:send-test-sale"),
  sendTestBid: () => ipcRenderer.invoke("duck-desk:send-test-bid"),
  sendTestAction: () => ipcRenderer.invoke("duck-desk:send-test-action"),
  setTheme: (theme: unknown) => ipcRenderer.invoke("duck-desk:set-theme", theme),
  setSkin: (skin: unknown) => ipcRenderer.invoke("duck-desk:set-skin", skin),
  setAddOn: (addOn: unknown, enabled: unknown) => ipcRenderer.invoke("duck-desk:set-addon", addOn, enabled),
  setSoundsEnabled: (enabled: unknown) => ipcRenderer.invoke("duck-desk:set-sounds-enabled", enabled),
  setDemoMode: (enabled: unknown) => ipcRenderer.invoke("duck-desk:set-demo-mode", enabled),
  onStatus: (callback: (status: unknown) => void) => {
    ipcRenderer.on("duck-desk:status", (_event, status) => callback(status));
  },
  onEvent: (callback: (event: unknown) => void) => {
    ipcRenderer.on("duck-desk:event", (_event, showEvent) => callback(showEvent));
  }
});
