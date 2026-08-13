"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { realtimeEvents } from "@/lib/realtime/events";
import { getIceServers } from "@/lib/realtime/origin";

export function useAudioBroadcaster(socket: Socket | null) {
  const streamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const candidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const [broadcasting, setBroadcasting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closeAll = useCallback(() => {
    for (const peer of peersRef.current.values()) peer.close();
    peersRef.current.clear();
    candidatesRef.current.clear();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setBroadcasting(false);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const activeSocket = socket;

    async function handleListenerRequest({ listenerId }: { listenerId: string }) {
      const stream = streamRef.current;
      if (!stream) return;
      const existing = peersRef.current.get(listenerId);
      existing?.close();
      candidatesRef.current.delete(listenerId);

      const peer = new RTCPeerConnection({ iceServers: getIceServers() });
      peersRef.current.set(listenerId, peer);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      peer.onicecandidate = (event) => {
        if (event.candidate) activeSocket.emit(realtimeEvents.ice, { targetId: listenerId, candidate: event.candidate });
      };
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      activeSocket.emit(realtimeEvents.offer, { targetId: listenerId, description: peer.localDescription });
    }

    async function handleAnswer({ fromId, description }: { fromId: string; description: RTCSessionDescriptionInit }) {
      const peer = peersRef.current.get(fromId);
      if (!peer) return;
      await peer.setRemoteDescription(description);
      for (const candidate of candidatesRef.current.get(fromId) || []) {
        await peer.addIceCandidate(candidate);
      }
      candidatesRef.current.delete(fromId);
    }

    async function handleIce({ fromId, candidate }: { fromId: string; candidate: RTCIceCandidateInit }) {
      const peer = peersRef.current.get(fromId);
      if (!peer || !candidate) return;
      if (peer.remoteDescription) await peer.addIceCandidate(candidate);
      else candidatesRef.current.set(fromId, [...(candidatesRef.current.get(fromId) || []), candidate]);
    }

    function handleListenerLeave({ listenerId }: { listenerId: string }) {
      peersRef.current.get(listenerId)?.close();
      peersRef.current.delete(listenerId);
      candidatesRef.current.delete(listenerId);
    }

    socket.on(realtimeEvents.listenerRequest, handleListenerRequest);
    socket.on(realtimeEvents.answer, handleAnswer);
    socket.on(realtimeEvents.ice, handleIce);
    socket.on(realtimeEvents.listenerLeave, handleListenerLeave);
    socket.on(realtimeEvents.broadcastStop, closeAll);
    return () => {
      socket.off(realtimeEvents.listenerRequest, handleListenerRequest);
      socket.off(realtimeEvents.answer, handleAnswer);
      socket.off(realtimeEvents.ice, handleIce);
      socket.off(realtimeEvents.listenerLeave, handleListenerLeave);
      socket.off(realtimeEvents.broadcastStop, closeAll);
    };
  }, [closeAll, socket]);

  const start = useCallback(async () => {
    if (!socket || streamRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false },
        video: false,
      });
      streamRef.current = stream;
      socket.emit(realtimeEvents.broadcastClaim);
      setError(null);
      setBroadcasting(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Microphone access failed");
    }
  }, [socket]);

  const stop = useCallback(() => {
    socket?.emit(realtimeEvents.broadcastStop);
    closeAll();
  }, [closeAll, socket]);

  useEffect(() => closeAll, [closeAll]);
  return { broadcasting, error, start, stop };
}
