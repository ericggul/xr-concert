# NRF XR repository rules

## Scope

- This Git repository begins at `nrf-xr/`; do not initialize nested Git repositories inside its applications.
- `webapp/` is the active concert application. Read `webapp/AGENTS.md` before changing it.
- `broadcaster/` is the original prototype. Treat it as reference unless the user explicitly requests changes there.
- Do not deploy, push, or modify external documents without explicit user direction.

## Repository structure

- Keep deployable runtimes in independent top-level directories.
- Do not move `webapp` files to the repository root merely to simplify a deployment platform.
- Vercel configuration must use `webapp` as the project Root Directory.
- Future TouchDesigner, Unreal, SFU, or bridge runtimes must have explicit ownership and failure boundaries.

## Git safety

- Preserve unrelated user changes.
- Never commit `.env` files, credentials, certificates, private keys, generated output, or dependencies.
- Do not commit, push, rewrite history, or create releases unless the user explicitly asks.
- Run verification from the directory that owns the relevant package manifest.

