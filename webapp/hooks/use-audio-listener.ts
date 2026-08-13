"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { realtimeEvents } from "@/lib/realtime/events";
import { getIceServers } from "@/lib/realtime/origin";

export function useAudioListener(socket: Socket | null) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const candidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    peerRef.current?.close();
    peerRef.current = null;
    candidatesRef.current = [];
    if (audioRef.current) audioRef.current.srcObject = null;
    setListening(false);
    socket?.emit(realtimeEvents.listenerLeave);
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    const activeSocket = socket;
    async function handleOffer({ fromId, description }: { fromId: string; description: RTCSessionDescriptionInit }) {
      peerRef.current?.close();
      const peer = new RTCPeerConnection({ iceServers: getIceServers() });
      peerRef.current = peer;
      peer.onicecandidate = (event) => {
        if (event.candidate) activeSocket.emit(realtimeEvents.ice, { targetId: fromId, candidate: event.candidate });
      };
      peer.ontrack = (event) => {
        if (!audioRef.current) return;
        audioRef.current.srcObject = event.streams[0];
        void audioRef.current.play().then(() => setListening(true)).catch((cause) => {
          setError(cause instanceof Error ? cause.message : "Tap listen again to start audio");
        });
      };
      await peer.setRemoteDescription(description);
      for (const candidate of candidatesRef.current) await peer.addIceCandidate(candidate);
      candidatesRef.current = [];
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      activeSocket.emit(realtimeEvents.answer, { targetId: fromId, description: peer.localDescription });
    }
    async function handleIce({ candidate }: { candidate: RTCIceCandidateInit }) {
      if (!candidate) return;
      if (peerRef.current?.remoteDescription) await peerRef.current.addIceCandidate(candidate);
      else candidatesRef.current.push(candidate);
    }
    socket.on(realtimeEvents.offer, handleOffer);
    socket.on(realtimeEvents.ice, handleIce);
    socket.on(realtimeEvents.broadcastStop, stop);
    return () => {
      socket.off(realtimeEvents.offer, handleOffer);
      socket.off(realtimeEvents.ice, handleIce);
      socket.off(realtimeEvents.broadcastStop, stop);
    };
  }, [socket, stop]);

  const request = useCallback(() => {
    setError(null);
    socket?.emit(realtimeEvents.listenerRequest);
  }, [socket]);

  useEffect(() => stop, [stop]);
  return { audioRef, error, listening, request, stop };
}
