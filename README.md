# XR Concert

Root repository for the NRF XR concert system. Each runtime remains isolated so a failure or deployment decision in one surface does not force the other parts to move with it.

## Repository layout

```text
nrf-xr/
├── webapp/       Next.js admin, mobile, and screen surfaces plus realtime relay
└── broadcaster/  original broadcaster prototype retained as reference
```

The active application and its complete setup documentation live in [`webapp/README.md`](./webapp/README.md).

## Local development

```bash
cd webapp
nvm use
pnpm install
cp .env.example .env  # first run only; then set ADMIN_PASSCODE
pnpm dev
```

Primary local routes:

- `https://macbook-air-5.local:10000/admin`
- `https://macbook-air-5.local:10000/mobile`
- `https://macbook-air-5.local:10000/screen`
- `https://macbook-air-5.local:10001` for the Socket.IO/WSS relay

## Vercel boundary

The Next.js application can be deployed from this repository as an independent Vercel project by setting its **Root Directory** to `webapp`.

The current `webapp/realtime-server.mjs` is a stateful, long-running Socket.IO process. It is not part of the Next.js Vercel build and should be deployed to a persistent Node runtime or redesigned around durable shared state before a Vercel-native realtime deployment. Configure the deployed frontend with `NEXT_PUBLIC_REALTIME_URL=https://<relay-domain>`.

Local TLS certificates, `.env` files, generated output, dependencies, and machine-local agent settings are ignored at the repository root.

