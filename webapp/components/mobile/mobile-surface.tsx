"use client";

import { useAudioListener } from "@/hooks/use-audio-listener";
import { useConcertSocket } from "@/hooks/use-concert-socket";
import { getExperiment } from "@/experiments/registry";
import styles from "./mobile-surface.module.css";

export function MobileSurface() {
  const { socket, connected, connectionError, session, broadcast } = useConcertSocket("mobile");
  const { audioRef, error: audioError, listening, request, stop } = useAudioListener(socket);
  const live = connected && session?.status === "live";
  const Experiment = getExperiment(session?.activeExperiment).Mobile;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <span>
          <span className="status-dot" data-live={connected} />
          {connected ? session?.status || "connected" : connectionError || "connecting"}
        </span>
        {broadcast.active ? (
          <button className={styles.listen} onClick={listening ? stop : request}>
            {listening ? "Stop listening" : "Listen to broadcast"}
          </button>
        ) : null}
      </header>

      <Experiment disabled={!live} mode={session?.mode || "hybrid"} socket={socket} />

      <audio autoPlay controls={listening} ref={audioRef} className={styles.audio} />
      {audioError ? <p className={styles.error}>{audioError}</p> : null}
    </main>
  );
}
