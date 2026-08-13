# WebRTC audio broadcaster

Agents must read [WebRTC agent guardrails and incident prevention](./webrtc-agent-guardrails.md) before changing this subsystem. That document records the failed initial port, the required parity ledger, and the evidence order for diagnosing inaudible audio.

## Current flow

The admin operator selects an input and explicitly starts microphone capture. The relay marks that admin-role socket as the broadcaster. A mobile's first artwork gesture requests the active broadcast and permits playback, after which Socket.IO carries offer, answer, and ICE messages. Audio itself travels over WebRTC.

```text
admin getUserMedia(audio)
  -> one RTCPeerConnection per listener
  -> WSS signaling (offer / answer / ICE)
  -> WebRTC audio track
  -> mobile <audio>
```

This separation is intentional: audio failure does not change concert session state, and the realtime relay never receives or mixes media bytes.

## Security and browser behavior

- `getUserMedia` requires HTTPS and a user gesture.
- The existing artwork touch surface resumes playback on the participant's first gesture because mobile browsers restrict autoplay; no separate audio UI is added.
- Only an admin-role socket can claim or stop broadcasting during local testing. Add production authentication before exposing the relay publicly.
- Signaling targets are checked against the active broadcaster and requested listener set.
- A public STUN server is a development fallback. Production should use infrastructure the project is authorized to use.
- TURN is required for dependable traversal across restrictive NAT and firewalls.

## Scaling limit

The current topology is one-to-many peer-to-peer. With `N` listeners, the admin laptop encodes/sends `N` peer connections. This is suitable for a small technical rehearsal, not a promise for 20–100 audience listeners.

Before audience audio expands, insert an SFU provider behind a `BroadcastTransport` boundary:

```text
admin publisher -> SFU -> N subscribers
             WSS session remains independent
```

Candidates include a self-hosted media server or a managed SFU. Select one only after the venue network, remote-performer requirement, latency budget, recording policy, and operational ownership are known. Do not bring an SFU dependency into every visual experiment.

## Relation to SonoBus and Loopback

SonoBus and Loopback remain external audio-routing tools. They are not npm dependencies. If Loopback exposes a virtual microphone, the operator selects that input in the admin audio-input selector; this webapp does not configure or mix the virtual device. SonoBus may continue to carry performer audio independently of this audience-facing WebRTC path.

## Required rehearsal checks

- built-in microphone and intended external/virtual input;
- headphones to avoid feedback during test;
- iOS and Android listener permission/autoplay behavior;
- two, five, ten, then target small-room listeners;
- broadcaster reload and listener reconnect;
- internet loss with LAN intact;
- TURN-only test for any cross-network scenario;
- audible latency and dropout observation, not merely ICE `connected` state.
- selected input identity and visibly moving source meter before any receiver diagnosis;
- physical audibility on the target phone—`play()` resolution is not sufficient evidence.
