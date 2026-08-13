# Source and decision ledger

This ledger distinguishes sources from design decisions. External and Drive materials were read-only; nothing outside `nrf-xr/webapp` was edited.

## Project sources

| Source | Kind | Used for | Limits |
| --- | --- | --- | --- |
| [NRF XR Concert 2027 Agent Brief](https://docs.google.com/document/d/1lYWqF0w6yBQBeno3ND4yEYnAcbAhJ9vA6LL0v6L0u08) | Project brief | Concert context, 20–30 early audience assumption, central projection, performer/audience embodiment, modular failure requirement | Schedule, duration, performers, venue infrastructure, and mobile's final artistic role remain undecided |
| [2026-MDWA Siggraph Art Paper](https://docs.google.com/document/d/16JDwHWxVrHO33_QwjzZCFyjXNhUoWoiYBcTfqa8Mop0) | Working research manuscript | Browser as instrument, cross-device narrative, parametric mapping, low-barrier BYOD, distributed artwork framing | A working manuscript and review record; not treated as final empirical proof |
| `../scc/docs/foundations/mdwa.md` | Local artist theory | Current MDWA definition, particle/wave interaction lens, state architecture, graph and parameter distinctions | Read as the artist's evolving framework; speculative extensions stay labelled as hypotheses |
| `../scc/docs/foundations/design-guidelines.md` | Local design standard | Anti-dashboard constraints, participant-task-first wrappers, multi-device relation over screen spectacle | Adapted to this concert; visual tokens were not copied |
| `../scc/docs/foundations/tinkering.md` | Local working method | Bounded reversible experiments, preserved baselines, observation vs inference | Method, not an aesthetic style |
| `../scc/docs/harness/*` | Engineering precedent | Node/pnpm baseline, thin routes, modular sockets, HTTPS runner, documentation ownership | This app is one standalone Next.js repository, not a copied four-app monorepo |
| `../../project/ydp/banpo-xism` | Installation precedent | Multi-role presence, latest-wins high-rate input, single-stage consumer smoothing, admin operation, Mac local HTTPS | Its application-specific manifold/session logic was not copied |
| [Mobile-to-Unreal Realtime Backbone](https://github.com/ericggul/mobile-to-unreal-realtime-backbone) | Public tutorial repository | Stable lifecycle ids, monotonic sequences, latest sample per interaction, fixed aggregate tick, single external-renderer boundary, load harness | Unreal portion intentionally deferred |

## Web platform sources

| Source | Used for |
| --- | --- |
| [MDN: `getUserMedia`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) | HTTPS secure-context and explicit permission requirements |
| [MDN: WebRTC protocols](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Protocols) | ICE, STUN, TURN, and relay fallback distinctions |
| [MDN: WebRTC connectivity](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Connectivity) | Offer/answer/ICE signaling sequence |
| [Next.js: custom server guide](https://nextjs.org/docs/app/guides/custom-server) | Decision to keep the realtime backend separate rather than wrap Next.js in a custom server |
| [Next.js: `allowedDevOrigins`](https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins) | Local `.local` development origin configuration |

## Decisions and status

| Decision | Evidence level | Status |
| --- | --- | --- |
| Socket.IO/WSS for audience state and high-rate gesture transport | Structural fit plus precedent in SCC/Banpo and public backbone | Implemented |
| WebRTC only for broadcaster media; WSS for signaling | Web platform architecture | Implemented |
| Peer-to-peer broadcast is small-room only | Direct topology inference: broadcaster maintains one peer per listener | Implemented and explicitly bounded |
| SFU required before promising 20–100 audio listeners | Architectural recommendation; provider not selected | Deferred |
| 25 Hz mobile and 30 Hz aggregate cadence | Bounded tutorial precedent and current rehearsal choice | Implemented; must be measured in venue |
| One centroid/coherence aggregate | Minimal experiment choice | Implemented; may erase clusters/minorities |
| Wave/particle duality | Artist's interaction-design hypothesis | Implemented as a study, not a scientific claim |
| Web screen remains external-renderer fallback | Concert modularity requirement | Implemented |
