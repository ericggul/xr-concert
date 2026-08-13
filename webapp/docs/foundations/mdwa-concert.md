# MDWA for the NRF XR Concert

The artwork is the connected room, not any one page. Audience phones, the operator laptop, projection, audio, future XR/haptic devices, and their changing relations form the unit of work.

## Concert-specific nodes and edges

```text
operator laptop --authoritative session commands--> relay
audience phone --continuous/discrete gesture samples--> relay
relay --collective parameter frame--> projection browser
operator microphone --WebRTC media--> opted-in audience phone
relay --future aggregate adapter--> Unreal / TouchDesigner
```

The important material is the edge: who influences whom, at what cadence, with what authority, and what happens when the edge disappears.

## Parameter path

```text
raw pointer samples
  -> validated latest sample per audience member
  -> bounded collective frame
  -> independent visual / audio / engine mappings
```

The relay currently owns centroid, collective energy, coherence, contributor count, and new-contact impulses. It does not own circles, colors, particle sizes, line widths, or animation timing. This lets a web projection, Unreal scene, TouchDesigner patch, or haptic system interpret the same concert state differently.

## Particle and wave interaction

“Particle” and “wave” are interaction-design hypotheses, not literal physics claims.

- Particle reading: contact begins as a discrete, semantically bounded event. The audience can understand that a particular touch occurred.
- Wave reading: continued movement is sampled as a continuous field whose intensity and collective distribution evolve over time.
- Hybrid reading: one gesture retains both characters. Contact creates an event while movement continuously modulates the field.

This avoids presenting a button grid as the whole interaction or presenting bodily motion as a visually impressive but semantically empty effect.

## State and failure

The initial session state is deliberately small: `idle`, `live`, and `paused`. Reset produces a new epoch so future persistent systems can reject events from an earlier performance.

Every major subsystem must fail independently:

- If WebRTC audio fails, WSS audience interaction and projection continue.
- If one phone disappears mid-gesture, its sample expires after 750 ms.
- If the projection reloads, the relay and mobile clients remain connected.
- If the admin closes, the live experiment does not reset implicitly.
- If a future engine consumer fails, the web projection can remain the fallback.

## Claims kept deliberately modest

- The current experiment demonstrates a bounded multi-device relation; it does not prove emergence or a phase transition.
- The WebRTC broadcaster is an early P2P rehearsal tool; it is not the 100-person media architecture.
- A Socket.IO connection is infrastructure, not by itself an artistic relation.
- The wave/particle language is a working design lens, not a scientific model of quantum behavior.
