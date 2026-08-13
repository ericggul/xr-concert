"use client";

import { useAudioListener } from "@/hooks/use-audio-listener";
import { useConcertSocket } from "@/hooks/use-concert-socket";
import { getExperiment } from "@/experiments/registry";
import styles from "./mobile-surface.module.css";

export function MobileSurface() {
  const { socket, connected, connectionError, session, broadcast } = useConcertSocket("mobile");
  const audioRef = useAudioListener(socket, broadcast.active);
  const live = connected && session?.status === "live";
  const Experiment = getExperiment(session?.activeExperiment).Mobile;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <span>
          <span className="status-dot" data-live={connected} />
          {connected ? session?.status || "connected" : connectionError || "connecting"}
        </span>
      </header>

      <Experiment disabled={!live} mode={session?.mode || "hybrid"} socket={socket} />

      <audio autoPlay playsInline ref={audioRef} />
    </main>
  );
}
