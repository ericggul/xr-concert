# Audio Broadcaster

Broadcast any local audio input (microphone, line-in, loopback device) to any number of browser listeners on your network, using WebRTC for the audio and a small Node.js server for signaling. Multiple broadcasters can run at once, and each listener can tune into any number of them simultaneously.

## How it works

- `server.js` — Express serves the two web pages; a WebSocket server tracks the active broadcasters and relays WebRTC signaling (offers/answers/ICE) between each broadcaster–listener pair.
- `public/broadcast.html` — open this **on the machine with the audio source**. Name the broadcast, pick an audio input, and it captures it with `getUserMedia`, opening one WebRTC peer connection per subscribed listener. Several broadcasts can run from the same machine in separate tabs.
- `public/index.html` — the listener page. Enter the server's IP and connect: every live broadcast appears in a list, updated in real time, each with its own **Listen** button and volume slider. Listening to several at once mixes them locally.

Audio flows directly over WebRTC (Opus); the server only handles signaling.

## Run

```sh
npm install
npm start
```

The server prints the URLs on startup:

1. Open `http://localhost:3000/broadcast.html`, name the broadcast, pick an audio input, click **Start broadcasting**. Repeat in more tabs (or on other machines running against the same server) for more broadcasts. (Broadcast pages must be opened via `localhost`, not the LAN IP — `getUserMedia` requires a secure context, and localhost qualifies.)
2. On any device on the network, open `http://<server-ip>:3000/`, confirm the IP (pre-filled), click **Connect**, then **Listen** on any broadcasts you want to hear — as many at once as you like.

Broadcasts appear and disappear from listeners' lists in real time as they start and stop.

## Notes

- **Broadcasting system audio** (not a mic): install a loopback device such as [BlackHole](https://existential.audio/blackhole/) (macOS) or VB-Cable (Windows), route your audio to it, and select it in the device dropdown.
- Port defaults to `3000`; override with `PORT=8080 npm start`. Listeners entering a bare IP get `:3000` assumed.
- Audio processing (echo cancellation, AGC, noise suppression) is disabled for clean music/line-in transmission.
- Designed for LAN use. Across the internet you would need a TURN server and HTTPS.
