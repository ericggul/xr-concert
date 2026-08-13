# WebRTC audio broadcaster

## Current flow

The admin operator explicitly starts microphone capture. The relay marks that authenticated socket as the broadcaster. A mobile listener explicitly requests audio, after which Socket.IO carries offer, answer, and ICE messages. Audio itself travels over WebRTC.

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
- A listener must tap before audio playback can be relied on because mobile browsers restrict autoplay.
- Only an authenticated admin socket can claim or stop broadcasting.
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

SonoBus and Loopback remain external audio-routing tools. They are not npm dependencies. If Loopback feeds a browser-selectable virtual microphone, the admin may choose it in the browser/OS input settings; this webapp does not configure the device. SonoBus may continue to carry performer audio independently of this audience-facing WebRTC path.

## Required rehearsal checks

- built-in microphone and intended external/virtual input;
- headphones to avoid feedback during test;
- iOS and Android listener permission/autoplay behavior;
- two, five, ten, then target small-room listeners;
- broadcaster reload and listener reconnect;
- internet loss with LAN intact;
- TURN-only test for any cross-network scenario;
- audible latency and dropout observation, not merely ICE `connected` state.
