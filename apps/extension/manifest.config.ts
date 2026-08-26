import type { ManifestV3Export } from "@crxjs/vite-plugin";

const manifest: ManifestV3Export = {
  manifest_version: 3,
  name: "Duck Desk",
  description: "Detects Whatnot seller events and sends them to the local Duck Desk overlay service.",
  version: "0.1.0",
  permissions: ["activeTab", "scripting"],
  host_permissions: ["http://localhost:*/*", "https://www.whatnot.com/*"],
  action: {
    default_popup: "src/popup/index.html",
    default_title: "Duck Desk"
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module"
  },
  content_scripts: [
    {
      matches: ["https://www.whatnot.com/*"],
      js: ["src/content/index.ts"],
      run_at: "document_idle"
    }
  ]
};

export default manifest;
