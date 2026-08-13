"use client";

import { useConcertSocket } from "@/hooks/use-concert-socket";
import { getExperiment } from "@/experiments/registry";
import styles from "./screen-surface.module.css";

export function ScreenSurface() {
  const { socket, connected, connectionError, session, presence } = useConcertSocket("screen");
  const Experiment = getExperiment(session?.activeExperiment).Screen;
  return (
    <main className={styles.page}>
      <Experiment mode={session?.mode || "hybrid"} socket={socket} status={session?.status || "idle"} />
      <div className={styles.status}>
        <span>{connected ? session?.status || "connected" : connectionError || "connecting"}</span>
        <span>{presence.mobile} audience</span>
      </div>
    </main>
  );
}
