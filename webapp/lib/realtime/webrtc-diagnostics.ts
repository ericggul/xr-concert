import type { Socket } from "socket.io-client";
import { realtimeEvents } from "@/lib/realtime/events";

export function reportWebRtc(socket: Socket, stage: string, details: Record<string, string> = {}) {
  if (process.env.NODE_ENV !== "production") {
    console.info("[webrtc]", JSON.stringify({ stage, ...details }));
  }
  socket.emit(realtimeEvents.broadcastDiagnostic, { stage, ...details });
}
