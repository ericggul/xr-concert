# HTTPS, WSS, and venue network

## Agent operation rule

Agents never start, stop, restart, or kill the Next.js or realtime server. If runtime verification needs a server that is not running, they must say exactly: `전하, 소인이 감히 실제 작동을 확인해 올리려면 서버가 필요하옵니다. 번거로우시겠지만 서버 켜주세요 전하.`

If changed server or socket code requires the already-running process to restart, they must instead say exactly: `전하, 미천한 소인이 감히 새로 고친 서버 코드를 반영해 올리려면 기존 서버를 다시 기동해야 하옵니다. 번거로우시겠지만 서버 재시작해주세요 전하.` A bare restart command is not acceptable.

## Why HTTPS is mandatory

The mobile route and WebRTC microphone use browser capabilities that require a secure context. Localhost trust does not transfer to a phone opening the MacBook's LAN address, so the rehearsal environment uses one generated local root CA and a server certificate containing:

- the MacBook's `<LocalHostName>.local` mDNS name (`macbook-air-5.local` on the current host);
- `localhost` and `127.0.0.1` for laptop-only diagnostics, never as audience entry URLs.

Both Next.js and Socket.IO receive the same certificate. The app therefore loads over HTTPS and its realtime connection upgrades over WSS without mixed content.

## MacBook routing

`scripts/generate-certs.sh` gets the Mac name from `scutil --get LocalHostName`, lowercases it, appends `.local`, and stores the result in `certificates/.hostname`. `scripts/dev-https.mjs` binds both processes to `0.0.0.0` but prints the stable mDNS URL for phones.

If the MacBook name changes, rerunning `pnpm dev` regenerates the leaf certificate while retaining the local root CA. If the root CA itself is removed, every phone must trust the replacement certificate again.

## Rehearsal setup

1. Use a dedicated dual-band or Wi-Fi 6 access point under the team's control.
2. Connect the MacBook by Ethernet to that access point when possible.
3. Keep audience phones on one SSID; disable client isolation.
4. Prevent captive portals, automatic band steering surprises, and venue guest-network isolation.
5. Confirm `macbook-air-5.local` resolves from iOS and Android on the rehearsal Wi-Fi.
6. Install/trust the root CA on test phones before doors open.
7. Keep the Mac awake, powered, and on a fixed physical network position.
8. Rehearse with the expected peak device count and with internet disconnected while LAN remains active.

## Ports

| Service | Default | Environment override |
| --- | ---: | --- |
| Next.js HTTPS | 10000 | `WEB_PORT` |
| Socket.IO HTTPS/WSS | 10001 | `REALTIME_PORT`, `NEXT_PUBLIC_REALTIME_PORT` |

The runner refuses to start if either port is occupied or both resolve to the same value.

## Production boundary

The generated CA is development infrastructure. Development accepts browser origins and admin-role control on the trusted rehearsal LAN. Before public access:

- use a domain with publicly trusted TLS;
- set exact `REALTIME_ALLOWED_ORIGINS`;
- put the stateful relay behind a WebSocket-capable reverse proxy;
- keep proxy idle timeouts above Socket.IO's heartbeat window;
- provide owned STUN/TURN or an SFU service for WebRTC;
- rotate admin and TURN credentials outside browser-visible configuration.

Never put future admin credentials or TURN long-term secrets in `NEXT_PUBLIC_*`. The sample client ICE configuration is visible by design; production TURN should use short-lived credentials issued by a backend.
