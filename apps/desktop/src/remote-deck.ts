export function createRemoteDeckHtml(nonce: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#071014">
  <title>Duck Desk Remote</title>
  <style nonce="${nonce}">
    :root { color-scheme: dark; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #071014; color: #f3f8f7; }
    * { box-sizing: border-box; }
    body { margin: 0; min-width: 320px; min-height: 100vh; background: radial-gradient(circle at 85% 0%, #12343b 0, transparent 38%), #071014; }
    button { font: inherit; letter-spacing: 0; touch-action: manipulation; }
    .deck { width: min(100%, 480px); margin: 0 auto; padding: max(18px, env(safe-area-inset-top)) 14px max(24px, env(safe-area-inset-bottom)); }
    .masthead { display: flex; align-items: center; justify-content: space-between; min-height: 52px; margin-bottom: 12px; }
    .brand { display: grid; gap: 2px; }
    .brand small, .section-label { color: #70d8d2; font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .brand strong { font-size: 22px; }
    .connection { display: inline-flex; align-items: center; gap: 7px; color: #a9bab8; font-size: 12px; font-weight: 700; }
    .connection::before { width: 8px; height: 8px; border-radius: 50%; background: #ef5a67; content: ""; box-shadow: 0 0 12px #ef5a67; }
    .connection.ready::before { background: #57d898; box-shadow: 0 0 12px #57d898; }
    .status { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border: 1px solid #234249; background: #0b181c; }
    .status div { min-width: 0; padding: 11px 9px; border-right: 1px solid #20383e; }
    .status div:last-child { border: 0; }
    .status span { display: block; overflow: hidden; color: #78908e; font-size: 10px; font-weight: 800; text-overflow: ellipsis; text-transform: uppercase; white-space: nowrap; }
    .status strong { display: block; margin-top: 4px; overflow: hidden; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
    section { margin-top: 18px; }
    .section-head { display: flex; align-items: center; justify-content: space-between; margin: 0 2px 8px; }
    .section-head span:last-child { color: #738a88; font-size: 11px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .grid.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .control { min-height: 58px; border: 1px solid #29484e; border-radius: 6px; background: linear-gradient(#112329, #0c191d); color: #e9f3f2; font-size: 13px; font-weight: 800; }
    .control:active { transform: translateY(1px); background: #18333a; }
    .control.active { border-color: #58d7cf; background: #15363a; color: #8ff7ea; box-shadow: inset 0 0 0 1px #58d7cf55; }
    .control.danger { border-color: #8c3943; background: #31171c; color: #ffb7bd; }
    .control.feature { min-height: 64px; text-align: left; padding: 10px 12px; }
    .control.feature small { display: block; margin-top: 3px; color: #718b89; font-size: 10px; font-weight: 650; }
    .sound-grid .control { color: #b6eee9; }
    .gif-grid { display: grid; gap: 8px; }
    .gif-grid .control { min-height: 54px; padding: 8px 12px; overflow: hidden; text-align: left; text-overflow: ellipsis; white-space: nowrap; }
    .metrics { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 1px; overflow: hidden; border: 1px solid #234249; background: #234249; }
    .metric { min-width: 0; padding: 10px 4px; background: #0b181c; text-align: center; }
    .metric span { display: block; color: #78908e; font-size: 9px; font-weight: 800; text-transform: uppercase; }
    .metric strong { display: block; margin-top: 4px; overflow: hidden; font-size: 13px; text-overflow: ellipsis; }
    .message { position: fixed; right: 14px; bottom: max(14px, env(safe-area-inset-bottom)); left: 14px; z-index: 5; max-width: 452px; margin: auto; padding: 11px 13px; border: 1px solid #31535a; border-radius: 5px; background: #102329ee; color: #d7e8e6; font-size: 12px; font-weight: 750; opacity: 0; pointer-events: none; transform: translateY(10px); transition: opacity 140ms ease, transform 140ms ease; }
    .message.show { opacity: 1; transform: translateY(0); }
    .empty { padding: 15px; border: 1px dashed #29464b; color: #758b89; font-size: 12px; text-align: center; }
    @media (max-width: 350px) { .grid.three { grid-template-columns: repeat(2, minmax(0, 1fr)); } .metrics { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    @media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto !important; transition-duration: 1ms !important; } }
  </style>
</head>
<body>
  <main class="deck">
    <header class="masthead">
      <div class="brand"><small>Local show control</small><strong>Duck Desk</strong></div>
      <span id="connection" class="connection">Connecting</span>
    </header>
    <div class="status" aria-label="Production status">
      <div><span>Bridge</span><strong id="bridge">Checking</strong></div>
      <div><span>OBS</span><strong id="obs">Checking</strong></div>
      <div><span>Scene</span><strong id="scene">Live</strong></div>
    </div>

    <section>
      <div class="section-head"><span class="section-label">Safety</span><span>Immediate</span></div>
      <div class="grid">
        <button class="control danger" data-action='{"type":"clear"}'>Clear Overlay</button>
        <button id="banner" class="control feature" data-dynamic="banner">Banner<strong></strong><small>Viewer header</small></button>
        <button id="effects" class="control feature" data-dynamic="effects">Theme Effects<strong></strong><small>Frame and animation</small></button>
        <button class="control" data-action='{"type":"trigger_recap"}'>Show Recap</button>
      </div>
    </section>

    <section>
      <div class="section-head"><span class="section-label">Scenes</span><span>Viewer canvas</span></div>
      <div class="grid three" id="scenes">
        <button class="control" data-scene="none">Live</button>
        <button class="control" data-scene="starting">Starting</button>
        <button class="control" data-scene="auction">Auction</button>
        <button class="control" data-scene="break">Break</button>
        <button class="control" data-scene="winner">Winner</button>
        <button class="control" data-scene="ending">Ending</button>
      </div>
    </section>

    <section>
      <div class="section-head"><span class="section-label">Show Triggers</span><span>Manual</span></div>
      <div class="grid three">
        <button class="control" data-action='{"type":"trigger_burst"}'>Hype Burst</button>
        <button class="control" data-action='{"type":"trigger_hype"}'>Hype Meter</button>
        <button class="control" data-action='{"type":"trigger_timer"}'>Auction Timer</button>
      </div>
    </section>

    <section>
      <div class="section-head"><span class="section-label">Sound Pads</span><span>Event audio</span></div>
      <div class="grid three sound-grid">
        <button class="control" data-sound="sale">Sale</button>
        <button class="control" data-sound="bid">Bid</button>
        <button class="control" data-sound="tip">Tip</button>
        <button class="control" data-sound="action">Audience</button>
        <button class="control" data-sound="share">Share</button>
      </div>
    </section>

    <section>
      <div class="section-head"><span class="section-label">GIF Library</span><span id="gif-count">0 saved</span></div>
      <div id="gifs" class="gif-grid"><div class="empty">Add GIFs in Duck Desk to use them here.</div></div>
    </section>

    <section>
      <div class="section-head"><span class="section-label">Show Totals</span><span>Live</span></div>
      <div class="metrics">
        <div class="metric"><span>Sales</span><strong id="sales">0</strong></div>
        <div class="metric"><span>Gross</span><strong id="gross">$0</strong></div>
        <div class="metric"><span>Bids</span><strong id="bids">0</strong></div>
        <div class="metric"><span>Tips</span><strong id="tips">$0</strong></div>
        <div class="metric"><span>Shares</span><strong id="shares">0</strong></div>
      </div>
    </section>
  </main>
  <div id="message" class="message" role="status" aria-live="polite"></div>
  <script nonce="${nonce}">
    (() => {
      const token = new URLSearchParams(location.search).get("token") || "";
      const createClientId = () => {
        const bytes = new Uint8Array(12);
        crypto.getRandomValues(bytes);
        return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
      };
      const clientId = sessionStorage.getItem("duckDeskRemoteClient") || createClientId();
      sessionStorage.setItem("duckDeskRemoteClient", clientId);
      const money = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
      let status = null;
      let toastTimer = 0;
      let polling = false;

      const byId = (id) => document.getElementById(id);
      const showMessage = (text) => {
        const element = byId("message");
        element.textContent = text;
        element.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => element.classList.remove("show"), 1800);
      };

      async function send(action) {
        try {
          const response = await fetch("/remote/api/action?token=" + encodeURIComponent(token), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clientId, action })
          });
          if (!response.ok) throw new Error(response.status === 429 ? "Too many taps. Try again." : "Control unavailable.");
          status = await response.json();
          render(status);
          showMessage("Command sent");
        } catch (error) {
          showMessage(error instanceof Error ? error.message : "Control unavailable.");
        }
      }

      async function poll() {
        if (polling) return;
        polling = true;
        try {
          const response = await fetch("/remote/api/status?token=" + encodeURIComponent(token) + "&clientId=" + encodeURIComponent(clientId), { cache: "no-store" });
          if (!response.ok) throw new Error();
          status = await response.json();
          render(status);
        } catch {
          byId("connection").className = "connection";
          byId("connection").textContent = "Disconnected";
        } finally {
          polling = false;
        }
      }

      function render(next) {
        byId("connection").className = "connection ready";
        byId("connection").textContent = "Connected";
        byId("bridge").textContent = next.ok ? "Online" : "Attention";
        byId("obs").textContent = next.obsReady ? "Ready" : "Setup";
        byId("scene").textContent = next.sceneLabel;
        byId("sales").textContent = next.salesCount;
        byId("gross").textContent = money.format(next.grossSales);
        byId("bids").textContent = next.bidCount;
        byId("tips").textContent = money.format(next.tipTotal);
        byId("shares").textContent = next.shareCount;
        const banner = byId("banner");
        banner.classList.toggle("active", next.bannerVisible);
        banner.querySelector("strong").textContent = next.bannerVisible ? " On" : " Off";
        const effects = byId("effects");
        effects.classList.toggle("active", next.effectsEnabled);
        effects.querySelector("strong").textContent = next.effectsEnabled ? " On" : " Off";
        document.querySelectorAll("[data-scene]").forEach((button) => button.classList.toggle("active", button.dataset.scene === next.sceneMode));
        renderGifs(next.gifs || []);
      }

      function renderGifs(gifs) {
        const container = byId("gifs");
        byId("gif-count").textContent = gifs.length + " saved";
        const signature = gifs.map((gif) => gif.id + gif.label).join("|");
        if (container.dataset.signature === signature) return;
        container.dataset.signature = signature;
        container.replaceChildren();
        if (gifs.length === 0) {
          const empty = document.createElement("div");
          empty.className = "empty";
          empty.textContent = "Add GIFs in Duck Desk to use them here.";
          container.append(empty);
          return;
        }
        gifs.forEach((gif) => {
          const button = document.createElement("button");
          button.className = "control";
          button.textContent = gif.label;
          button.addEventListener("click", () => send({ type: "trigger_gif", id: gif.id }));
          container.append(button);
        });
      }

      document.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => send(JSON.parse(button.dataset.action))));
      document.querySelectorAll("[data-scene]").forEach((button) => button.addEventListener("click", () => send({ type: "set_scene", scene: button.dataset.scene })));
      document.querySelectorAll("[data-sound]").forEach((button) => button.addEventListener("click", () => send({ type: "trigger_sound", kind: button.dataset.sound })));
      byId("banner").addEventListener("click", () => status && send({ type: "set_banner", visible: !status.bannerVisible }));
      byId("effects").addEventListener("click", () => status && send({ type: "set_effects", enabled: !status.effectsEnabled }));
      void poll();
      setInterval(poll, 1500);
    })();
  </script>
</body>
</html>`;
}
