const { contextBridge } = require("electron");

const status = {
  ok: true,
  overlayUrl: "http://localhost:8741/overlay",
  clientCount: 1,
  salesCount: 12,
  grossSales: 486,
  bidCount: 31,
  audienceCount: 18,
  tipTotal: 40,
  shareCount: 9,
  theme: "neon",
  skin: "card_shop",
  addOns: ["stream_skins", "noise_machines", "bid_ladder", "activity_feed"],
  soundsEnabled: true,
  soundVolume: 0.75,
  audioTheme: "neon_pulse",
  customSounds: {},
  demoMode: false,
  streamTitle: "Surprise Sets Live",
  customGifUrls: [],
  customGifs: [],
  gifPlacement: "center",
  gifSize: "medium",
  milestoneThresholds: [],
  hypeMeterSeconds: 30,
  jumbotronCameraEnabled: false,
  promoBanners: [],
  sceneMode: "none",
  goals: [],
  auctionTimerSeconds: 45,
  hideFooter: true,
  firstRunComplete: true,
  platform: "darwin",
  obsStatus: "Ready",
  extensionConnected: true,
  whatnotPageActive: true,
  lastRealEventAt: Date.now() - 4000
};

const api = new Proxy(
  {},
  {
    get(_target, prop) {
      if (prop === "getStatus") {
        return async () => status;
      }
      if (prop === "onStatus") {
        return (callback) => {
          callback(status);
        };
      }
      if (prop === "onEvent") {
        return () => {};
      }
      return async () => status;
    }
  }
);

contextBridge.exposeInMainWorld("duckDesk", api);
