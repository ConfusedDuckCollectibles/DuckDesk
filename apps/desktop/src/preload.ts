import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("duckDesk", {
  getStatus: () => ipcRenderer.invoke("duck-desk:get-status"),
  copyOverlayUrl: () => ipcRenderer.invoke("duck-desk:copy-overlay-url"),
  openOverlay: () => ipcRenderer.invoke("duck-desk:open-overlay"),
  revealExtension: () => ipcRenderer.invoke("duck-desk:reveal-extension"),
  autoAddObsOverlay: () => ipcRenderer.invoke("duck-desk:auto-add-obs-overlay"),
  sendTestSale: () => ipcRenderer.invoke("duck-desk:send-test-sale"),
  sendTestBid: () => ipcRenderer.invoke("duck-desk:send-test-bid"),
  sendTestAction: () => ipcRenderer.invoke("duck-desk:send-test-action"),
  setTheme: (theme: unknown) => ipcRenderer.invoke("duck-desk:set-theme", theme),
  setSkin: (skin: unknown) => ipcRenderer.invoke("duck-desk:set-skin", skin),
  setAddOn: (addOn: unknown, enabled: unknown) => ipcRenderer.invoke("duck-desk:set-addon", addOn, enabled),
  setSoundsEnabled: (enabled: unknown) => ipcRenderer.invoke("duck-desk:set-sounds-enabled", enabled),
  setDemoMode: (enabled: unknown) => ipcRenderer.invoke("duck-desk:set-demo-mode", enabled),
  setStreamTitle: (title: unknown) => ipcRenderer.invoke("duck-desk:set-stream-title", title),
  addCustomGif: (url: unknown) => ipcRenderer.invoke("duck-desk:add-custom-gif", url),
  removeCustomGif: (id: unknown) => ipcRenderer.invoke("duck-desk:remove-custom-gif", id),
  setCustomGifLabel: (id: unknown, label: unknown) => (
    ipcRenderer.invoke("duck-desk:set-custom-gif-label", id, label)
  ),
  triggerGif: (url?: unknown) => ipcRenderer.invoke("duck-desk:trigger-gif", url),
  setGifSettings: (placement: unknown, size: unknown) => (
    ipcRenderer.invoke("duck-desk:set-gif-settings", placement, size)
  ),
  triggerSound: (kind: unknown) => ipcRenderer.invoke("duck-desk:trigger-sound", kind),
  triggerBurst: () => ipcRenderer.invoke("duck-desk:trigger-burst"),
  setMilestones: (thresholds: unknown) => ipcRenderer.invoke("duck-desk:set-milestones", thresholds),
  triggerHypeMeter: () => ipcRenderer.invoke("duck-desk:trigger-hype-meter"),
  setHypeMeterSeconds: (seconds: unknown) => ipcRenderer.invoke("duck-desk:set-hype-meter-seconds", seconds),
  setJumbotronCamera: (enabled: unknown) => ipcRenderer.invoke("duck-desk:set-jumbotron-camera", enabled),
  setPromoBanners: (banners: unknown) => ipcRenderer.invoke("duck-desk:set-promo-banners", banners),
  onStatus: (callback: (status: unknown) => void) => {
    ipcRenderer.on("duck-desk:status", (_event, status) => callback(status));
  },
  onEvent: (callback: (event: unknown) => void) => {
    ipcRenderer.on("duck-desk:event", (_event, showEvent) => callback(showEvent));
  }
});
