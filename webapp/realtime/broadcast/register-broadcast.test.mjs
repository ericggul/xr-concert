import assert from "node:assert/strict";
import test from "node:test";
import { registerBroadcastSignaling } from "./register-broadcast.mjs";
import { events } from "../core/events.mjs";

function createIo() {
  const emitted = [];
  const targeted = [];
  return {
    emitted,
    targeted,
    emit(event, payload) {
      emitted.push({ event, payload });
    },
    to(targetId) {
      return {
        emit(event, payload) {
          targeted.push({ targetId, event, payload });
        },
      };
    },
  };
}

function createSocket(id, data = {}) {
  const handlers = new Map();
  return {
    id,
    data,
    on(event, handler) {
      const existing = handlers.get(event) ?? [];
      handlers.set(event, [...existing, handler]);
    },
    trigger(event, payload) {
      for (const handler of handlers.get(event) ?? []) handler(payload);
    },
  };
}

test("only an authenticated admin can claim the broadcaster role", () => {
  const io = createIo();
  const state = { broadcasterId: null, listeners: new Set() };
  const socket = createSocket("candidate", { adminAuthenticated: true, concertRole: "mobile" });
  registerBroadcastSignaling({ io, socket, state });

  socket.trigger(events.broadcastClaim);
  assert.equal(state.broadcasterId, null);

  socket.data.concertRole = "admin";
  socket.trigger(events.broadcastClaim);
  assert.equal(state.broadcasterId, socket.id);
  assert.deepEqual(io.emitted.at(-1), {
    event: events.broadcastState,
    payload: { active: true, listenerCount: 0 },
  });
});

test("signaling is restricted to the active broadcaster and opted-in listener", () => {
  const io = createIo();
  const state = { broadcasterId: null, listeners: new Set() };
  const admin = createSocket("admin", { adminAuthenticated: true, concertRole: "admin" });
  const listener = createSocket("listener", { concertRole: "mobile" });
  const stranger = createSocket("stranger", { concertRole: "mobile" });
  registerBroadcastSignaling({ io, socket: admin, state });
  registerBroadcastSignaling({ io, socket: listener, state });
  registerBroadcastSignaling({ io, socket: stranger, state });

  admin.trigger(events.broadcastClaim);
  listener.trigger(events.listenerRequest);
  stranger.trigger(events.answer, { targetId: admin.id, description: { type: "answer", sdp: "blocked" } });
  admin.trigger(events.offer, { targetId: listener.id, description: { type: "offer", sdp: "allowed" } });
  listener.trigger(events.answer, { targetId: admin.id, description: { type: "answer", sdp: "allowed" } });

  assert.deepEqual([...state.listeners], [listener.id]);
  assert.deepEqual(
    io.targeted.map(({ targetId, event }) => ({ targetId, event })),
    [
      { targetId: admin.id, event: events.listenerRequest },
      { targetId: listener.id, event: events.offer },
      { targetId: admin.id, event: events.answer },
    ],
  );
});

test("disconnecting the broadcaster clears every listener", () => {
  const io = createIo();
  const state = { broadcasterId: "admin", listeners: new Set(["one", "two"]) };
  const admin = createSocket("admin", { adminAuthenticated: true, concertRole: "admin" });
  registerBroadcastSignaling({ io, socket: admin, state });

  admin.trigger("disconnect");

  assert.equal(state.broadcasterId, null);
  assert.equal(state.listeners.size, 0);
  assert.ok(io.emitted.some(({ event }) => event === events.broadcastStop));
});
