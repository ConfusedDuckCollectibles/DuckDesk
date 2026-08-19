# Contributing to Duck Desk

Duck Desk is a local-first, open-source live seller overlay toolkit. The goal is simple: give sellers professional stream tools without subscriptions, locked platforms, or cloud dependency.

## Project Principles

- Keep seller data local by default.
- Do not use private, undocumented, or reverse-engineered platform APIs.
- Build transparent tools that sellers can inspect, fork, and improve.
- Keep AI assistant features out of this project.
- Prefer small, testable changes over sweeping rewrites.

## Getting Started

```bash
npm install
npm run typecheck
npm run dev:desktop
```

For the packaged Mac app:

```bash
npm run mac:dmg
```

## Useful Work Areas

- `apps/desktop`: Electron Mac app and local event bridge.
- `apps/overlay`: transparent OBS overlay.
- `apps/extension`: Chrome extension that observes visible seller-page events.
- `packages/shared`: shared event and overlay message types.

## Pull Request Checklist

- Run `npm run typecheck`.
- Do not commit `.env`, build artifacts, DMGs, app bundles, logs, tokens, or local machine paths.
- Keep user-facing docs free of competitor names.
- Explain whether the change affects OBS, the Chrome extension, or the Mac app.
- Add screenshots or short clips for visible overlay/UI changes when possible.

## Event Detection Policy

Duck Desk should only observe visible page content that the seller can already see in their browser. Do not add private API calls, credential scraping, network interception, or platform automation that violates another service's rules.

## Community

Be direct, kind, and practical. Many contributors will be sellers first and engineers second, so documentation and clear reproduction steps matter.
