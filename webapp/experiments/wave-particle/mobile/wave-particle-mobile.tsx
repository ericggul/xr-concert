"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { Socket } from "socket.io-client";
import { type ConcertMode, realtimeEvents } from "@/lib/realtime/events";
import styles from "./wave-particle-mobile.module.css";

const EMIT_INTERVAL_MS = 40;

type Sample = { x: number; y: number; pressure: number };
type ActiveInteraction = { id: string; pointerId: number; seq: number };

export function WaveParticleMobile({ disabled, mode, socket }: { disabled: boolean; mode: ConcertMode; socket: Socket | null }) {
  const activeRef = useRef<ActiveInteraction | null>(null);
  const pendingRef = useRef<Sample | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 });
  const [touching, setTouching] = useState(false);

  const send = useCallback((phase: "start" | "move" | "end", sample: Sample) => {
    const active = activeRef.current;
    if (!active || !socket) return;
    socket.emit(realtimeEvents.input, {
      version: 1,
      interactionId: active.id,
      seq: active.seq++,
      phase,
      ...sample,
      clientTime: Date.now(),
    });
  }, [socket]);

  const flush = useCallback(() => {
    timerRef.current = null;
    const sample = pendingRef.current;
    pendingRef.current = null;
    if (sample) send("move", sample);
  }, [send]);

  const readSample = useCallback((event: ReactPointerEvent<HTMLDivElement>): Sample => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1),
      y: Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1),
      pressure: event.pressure > 0 ? event.pressure : 0.5,
    };
  }, []);

  function updateLocal(sample: Sample) {
    setPosition({ x: sample.x, y: sample.y });
  }

  function endInteraction(event: ReactPointerEvent<HTMLDivElement>) {
    const active = activeRef.current;
    if (!active || active.pointerId !== event.pointerId) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    const sample = pendingRef.current || readSample(event);
    pendingRef.current = null;
    send("move", sample);
    send("end", sample);
    activeRef.current = null;
    setTouching(false);
  }

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return (
    <div
      aria-disabled={disabled}
      aria-label="Concert interaction field"
      className={styles.field}
      data-disabled={disabled}
      data-mode={mode}
      onPointerDown={(event) => {
        if (disabled || activeRef.current) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        const sample = readSample(event);
        activeRef.current = { id: crypto.randomUUID(), pointerId: event.pointerId, seq: 0 };
        updateLocal(sample);
        setTouching(true);
        send("start", sample);
      }}
      onPointerMove={(event) => {
        if (activeRef.current?.pointerId !== event.pointerId) return;
        const sample = readSample(event);
        updateLocal(sample);
        pendingRef.current = sample;
        if (!timerRef.current) timerRef.current = setTimeout(flush, EMIT_INTERVAL_MS);
      }}
      onPointerUp={endInteraction}
      onPointerCancel={endInteraction}
      onLostPointerCapture={endInteraction}
      role="application"
      style={{ "--touch-x": `${position.x * 100}%`, "--touch-y": `${position.y * 100}%` } as React.CSSProperties}
    >
      <div className={styles.mark} data-touching={touching} />
      <p>{disabled ? "Waiting for the concert to begin" : touching ? "Keep moving" : "Touch and move"}</p>
    </div>
  );
}
