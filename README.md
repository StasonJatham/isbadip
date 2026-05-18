# isbadip.com

[![Website](https://img.shields.io/website?url=https%3A%2F%2Fisbadip.com&label=website)](https://isbadip.com)
[![API](https://img.shields.io/website?url=https%3A%2F%2Fapi.isbadip.com%2Fapi%2Fv1%2Fhost%2F8.8.8.8&label=api)](https://api.isbadip.com/api/v1/host/8.8.8.8)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Free API](https://img.shields.io/badge/API-free-16a34a)

Free malicious IP and domain reputation lookup for quick security checks, automation, dashboards, and public integrations. `isbadip.com` combines public threat-intelligence feeds with local attack telemetry, so it is more than a thin wrapper around the same lists everyone else already republishes.

![isbadip.com social preview](https://isbadip.com/og-image.jpg)

No tracking. No account. No API key.

## Live Service

- Website: [https://isbadip.com](https://isbadip.com)
- Public API: [https://api.isbadip.com/api/v1/host/8.8.8.8](https://api.isbadip.com/api/v1/host/8.8.8.8)
- Honeypot events: [https://isbadip.com/honeypot](https://isbadip.com/honeypot)

## What It Checks

`isbadip.com` checks whether a host appears in reputation data built from:

- public IP blocklists
- public domain blocklists
- custom IP lists from IDS and IPS alerts
- custom domain lists from attack and probe traffic
- web-application attack logs seen by Karl's own infrastructure

That custom-list layer is what makes the service useful: hosts that actively probe or attack real services can be surfaced even before they show up in common public feeds.

## Public API

```text
GET https://api.isbadip.com/api/v1/host/{ip-or-domain}
GET https://api.isbadip.com/api/v1/honeypot/summary
GET https://api.isbadip.com/api/v1/honeypot/events?q=login&source=network&page=1&limit=25
GET https://api.isbadip.com/api/v1/honeypot/iocs?limit=250
```

Example:

```bash
curl -s https://api.isbadip.com/api/v1/host/8.8.8.8 | jq
```

The API is public and does not require authentication. It is designed for lightweight checks, shell scripts, dashboards, enrichment workflows, and simple integrations.

## How It Works

The backend continuously merges:

- public threat-intelligence feeds
- public reputation data
- locally observed attack and abuse signals
- manually managed internal blocklist entries

The output is normalized into a single public lookup response so the frontend stays simple and the API remains easy to consume.

## Data Freshness

Threat-intelligence data is refreshed automatically and the compiled database is rebuilt regularly so lookups reflect current public feeds plus the latest custom observations.

The API is intentionally simple: one host in, one reputation result out.

## Frontend

This repository contains the public frontend for `isbadip.com`.

- Framework: React 19
- Build tool: Vite 8
- Language: TypeScript
- Deployment target: Cloudflare Pages

The backend API is served separately at [https://api.isbadip.com](https://api.isbadip.com).

## Local Development

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

Optional environment variable:

```bash
VITE_API_BASE_URL=https://api.isbadip.com
```

## Deployment

Recommended Cloudflare Pages settings:

- Framework preset: `React (Vite)`
- Build command: `npm run build`
- Build output directory: `dist`

Required environment variable:

```bash
VITE_API_BASE_URL=https://api.isbadip.com
```

## Related Services

- [isproxy.org](https://isproxy.org) — proxy, VPN, Tor, hosting, and residential-proxy lookup
- [is-windows-broken.com](https://is-windows-broken.com) — Windows patch and release-health rollout monitor

## Author

Built by Karl — [karl.fail](https://karl.fail) · [karlcom.de](https://karlcom.de)

## License

MIT
