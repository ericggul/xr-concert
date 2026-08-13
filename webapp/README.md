# NRF XR webapp

A modular Next.js system for the 2027 NRF XR Concert. It coordinates an operator laptop, audience phones, and a web-based projection screen while keeping realtime control data and WebRTC audio independent.

```text
/admin  ── session control + WebRTC microphone source
   │
   ├── WSS / Socket.IO ── validated concert state and experiment parameters
   │         ├── /mobile  audience instrument (many)
   │         └── /screen  projection renderer (one or more)
   │
   └── WebRTC signaling over WSS ── audio to opted-in mobile listeners
```

The existing prototype remains at `../broadcaster`. This app does not import from it; the broadcaster behavior has been rebuilt behind the concert session boundary.

## What is implemented

- `/admin`: authenticated start, pause, reset, visual-mode controls, presence counts, audience QR, and microphone broadcast.
- `/mobile`: one full-screen audience instrument plus an optional WebRTC audio listener.
- `/screen`: a projector-safe canvas renderer.
- `wave-particle`: the first experiment. A touch is read simultaneously as a discrete particle event and a continuous collective wave field.
- HTTPS/WSS local development using the MacBook's `.local` hostname and a generated local root CA.
- Experiment-isolated server registry, versioned input messages, sequence validation, per-client latest-sample state, stale-input expiry, 30 Hz aggregation, and bounded payloads.
- Unit tests and a real-socket load harness.

## Runtime

The project matches the SCC runtime baseline:

- Node.js `26.5.1` locally (`.nvmrc`, `.node-version`)
- Node engine range `24.x || 26.x`
- pnpm `11.17.0`
- Next.js `16.3.0`, React `19.2.4`, App Router

Activate Node 26 and install:

```bash
nvm use
corepack enable
corepack prepare pnpm@11.17.0 --activate
pnpm install
cp .env.example .env
```

Set a real `ADMIN_PASSCODE` in `.env`, then start the user-owned HTTPS workflow:

```bash
pnpm dev
```

The command prints the exact `.local` URLs. Defaults are:

- app: `https://macbook-air-5.local:10000`
- realtime relay: `https://macbook-air-5.local:10001`
- mobile certificate: `https://macbook-air-5.local:10001/cert`

Do not use an HTTP fallback for phone rehearsals. Microphone capture and several sensor APIs require a secure context.

## First phone setup

Each phone needs the development root certificate once:

1. Join the same Wi-Fi network as the MacBook.
2. Open the printed `/cert` URL in Safari and download the profile.
3. Install it in Settings → General → VPN & Device Management.
4. On iOS, enable full trust in Settings → General → About → Certificate Trust Settings.
5. Open the printed `/mobile` URL, not `localhost`.

For a public or internet-facing rehearsal, use a real domain and publicly trusted TLS certificate instead of distributing the development CA.

## Verification

Safe checks that do not start servers:

```bash
pnpm check
```

With the HTTPS app and relay already running, a bounded transport load check is available:

```bash
CLIENTS=20 SAMPLE_HZ=25 DURATION_MS=10000 pnpm test:load
```

That harness measures transport handling only. A rehearsal still needs real phones, the venue access point, the projector, microphone permission, audible WebRTC confirmation, disconnect/reconnect trials, and an operator-led failure drill.

## Documentation

- [Documentation map](./docs/README.md)
- [System architecture](./docs/harness/architecture.md)
- [HTTPS and venue network](./docs/harness/https-and-network.md)
- [WebRTC broadcaster](./docs/harness/webrtc-broadcast.md)
- [Experiment structure](./docs/harness/experiments.md)
- [Multi-mobile to projector tutorial](./docs/tutorials/multi-mobile-projector.md)
- [Wave / particle experiment](./docs/experiments/wave-particle/README.md)
- [Concert design guidelines](./docs/foundations/design-guidelines.md)

No deployment or Unreal/TouchDesigner adapter is included yet. The realtime frame boundary is intentionally renderer-neutral so those consumers can be added later without changing audience input messages.
