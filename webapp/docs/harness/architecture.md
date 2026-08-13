# System architecture

## Process boundary

The Next.js app and realtime relay are separate HTTPS processes. This preserves Next.js defaults and lets the stateful relay move to its own host later without wrapping Next.js in a custom server.

```text
Next.js :10000                         realtime relay :10001
routes + client renderers             session authority + signaling
  /admin ────────────────────────────► admin command validation
  /mobile ── 25 Hz latest samples ──► experiment model ─┐
  /screen ◄── 30 Hz abstract frame ────────────────────┘
            WebRTC offer/answer/ICE ─► signaling only
```

## Authority

- Admin commands are accepted only after passcode authentication on that socket.
- The relay owns session status, epoch, experiment mode, role presence, validation, input expiry, and aggregate frames.
- Mobile owns immediate gesture feedback and permission prompts.
- Screen owns all presentation mapping and animation.
- The WebRTC broadcaster owns its microphone stream and one peer connection per listener.

## Input contract

The `wave-particle` input is version 1:

```ts
{
  version: 1;
  interactionId: string;
  seq: number;
  phase: "start" | "move" | "end";
  x: number;          // normalized 0–1
  y: number;          // normalized 0–1
  pressure: number;   // normalized 0–1
  clientTime: number;
}
```

The server rejects malformed, duplicate, and out-of-order samples. It keeps one latest active sample per socket and expires an abandoned sample after 750 ms. Client time is diagnostic only and never used as authority.

## Aggregate frame

At most 30 times per second, and only while the concert is live with a screen connected, the relay emits:

```ts
{
  version: 1;
  experimentId: "wave-particle";
  tick: number;
  serverTime: number;
  activeContributors: number;
  centroid: { x: number; y: number };
  energy: number;
  coherence: number;
  impulses: number;
}
```

This is the future external-renderer boundary. An Unreal or TouchDesigner adapter should translate this single aggregate frame to UDP, OSC, or another local protocol. It must not forward every phone to individual engine objects. The structure follows the bounded relay principle demonstrated by the referenced mobile-to-Unreal tutorial while remaining specific to the concert's parameter model.

## Scaling decisions

- 20–100 control clients: Socket.IO/WSS with 25 Hz ingress per active gesture, fixed 30 Hz screen egress, latest-sample-wins storage, 32 KB message ceiling, and no history queue.
- Multiple screens: all `screen` role sockets receive the same abstract frame and render independently.
- Multiple experiments: each gets a server module, isolated id/room/state, client role implementations, tests, and documentation.
- More than one relay instance: not supported by in-memory state. Add shared session state and a Socket.IO cluster adapter only when deployment actually requires horizontal scaling.
- 20–100 audio listeners: not supported by the current peer-to-peer broadcaster. Use an SFU; see `webrtc-broadcast.md`.

## Failure matrix

| Failure | Expected behavior | Operator response |
| --- | --- | --- |
| One phone disconnects | Its active sample disappears immediately or expires in 750 ms | None |
| Screen reloads | Input clients and session remain; new screen rejoins | Reload screen only |
| Admin reloads | Session remains; controls require re-authentication | Unlock again |
| WebRTC permission denied | Visual interaction remains live | Continue without broadcast or select another input |
| Realtime relay fails | Pages show offline; local mobile field still gives touch feedback | Restart relay; do not reload every device first |
| Wi-Fi loses internet but LAN remains | Local HTTPS/WSS continues; public STUN may be unavailable | Same-LAN WebRTC may work, but treat audio as non-guaranteed |
| Projection framework fails later | Web `/screen` remains fallback | Route projector to web screen |
