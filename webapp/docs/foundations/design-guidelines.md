# NRF XR concert design guidelines

## The interface is a score, not a costume

Do not turn “XR concert” into black glass, neon gradients, glowing grids, fake telemetry, waveform decoration, or tiny sci-fi labels. The visual form must clarify an action in the room.

Before implementing a surface, state:

1. Participant and physical situation.
2. One primary parameter or relation.
3. What change the participant must notice.
4. What action they can take and what expectation it creates.
5. Why the form needs multiple devices.
6. Which element can be removed without weakening the relation.

## Current system family

- Material: cool rehearsal paper, charcoal stage, muted copper contact, desaturated water-blue propagation.
- Typography: a locally available condensed grotesk for large action language, neutral sans for reading, monospace only for operational values.
- Scale: participant copy at 16 px or larger; no micro-label layer. Projection type must remain legible from the back of the assumed venue.
- Geometry: broad fields and clear controls. Rounded corners are used only for touch containment, not as a card system.
- Motion: one continuous projection field. UI controls do not animate for atmosphere.
- Separation: spacing and type hierarchy; no decorative horizontal rules or repeated separators.

## Surface jobs

### Mobile

The phone is a bodily instrument. The full field owns the gesture, provides immediate local position feedback, and uses very little text. It does not show server internals, charts, or the projected result in miniature.

### Screen

The projection makes collective relation visible. It does not duplicate individual mobile interfaces. Its quiet idle state is a rehearsal cue, not a branded hero section.

### Admin

The laptop supports safe operation: session state, mode, device presence, audience entry, reset, and audio broadcast. Density comes only from required controls. No fictional metrics or decorative “live system” indicators are allowed.

## Removal test

Reject any element that survives only because it makes the project look technical. Connection state, participant count, control state, QR entry, permission actions, and errors are functional. Badges, ornamental waveforms, version strings, fake timestamps, captions, and decorative panels are not.
