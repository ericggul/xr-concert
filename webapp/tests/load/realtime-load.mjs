import { io } from "socket.io-client";

const clients = Number.parseInt(process.env.CLIENTS || "20", 10);
const durationMs = Number.parseInt(process.env.DURATION_MS || "10000", 10);
const sampleHz = Number.parseInt(process.env.SAMPLE_HZ || "25", 10);
const origin = process.env.REALTIME_URL || "https://localhost:10001";

const sockets = [];
let sent = 0;

for (let index = 0; index < clients; index += 1) {
  const socket = io(origin, { transports: ["websocket"], rejectUnauthorized: false });
  sockets.push(socket);
  await new Promise((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("connect_error", reject);
  });
  socket.emit("concert:join", { role: "mobile" });
}

const startedAt = Date.now();
const timer = setInterval(() => {
  for (let index = 0; index < sockets.length; index += 1) {
    sockets[index].emit("concert:input", {
      version: 1,
      interactionId: `load-${index}`,
      seq: sent,
      phase: sent === 0 ? "start" : "move",
      x: (Math.sin(sent * 0.03 + index) + 1) / 2,
      y: (Math.cos(sent * 0.02 + index) + 1) / 2,
      pressure: 0.5,
    });
  }
  sent += 1;
}, 1000 / sampleHz);

setTimeout(() => {
  clearInterval(timer);
  sockets.forEach((socket) => socket.disconnect());
  const elapsed = Date.now() - startedAt;
  console.log(JSON.stringify({ clients, durationMs: elapsed, samplesPerClient: sent, totalSent: sent * clients }));
}, durationMs);
