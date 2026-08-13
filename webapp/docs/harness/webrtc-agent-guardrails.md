# WebRTC agent guardrails and incident prevention

This document records the August 2026 audio-broadcast implementation failure and defines mandatory safeguards for future agents. It is an engineering harness, not a general WebRTC tutorial.

## Why this document exists

The repository already contained a working reference implementation in `../broadcaster`. The replacement should have preserved its proven media path and changed only the signaling transport and integration boundary. Instead, the first implementation silently changed behavior, removed operational controls, and then treated downstream symptoms as new browser problems.

The resulting failure was avoidable. A connected peer is not proof of audible media, and a cleaner-looking abstraction is not an improvement when it removes a required capability.

## Mistakes made

### 1. The working baseline was not ported faithfully

The reference broadcaster included:

- explicit audio-input enumeration and selection;
- the selected `deviceId` in `getUserMedia`;
- music/line-in-safe constraints;
- a source-level meter;
- one peer per listener;
- direct offer, answer, and ICE forwarding;
- one audio element per listener;
- an explicit user gesture before subscription and playback.

The replacement retained the broad WebRTC shape but removed input selection and the meter. It therefore lost the ability to guarantee or even observe which signal was being transmitted.

Prevention: before replacing a working subsystem, make a parity ledger. Every behavior must be marked `preserved`, `intentionally changed`, or `deferred with user approval`. Unlisted removal is a defect.

### 2. Capture constraints were changed without evidence

The working broadcaster used:

```ts
{
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
  channelCount: 2,
}
```

The replacement initially enabled echo cancellation and noise suppression. Those settings may suppress music, line-in, virtual-device, and sustained signals. This was an unauthorized semantic change.

Prevention: preserve media constraints byte-for-byte when porting a proven path. Change one constraint at a time only after a reproduced test demonstrates the need.

### 3. Control-plane success was mistaken for media success

The observed sequence reached:

```text
offer -> answer -> ICE connected -> remote track live -> play() resolved
```

That proves negotiation and playback state. It does not prove that the captured source contains non-zero audio energy, that RTP audio bytes are increasing, or that the physical output is audible.

Prevention: keep these evidence layers separate:

1. capture: selected device, live track, moving source meter;
2. signaling: listener request, offer, answer, ICE candidates;
3. transport: connected peer and increasing RTP packets/bytes;
4. receiver: remote track attached and `play()` resolved;
5. perception: audible sound on the target physical device.

Never claim layer 5 from evidence at layers 2–4.

### 4. Diagnosis began with speculation instead of isolation

Autoplay, iOS behavior, hidden audio elements, and phone settings were considered before proving that the selected admin source contained sound. The user's known-good broadcaster setup made code divergence the first hypothesis, not the phone.

Prevention: when a reference works on the same devices and network, diff the new implementation against that reference before blaming environment, permissions, hardware, or the user.

### 5. The solution was overcomplicated while the cause was unknown

Intermediate changes added listener state, connection labels, retry paths, and proposed mobile playback controls. These additions increased state surface without establishing the failing layer. They also conflicted with the explicit product requirement that mobile remain a lean artwork surface without extra audio UI.

Prevention: no new WebRTC state machine, audience control, retry loop, or transport abstraction without a reproduced failure and a written reason that the existing four-step path cannot handle it.

### 6. Observability arrived too late

The initial implementation had no stage-level trace. The admin listener count showed registration but could not distinguish capture, offer, answer, ICE, track, playback, or audio energy.

Prevention: development diagnostics must be available from the first integration test, remain separate from transport logic, exclude SDP/candidates and credentials, and use stable stage names.

### 7. Completion was claimed prematurely

Static tests passed, but no same-device parity test against the original broadcaster had established audible output. Several responses described the issue as fixed before the physical result was verified.

Prevention: for audio, `pnpm check`, signaling unit tests, or `RTCPeerConnection.connectionState === "connected"` are insufficient completion gates. The final gate is audible output on the intended phone using the intended admin input.

### 8. Repository operating rules were not propagated early enough

The SCC server-ownership rule and exact start/restart wording were inspected but not initially copied into the root and app-level agent entrypoints. A bare restart instruction was then given.

Prevention: operational rules that affect every future agent belong in root `AGENTS.md`, app `AGENTS.md`, and `llm.txt` before implementation begins. Harness documents provide detail; entrypoints enforce discovery.

## Mandatory parity ledger

Before modifying or replacing the broadcaster, an agent must complete this table in its working notes and keep every row accounted for:

| Reference behavior | Required NRF XR behavior |
| --- | --- |
| Enumerate audio inputs | Preserve |
| Operator selects input | Preserve on `/admin` |
| Exact selected `deviceId` | Pass to `getUserMedia` |
| Music-safe processing constraints | Preserve by default |
| Source signal meter | Preserve on `/admin` |
| One captured stream | Preserve |
| One peer per listener | Preserve for the P2P phase |
| Offer/answer/ICE-only signaling | Preserve |
| One receiver audio element | Preserve |
| User gesture permits playback | Reuse the artwork gesture; no extra mobile panel |
| Listener count | Preserve as operational feedback |
| Device/peer cleanup | Preserve |

If a row changes, state the reason and obtain user approval when it changes interaction or operational behavior.

## Lean implementation boundary

The accepted P2P implementation is:

```text
admin-selected device
  -> one MediaStream
  -> one RTCPeerConnection per listener
  -> Socket.IO relays offer / answer / ICE only
  -> one remote MediaStream
  -> one mobile <audio>
```

Allowed supporting modules:

- input enumeration and source meter on admin;
- signaling authorization and target validation;
- ICE candidate queuing until remote description exists;
- development-only diagnostics;
- deterministic cleanup.

Not allowed without explicit user direction:

- additional mobile audio controls or status panels;
- speculative reconnect state machines;
- media mixing or processing in the relay;
- multiple overlapping transport abstractions;
- SFU code inside the P2P hook;
- presentation logic in signaling;
- claiming production scale from a small-room peer test.

## Evidence-first diagnosis order

When audio is not audible, do not reorder these checks.

### A. Compare with the known-good reference

- same admin laptop;
- same phone;
- same Wi-Fi;
- same browser;
- same selected audio input;
- same physical source and output volume.

If the reference works and NRF XR does not, treat code divergence as the primary cause.

### B. Prove capture

- confirm the selected input label;
- confirm the capture track is `live` and not muted;
- confirm the admin source meter visibly moves with the test sound.

Stop here if the meter is flat. Do not debug ICE or autoplay for a silent source.

### C. Prove signaling

Expected development trace:

```text
broadcaster-claimed
listener-requested
offer-relayed
mobile-offer-received
answer-relayed
admin-answer-applied
```

Do not log SDP bodies, ICE addresses, TURN credentials, or full device identifiers.

### D. Prove transport

- both peers reach `connected`;
- sender `outbound-rtp` audio packets/bytes increase;
- receiver `inbound-rtp` audio packets/bytes increase;
- packet loss and jitter remain bounded for the test.

Stats are diagnostics, not permanent product state.

### E. Prove playback

- `ontrack` fires;
- the received stream is assigned to the audio element;
- `play()` resolves after a real participant gesture;
- the audio element is not muted and volume is non-zero.

### F. Prove perception

- hear the test signal on the physical iPhone;
- use headphones during feedback-prone testing;
- compare with the original broadcaster immediately if results differ.

Only this final observation establishes audible success.

## Change discipline

For each WebRTC change:

1. Identify the failing evidence layer.
2. State the smallest hypothesis.
3. Change one behavior.
4. Run static checks.
5. Ask for the appropriate user-owned server start or restart using the exact repository wording when required.
6. Re-run the same physical test.
7. Record direct evidence and remaining uncertainty.
8. Remove temporary diagnostics that no longer justify their maintenance cost.

Do not stack speculative fixes. Do not declare success before the same admin-laptop/iPhone configuration produces audible output.

## Definition of done

The P2P broadcaster is done for a rehearsal only when all are true:

- the operator can identify and select the intended input;
- the source meter moves with that input;
- one phone receives audible sound;
- stop/start works without stale peers;
- a reloaded phone can rejoin;
- visual interaction continues when audio stops;
- terminal diagnostics identify any failure stage without exposing sensitive payloads;
- the same test is repeated with at least two phones;
- limitations remain documented as P2P, not 20–100-listener production audio.

