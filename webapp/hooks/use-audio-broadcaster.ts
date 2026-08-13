"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { realtimeEvents } from "@/lib/realtime/events";
import { getIceServers } from "@/lib/realtime/origin";
import { reportWebRtc } from "@/lib/realtime/webrtc-diagnostics";

export function useAudioBroadcaster(socket: Socket | null) {
  const streamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const candidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const meterContextRef = useRef<AudioContext | null>(null);
  const meterFrameRef = useRef<number | null>(null);
  const [broadcasting, setBroadcasting] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const stopMeter = useCallback(() => {
    if (meterFrameRef.current !== null) cancelAnimationFrame(meterFrameRef.current);
    meterFrameRef.current = null;
    void meterContextRef.current?.close();
    meterContextRef.current = null;
    setLevel(0);
  }, []);

  const closeAll = useCallback(() => {
    for (const peer of peersRef.current.values()) peer.close();
    peersRef.current.clear();
    candidatesRef.current.clear();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    stopMeter();
    setBroadcasting(false);
  }, [stopMeter]);

  useEffect(() => {
    let active = true;
    async function loadDevices() {
      try {
        const next = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === "audioinput");
        if (!active) return;
        setDevices(next);
        setDeviceId((current) => current || next[0]?.deviceId || "");
      } catch {
        // Start will surface an actionable capture error if enumeration is unavailable.
      }
    }
    void loadDevices();
    navigator.mediaDevices.addEventListener("devicechange", loadDevices);
    return () => {
      active = false;
      navigator.mediaDevices.removeEventListener("devicechange", loadDevices);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
    const activeSocket = socket;

    async function handleListenerRequest({ listenerId }: { listenerId: string }) {
      const stream = streamRef.current;
      if (!stream) {
        reportWebRtc(activeSocket, "admin-listener-without-stream");
        return;
      }
      reportWebRtc(activeSocket, "admin-listener-received");
      const existing = peersRef.current.get(listenerId);
      existing?.close();
      candidatesRef.current.delete(listenerId);

      const peer = new RTCPeerConnection({ iceServers: getIceServers() });
      peersRef.current.set(listenerId, peer);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      peer.onicecandidate = (event) => {
        if (event.candidate) activeSocket.emit(realtimeEvents.ice, { targetId: listenerId, candidate: event.candidate });
      };
      peer.onconnectionstatechange = () => {
        reportWebRtc(activeSocket, "admin-peer-state", {
          connectionState: peer.connectionState,
          iceConnectionState: peer.iceConnectionState,
        });
      };
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      activeSocket.emit(realtimeEvents.offer, { targetId: listenerId, description: peer.localDescription });
      reportWebRtc(activeSocket, "admin-offer-sent");
    }

    async function handleAnswer({ fromId, description }: { fromId: string; description: RTCSessionDescriptionInit }) {
      const peer = peersRef.current.get(fromId);
      if (!peer) return;
      await peer.setRemoteDescription(description);
      for (const candidate of candidatesRef.current.get(fromId) || []) {
        await peer.addIceCandidate(candidate);
      }
      candidatesRef.current.delete(fromId);
      reportWebRtc(activeSocket, "admin-answer-applied");
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
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 2,
        },
        video: false,
      });
      const track = stream.getAudioTracks()[0];
      const audioContext = new AudioContext();
      meterContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const samples = new Uint8Array(analyser.frequencyBinCount);
      const updateMeter = () => {
        analyser.getByteTimeDomainData(samples);
        let peak = 0;
        for (const sample of samples) peak = Math.max(peak, Math.abs(sample - 128) / 128);
        setLevel(Math.min(1, peak * 1.4));
        meterFrameRef.current = requestAnimationFrame(updateMeter);
      };
      updateMeter();
      streamRef.current = stream;
      socket.emit(realtimeEvents.broadcastClaim);
      reportWebRtc(socket, "admin-capture-ready", {
        trackState: track?.readyState || "missing",
        deviceLabel: track?.label || "unknown",
      });
      setError(null);
      setBroadcasting(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Microphone access failed");
    }
  }, [deviceId, socket]);

  const stop = useCallback(() => {
    socket?.emit(realtimeEvents.broadcastStop);
    closeAll();
  }, [closeAll, socket]);

  useEffect(() => closeAll, [closeAll]);
  return { broadcasting, deviceId, devices, error, level, setDeviceId, start, stop };
}
