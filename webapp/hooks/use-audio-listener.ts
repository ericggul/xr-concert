"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import { realtimeEvents } from "@/lib/realtime/events";
import { getIceServers } from "@/lib/realtime/origin";
import { reportWebRtc } from "@/lib/realtime/webrtc-diagnostics";

export function useAudioListener(socket: Socket | null, broadcastActive: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const candidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const closePeer = useCallback(() => {
    peerRef.current?.close();
    peerRef.current = null;
    candidatesRef.current = [];
    if (audioRef.current) audioRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    if (!socket) return;
    const activeSocket = socket;

    async function handleOffer({ fromId, description }: { fromId: string; description: RTCSessionDescriptionInit }) {
      try {
        reportWebRtc(activeSocket, "mobile-offer-received");
        peerRef.current?.close();
        peerRef.current = null;
        const peer = new RTCPeerConnection({ iceServers: getIceServers() });
        peerRef.current = peer;
        peer.onicecandidate = (event) => {
          if (event.candidate) activeSocket.emit(realtimeEvents.ice, { targetId: fromId, candidate: event.candidate });
        };
        peer.onconnectionstatechange = () => {
          reportWebRtc(activeSocket, "mobile-peer-state", {
            connectionState: peer.connectionState,
            iceConnectionState: peer.iceConnectionState,
          });
        };
        peer.ontrack = (event) => {
          if (!audioRef.current) {
            reportWebRtc(activeSocket, "mobile-track-without-audio-element");
            return;
          }
          const stream = event.streams[0] ?? new MediaStream([event.track]);
          audioRef.current.srcObject = stream;
          reportWebRtc(activeSocket, "mobile-track-received", { trackState: event.track.readyState });
          void audioRef.current.play()
            .then(() => reportWebRtc(activeSocket, "mobile-audio-playing"))
            .catch((cause) => {
              reportWebRtc(activeSocket, "mobile-audio-blocked", { error: cause instanceof Error ? cause.message : "play rejected" });
              document.addEventListener("pointerdown", () => {
                void audioRef.current?.play()
                  .then(() => reportWebRtc(activeSocket, "mobile-audio-playing-after-touch"))
                  .catch((retryCause) => reportWebRtc(activeSocket, "mobile-audio-retry-failed", { error: retryCause instanceof Error ? retryCause.message : "play rejected" }));
              }, { once: true });
            });
        };
        await peer.setRemoteDescription(description);
        for (const candidate of candidatesRef.current) await peer.addIceCandidate(candidate);
        candidatesRef.current = [];
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        activeSocket.emit(realtimeEvents.answer, { targetId: fromId, description: peer.localDescription });
        reportWebRtc(activeSocket, "mobile-answer-sent");
      } catch (cause) {
        reportWebRtc(activeSocket, "mobile-offer-failed", { error: cause instanceof Error ? cause.message : "offer handling failed" });
      }
    }

    async function handleIce({ candidate }: { candidate: RTCIceCandidateInit }) {
      if (!candidate) return;
      if (peerRef.current?.remoteDescription) await peerRef.current.addIceCandidate(candidate);
      else candidatesRef.current.push(candidate);
    }

    activeSocket.on(realtimeEvents.offer, handleOffer);
    activeSocket.on(realtimeEvents.ice, handleIce);
    activeSocket.on(realtimeEvents.broadcastStop, closePeer);
    return () => {
      activeSocket.off(realtimeEvents.offer, handleOffer);
      activeSocket.off(realtimeEvents.ice, handleIce);
      activeSocket.off(realtimeEvents.broadcastStop, closePeer);
      closePeer();
    };
  }, [closePeer, socket]);

  useEffect(() => {
    if (!socket || !broadcastActive) return;
    let requested = false;
    const beginListening = () => {
      if (!requested) {
        requested = true;
        socket.emit(realtimeEvents.listenerRequest);
        reportWebRtc(socket, "mobile-listener-request-sent");
      }
      if (audioRef.current?.srcObject) void audioRef.current.play().catch(() => undefined);
    };
    window.addEventListener("pointerdown", beginListening, { capture: true });
    return () => {
      window.removeEventListener("pointerdown", beginListening, { capture: true });
      if (requested) socket.emit(realtimeEvents.listenerLeave);
      closePeer();
    };
  }, [broadcastActive, closePeer, socket]);

  return audioRef;
}
