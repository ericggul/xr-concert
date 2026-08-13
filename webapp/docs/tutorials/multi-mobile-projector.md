# Tutorial: multi-mobile to projector rehearsal

This tutorial turns the current app into a repeatable small-room experiment before Unreal, TouchDesigner, biosensing, or haptics are added.

## Goal

Confirm the complete relation:

```text
many audience fingers -> WSS relay -> collective parameters -> projector
```

The tutorial begins with two phones and one laptop display, then scales in controlled steps.

## 1. Prepare the MacBook

From `webapp/`:

```bash
nvm use
pnpm install
cp .env.example .env
```

Start the HTTPS workflow yourself:

```bash
pnpm dev
```

Keep the three printed URLs visible. Connect the projector as an extended display and open `/screen` full-screen in a dedicated browser window.

## 2. Trust the development certificate

On each test phone, open the printed relay `/cert` URL over the same Wi-Fi, install the profile, and enable certificate trust. Then open the printed `/mobile` URL. A browser warning means the device is not ready; do not continue over HTTP.

## 3. Two-phone baseline

1. Open `/admin` on the laptop.
2. Confirm the device counts show one screen and two audience phones.
3. Choose `Particle`, then start input.
4. Touch phone A near the upper-left and phone B near the lower-right.
5. Confirm the projection response is centered between them, not duplicated at both positions; this verifies the current centroid model.
6. Release one phone and confirm the projection shifts toward the remaining contributor.
7. Close a phone mid-touch and confirm its contribution disappears within roughly 750 ms.

## 4. Compare the interaction readings

Hold the same gesture instructions constant.

1. Select `Particle` and observe event locality, density, and whether individual agency remains perceptible.
2. Select `Wave` and observe propagation, continuity, and whether small movements remain legible.
3. Select `Both` and observe whether the dual reading is clearer or only busier.

Record for each reading:

- changed variable: renderer mapping;
- invariants: phones, gesture, relay frame, room, projector, duration;
- direct observation: what participants could notice or describe;
- uncertainty: what cannot yet be inferred;
- next smallest change.

## 5. Scale without changing the experiment

Repeat at 5, 10, 20, then the largest available phone count. Do not add new visual features during the scale test.

At each step record:

- joined/active phone counts;
- relay CPU and memory;
- screen smoothness;
- disconnect/reconnect events;
- Wi-Fi access-point load;
- how long it takes a participant to understand the gesture;
- whether individual action remains perceptible inside the group.

Run the synthetic transport harness separately. It helps locate a technical threshold but cannot substitute for physical phones or audience behavior.

## 6. Broadcaster trial

1. Use headphones during setup to prevent feedback.
2. In `/admin`, start the microphone.
3. Touch the existing artwork surface once on each phone; this is also the browser gesture that permits audio playback.
4. Confirm audible sound, then stop and restart the broadcast.
5. Reload one listener, touch the artwork surface, and confirm audio resumes.

Do not scale this peer-to-peer audio trial to the full audience. Select and integrate an SFU first.

## 7. Failure drill

During a live visual gesture:

1. Stop the microphone: visuals must continue.
2. Reload the projection page: mobile connections and session must remain.
3. Close admin: the live session must not reset.
4. Restart only the relay in a planned technical test: pages must show offline/reconnecting rather than pretending to be live.
5. Restore the relay, reset into a new epoch, and start again.

## 8. When to add an external renderer

Add Unreal or TouchDesigner only after the web baseline passes the two-phone lifecycle and target-count control test. The adapter should consume one aggregate frame per relay tick and map those abstract parameters inside the renderer. Keep `/screen` as the operational fallback.
