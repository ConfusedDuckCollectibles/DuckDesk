# Security Policy

Duck Desk is local-first. The Mac app, overlay, and Chrome extension are designed to run on the seller's machine and communicate over localhost.

## Supported Versions

This project is pre-1.0. Security fixes should target `main`.

## Reporting a Vulnerability

Please report vulnerabilities privately through GitHub Security Advisories once the repository is public. If advisories are not enabled yet, open a minimal issue that says a private security report is needed, without publishing exploit details.

## What Counts

- Secrets, tokens, or credentials being logged, stored, or exposed.
- Localhost endpoints accepting unsafe input that could affect the host machine.
- Chrome extension permissions that are broader than needed.
- Overlay content injection that could execute script or leak seller data.

## Data Handling

Do not add cloud telemetry, account systems, analytics, or remote logging without a public discussion and explicit opt-in design.
