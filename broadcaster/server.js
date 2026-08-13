const http = require('http');
const os = require('os');
const path = require('path');
const express = require('express');
const { WebSocketServer, WebSocket } = require('ws');

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const broadcasters = new Map(); // id -> { ws, name }
const listeners = new Map(); // id -> ws
let nextId = 1;

function send(ws, msg) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function broadcastToListeners(msg) {
  for (const ws of listeners.values()) send(ws, msg);
}

function broadcastList() {
  return [...broadcasters.entries()].map(([id, b]) => ({ id, name: b.name }));
}

wss.on('connection', (ws) => {
  ws.role = null;
  ws.id = null;

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    switch (msg.type) {
      case 'register-broadcaster': {
        ws.role = 'broadcaster';
        ws.id = nextId++;
        const name = String(msg.name || '').trim() || `Broadcast ${ws.id}`;
        broadcasters.set(ws.id, { ws, name });
        send(ws, { type: 'registered', id: ws.id, name });
        broadcastToListeners({ type: 'broadcast-added', id: ws.id, name });
        break;
      }

      case 'register-listener': {
        ws.role = 'listener';
        ws.id = nextId++;
        listeners.set(ws.id, ws);
        send(ws, { type: 'broadcast-list', broadcasts: broadcastList() });
        break;
      }

      // Listener asks to (un)join a specific broadcast.
      case 'subscribe': {
        if (ws.role !== 'listener') return;
        const b = broadcasters.get(msg.broadcasterId);
        if (b) send(b.ws, { type: 'listener-joined', id: ws.id });
        else send(ws, { type: 'broadcast-removed', id: msg.broadcasterId });
        break;
      }
      case 'unsubscribe': {
        if (ws.role !== 'listener') return;
        const b = broadcasters.get(msg.broadcasterId);
        if (b) send(b.ws, { type: 'listener-left', id: ws.id });
        break;
      }

      // Broadcaster -> specific listener (msg.id = listener id).
      case 'offer':
      case 'candidate-to-listener': {
        if (ws.role !== 'broadcaster') return;
        const listener = listeners.get(msg.id);
        send(listener, {
          type: msg.type === 'offer' ? 'offer' : 'candidate',
          from: ws.id,
          sdp: msg.sdp,
          candidate: msg.candidate,
        });
        break;
      }

      // Listener -> specific broadcaster (msg.broadcasterId = target).
      case 'answer':
      case 'candidate-to-broadcaster': {
        if (ws.role !== 'listener') return;
        const b = broadcasters.get(msg.broadcasterId);
        if (!b) return;
        send(b.ws, {
          type: msg.type === 'answer' ? 'answer' : 'candidate',
          id: ws.id,
          sdp: msg.sdp,
          candidate: msg.candidate,
        });
        break;
      }
    }
  });

  ws.on('close', () => {
    if (ws.role === 'broadcaster') {
      broadcasters.delete(ws.id);
      broadcastToListeners({ type: 'broadcast-removed', id: ws.id });
    } else if (ws.role === 'listener') {
      listeners.delete(ws.id);
      for (const b of broadcasters.values()) {
        send(b.ws, { type: 'listener-left', id: ws.id });
      }
    }
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use — is another instance running?`);
    console.error(`Find it with: lsof -nP -iTCP:${PORT} -sTCP:LISTEN`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => {
  const addrs = Object.values(os.networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => i.address);

  console.log('Audio broadcaster running.');
  console.log(`  Broadcaster page: http://localhost:${PORT}/broadcast.html`);
  for (const a of addrs) {
    console.log(`  Listener page (share this): http://${a}:${PORT}/`);
  }
});
