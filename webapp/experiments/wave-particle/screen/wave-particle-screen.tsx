"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import { type ConcertMode, type ConcertStatus, realtimeEvents, type WaveParticleFrame } from "@/lib/realtime/events";
import styles from "./wave-particle-screen.module.css";

const MAX_PIXEL_RATIO = 1.5;
const MAX_PARTICLES = 700;
const WAVE_LIFETIME_MS = 2600;

type Particle = { x: number; y: number; vx: number; vy: number; life: number; size: number };
type Wave = { x: number; y: number; bornAt: number; energy: number };

export function WaveParticleScreen({ mode, socket, status }: { mode: ConcertMode; socket: Socket | null; status: ConcertStatus }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<WaveParticleFrame | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const wavesRef = useRef<Wave[]>([]);
  const animationRef = useRef<number | null>(null);
  const lastWaveAtRef = useRef(0);
  const sizeRef = useRef({ width: 1, height: 1, ratio: 1 });

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    sizeRef.current = { width: rect.width, height: rect.height, ratio };
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleFrame = (frame: WaveParticleFrame) => {
      frameRef.current = frame;
    };
    socket.on(realtimeEvents.frame, handleFrame);
    return () => { socket.off(realtimeEvents.frame, handleFrame); };
  }, [socket]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !context) return;
    const drawingContext = context;
    resize();
    window.addEventListener("resize", resize);

    function render(now: number) {
      const { width, height, ratio } = sizeRef.current;
      const frame = frameRef.current;
      drawingContext.setTransform(ratio, 0, 0, ratio, 0, 0);
      drawingContext.fillStyle = "#101719";
      drawingContext.fillRect(0, 0, width, height);

      if (frame && status === "live") {
        const centerX = frame.centroid.x * width;
        const centerY = frame.centroid.y * height;

        if ((mode === "particle" || mode === "hybrid") && frame.activeContributors > 0) {
          const spawnCount = Math.min(10, Math.ceil(frame.energy * 5 + frame.impulses * 2));
          for (let index = 0; index < spawnCount; index += 1) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.15 + Math.random() * (0.8 + frame.energy * 1.7);
            particlesRef.current.push({
              x: centerX,
              y: centerY,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 1,
              size: 1.2 + Math.random() * 2.4,
            });
          }
          if (particlesRef.current.length > MAX_PARTICLES) {
            particlesRef.current.splice(0, particlesRef.current.length - MAX_PARTICLES);
          }
        }

        if ((mode === "wave" || mode === "hybrid") && frame.activeContributors > 0 && (frame.impulses > 0 || now - lastWaveAtRef.current > 320)) {
          wavesRef.current.push({ x: centerX, y: centerY, bornAt: now, energy: frame.energy });
          lastWaveAtRef.current = now;
        }
      }

      if (mode === "wave" || mode === "hybrid") {
        wavesRef.current = wavesRef.current.filter((wave) => now - wave.bornAt < WAVE_LIFETIME_MS);
        for (const wave of wavesRef.current) {
          const progress = (now - wave.bornAt) / WAVE_LIFETIME_MS;
          const radius = progress * Math.max(width, height) * (0.35 + wave.energy * 0.35);
          drawingContext.beginPath();
          drawingContext.arc(wave.x, wave.y, radius, 0, Math.PI * 2);
          drawingContext.strokeStyle = `rgba(111, 153, 159, ${Math.max(0, (1 - progress) * 0.72)})`;
          drawingContext.lineWidth = Math.max(1, (1 - progress) * 4);
          drawingContext.stroke();
        }
      } else {
        wavesRef.current = [];
      }

      if (mode === "particle" || mode === "hybrid") {
        particlesRef.current = particlesRef.current.filter((particle) => particle.life > 0.01);
        for (const particle of particlesRef.current) {
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vx *= 0.995;
          particle.vy *= 0.995;
          particle.life *= 0.986;
          drawingContext.beginPath();
          drawingContext.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          drawingContext.fillStyle = `rgba(203, 115, 76, ${particle.life})`;
          drawingContext.fill();
        }
      } else {
        particlesRef.current = [];
      }

      animationRef.current = window.requestAnimationFrame(render);
    }

    animationRef.current = window.requestAnimationFrame(render);
    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current !== null) window.cancelAnimationFrame(animationRef.current);
    };
  }, [mode, resize, status]);

  return (
    <div className={styles.field}>
      <canvas aria-label="Collective wave and particle projection" ref={canvasRef} />
      {status !== "live" ? <p>{status === "paused" ? "Held" : "Waiting for hands"}</p> : null}
    </div>
  );
}
