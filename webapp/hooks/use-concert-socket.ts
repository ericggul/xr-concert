"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import {
  type BroadcastState,
  type ConcertRole,
  type PresenceState,
  realtimeEvents,
  type SessionState,
} from "@/lib/realtime/events";
import { getRealtimeOrigin } from "@/lib/realtime/origin";

const emptyPresence: PresenceState = {
  admin: 0,
  mobile: 0,
  screen: 0,
  external: 0,
  total: 0,
  serverTime: 0,
};

export function useConcertSocket(role: ConcertRole) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);
  const [presence, setPresence] = useState<PresenceState>(emptyPresence);
  const [broadcast, setBroadcast] = useState<BroadcastState>({ active: false, listenerCount: 0 });

  useEffect(() => {
    const nextSocket = io(getRealtimeOrigin(), {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      upgrade: true,
      reconnection: true,
      reconnectionDelay: 300,
      reconnectionDelayMax: 1600,
      timeout: 6000,
    });
    nextSocket.on("connect", () => {
      setSocket(nextSocket);
      setConnected(true);
      setConnectionError(null);
      nextSocket.emit(realtimeEvents.join, { role });
    });
    nextSocket.on("disconnect", () => setConnected(false));
    nextSocket.on("connect_error", (error) => setConnectionError(error.message));
    nextSocket.on(realtimeEvents.hello, (hello) => {
      setSession(hello.session);
      setPresence(hello.presence);
      setBroadcast(hello.broadcast);
    });
    nextSocket.on(realtimeEvents.session, setSession);
    nextSocket.on(realtimeEvents.presence, setPresence);
    nextSocket.on(realtimeEvents.broadcastState, setBroadcast);

    return () => {
      nextSocket.disconnect();
    };
  }, [role]);

  return { socket, connected, connectionError, session, presence, broadcast };
}
