# NRF XR agent rules

## Scope

- The Git repository begins at `nrf-xr/`; this application remains isolated in `webapp/` as its deployable root. Do not move its files to the repository root.
- `../broadcaster` is read-only reference material. Do not import it, edit it, or make the new app depend on it.
- Do not deploy, push, or modify external documents without explicit user direction.

## Before changing code

- Read `llm.txt`, `docs/README.md`, and the document for the owned subsystem.
- For experiment changes, also read `docs/foundations/mdwa-concert.md`, `docs/foundations/design-guidelines.md`, and the experiment document.
- Trace every socket event from sender through relay to every consumer before changing its name or payload.
- Consider 5, 20, and 100 concurrent phones, late joins, reconnects, abandoned gestures, duplicate messages, and one failed device.

## Runtime and package management

- Local Node is `26.5.1`; accepted engines are `24.x || 26.x`; package management uses pnpm `11.17.0`.
- Keep `@types/node` on major 24 until the deployment runtime deliberately changes.
- Local device testing is HTTPS/WSS only. Do not add an HTTP convenience path.
- Never commit `.env`, certificates, private keys, TURN credentials, or admin passcodes.
- Agents may run `pnpm lint`, `pnpm typecheck`, and `pnpm test`.
- Do not start or stop the development server unless the user explicitly requests runtime testing.
- Do not run browser automation unless the user explicitly requests browser testing.

## Architecture

- App Router route files stay thin. Composition belongs under `components/`; experiment behavior belongs under `experiments/<id>/`.
- Each experiment owns a unique id, room, input contract, server model, mobile presenter, screen presenter, test, and document.
- Socket servers own abstract domain state, lifecycle, time, aggregation, and permissions. They never emit color, radius, opacity, easing, layout, or animation instructions.
- High-rate mobile samples use stable interaction ids and monotonic sequence numbers. Keep latest-sample-wins aggregation bounded; never queue an unbounded sensor history.
- Smooth continuous input once at the consuming presentation boundary. Do not independently smooth on mobile, relay, and screen.
- WebRTC is for media. Socket.IO/WSS is for state, input, presence, admin commands, and WebRTC signaling.
- The current WebRTC broadcaster is peer-to-peer. Do not claim it supports 100 listeners. Add an SFU adapter before expanding that promise.
- Unreal or TouchDesigner integration must consume the aggregate frame boundary. Never issue browser messages directly to individual engine actors.

## Visual and interaction design

- Read `docs/foundations/design-guidelines.md` before creating or materially changing an interface.
- Design from the participant's action and the cross-device relation, not from “XR”, “concert”, or “technology” as visual themes.
- Do not add generic AI dashboard chrome, gradients, glass cards, glow, tiny labels, fake live badges, decorative dividers, captions, or technical copy without a functional need.
- Keep participant text at 16 px or larger and touch targets at least 44 px in both dimensions.
- A mobile is an instrument, not a miniature admin panel. A screen is the collective output, not a duplicate of the mobile.
- Respect reduced motion, keyboard focus, safe-area insets, and user-gesture permission requirements.

## Experiments and documentation

- A new experiment begins as a bounded, reversible trial. State the participant situation, parameter, mapping, invariant, observed outcome, and unresolved question.
- Preserve a stable working experiment rather than silently rewriting its meaning. Add a new id or version when the tested relation changes materially.
- Put durable repo-wide notes under `docs/harness/` or `docs/foundations/`; put experiment notes under `docs/experiments/<id>/`; put rehearsal procedures under `docs/tutorials/`.
- Update `docs/README.md` and `llm.txt` when adding a durable document or experiment.

## Verification

- Protocol tests must cover validation, duplicate/stale rejection, lifecycle end, bounded aggregation, and absence of presentation fields.
- A load harness is not an experience test. Final venue readiness requires real-device HTTPS, Wi-Fi saturation, projector, audio, reconnect, and failure-mode checks.
- Preserve user changes and unrelated files. Keep shared-registry edits surgical.
