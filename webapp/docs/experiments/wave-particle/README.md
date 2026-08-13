# Wave / Particle Study

## Proposition

Can one simple mobile gesture remain legible as both a discrete event and a continuous collective modulation when 5–100 audience members share a projection?

This is an interaction-design study. “Particle” and “wave” do not claim a quantum-mechanical simulation.

## Design contract

- Participant situation: a seated or standing audience member holds their own phone while looking primarily at the shared projection.
- Primary relation: finger contact and movement contribute to a collective spatial field.
- Perceptual job: the participant should notice that an initial touch has a distinct consequence and continued movement modulates a longer collective response.
- Interaction job: touch starts immediately; movement streams while held; release ends contribution.
- Multi-device necessity: individual phones contribute partial input while only the projection reveals the combined field.
- Invariant: the relay frame contains parameters, not presentation values.
- Removal test: connection state, one action cue, local contact feedback, and optional audio permission remain. Charts, sliders, legends, captions, and ornamental metadata are removed.

## Three admin readings

The input and aggregate state stay identical while the screen mapping changes:

- `particle`: initial and continued contributions create bounded local traces.
- `wave`: the collective centroid emits expanding propagation rings.
- `hybrid`: both reveal the discrete/continuous dual reading.

Because only the renderer mapping changes, the operator can compare readings without changing audience instructions or server state.

## Data dynamics

- Mobile pointer movement: at most 25 samples per second per active phone.
- Relay acceptance ceiling: 120 input messages per second per socket.
- State: one latest active sample per socket; no path history.
- Abandoned contribution expiry: 750 ms.
- Projection frame: fixed 30 Hz while live and at least one screen is connected.
- Projector canvas: up to 700 local particles; waves expire after 2.6 seconds.
- Device pixel ratio: capped at 1.5 for installation stability.

## Parameter mapping

```text
per-phone x/y/pressure
  -> collective centroid
  -> mean pressure as energy
  -> normalized spatial variance as coherence
  -> start-event count as impulses
```

`coherence` is a bounded design parameter derived from spatial dispersion. It is not a scientific synchrony measure.

## Current status

Implemented as the first baseline. Static protocol checks exist. Real-device and venue observations are still required, so no claims are made yet about participant comprehension, aesthetic success, or 100-phone behavior.

## Rehearsal questions

1. Do participants keep looking at the projection or become trapped in the phone surface?
2. Can one person perceive a relation between their contact and the collective image when 20 people overlap?
3. Does the `particle` reading become noise at scale?
4. Does the `wave` reading erase minority or spatially distant inputs through centroid aggregation?
5. Does `hybrid` clarify the two interaction characters or simply accumulate effects?
6. Should later versions preserve clusters/distribution instead of reducing the group to one centroid?

The likely next experiment is not “more particles.” It is a comparison between scalar aggregation and cluster-preserving aggregation while holding the mobile interaction and visual family constant.
