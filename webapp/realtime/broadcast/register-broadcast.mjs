import { events } from "../core/events.mjs";

export function registerBroadcastSignaling({ io, socket, state }) {
  function diagnostic(stage, details = {}) {
    if (process.env.NODE_ENV === "production") return;
    console.info("[webrtc]", JSON.stringify({ role: socket.data.concertRole, socketId: socket.id, stage, ...details }));
  }

  function emitState() {
    io.emit(events.broadcastState, {
      active: Boolean(state.broadcasterId),
      listenerCount: state.listeners.size,
    });
  }

  socket.on(events.broadcastClaim, () => {
    if (socket.data.concertRole !== "admin") return;
    if (state.broadcasterId && state.broadcasterId !== socket.id) return;
    state.broadcasterId = socket.id;
    diagnostic("broadcaster-claimed");
    emitState();
  });

  socket.on(events.listenerRequest, () => {
    if (socket.data.concertRole !== "mobile" || !state.broadcasterId) return;
    state.listeners.add(socket.id);
    diagnostic("listener-requested", { broadcasterId: state.broadcasterId });
    io.to(state.broadcasterId).emit(events.listenerRequest, { listenerId: socket.id });
    emitState();
  });

  socket.on(events.listenerLeave, () => {
    if (!state.listeners.delete(socket.id)) return;
    if (state.broadcasterId) {
      io.to(state.broadcasterId).emit(events.listenerLeave, { listenerId: socket.id });
    }
    emitState();
  });

  socket.on(events.offer, ({ targetId, description } = {}) => {
    if (socket.id !== state.broadcasterId || !state.listeners.has(targetId)) return;
    diagnostic("offer-relayed", { targetId, sdpType: description?.type });
    io.to(targetId).emit(events.offer, { fromId: socket.id, description });
  });

  socket.on(events.answer, ({ targetId, description } = {}) => {
    if (!state.listeners.has(socket.id) || targetId !== state.broadcasterId) return;
    diagnostic("answer-relayed", { targetId, sdpType: description?.type });
    io.to(targetId).emit(events.answer, { fromId: socket.id, description });
  });

  socket.on(events.ice, ({ targetId, candidate } = {}) => {
    const broadcasterToListener = socket.id === state.broadcasterId && state.listeners.has(targetId);
    const listenerToBroadcaster = state.listeners.has(socket.id) && targetId === state.broadcasterId;
    if (!broadcasterToListener && !listenerToBroadcaster) return;
    io.to(targetId).emit(events.ice, { fromId: socket.id, candidate });
  });

  socket.on(events.broadcastDiagnostic, ({ stage, connectionState, iceConnectionState, trackState, error } = {}) => {
    if (typeof stage !== "string" || stage.length > 64) return;
    diagnostic(stage, {
      connectionState: typeof connectionState === "string" ? connectionState : undefined,
      iceConnectionState: typeof iceConnectionState === "string" ? iceConnectionState : undefined,
      trackState: typeof trackState === "string" ? trackState : undefined,
      error: typeof error === "string" ? error.slice(0, 160) : undefined,
    });
  });

  socket.on(events.broadcastStop, () => {
    if (socket.id !== state.broadcasterId) return;
    state.broadcasterId = null;
    state.listeners.clear();
    io.emit(events.broadcastStop);
    emitState();
  });

  socket.on("disconnect", () => {
    if (socket.id === state.broadcasterId) {
      state.broadcasterId = null;
      state.listeners.clear();
      io.emit(events.broadcastStop);
    } else {
      state.listeners.delete(socket.id);
    }
    emitState();
  });
}
