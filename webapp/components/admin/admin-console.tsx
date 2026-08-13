"use client";

import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useAudioBroadcaster } from "@/hooks/use-audio-broadcaster";
import { useConcertSocket } from "@/hooks/use-concert-socket";
import { type ConcertMode, realtimeEvents } from "@/lib/realtime/events";
import { getAppOrigin } from "@/lib/realtime/origin";
import styles from "./admin-console.module.css";

const modes: Array<{ id: ConcertMode; label: string }> = [
  { id: "particle", label: "Particle" },
  { id: "wave", label: "Wave" },
  { id: "hybrid", label: "Both" },
];

export function AdminConsole() {
  const { socket, connected, connectionError, session, presence, broadcast } = useConcertSocket("admin");
  const audio = useAudioBroadcaster(socket);
  const [passcode, setPasscode] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const mobileUrl = `${getAppOrigin()}/mobile`;

  useEffect(() => {
    if (!socket) return;
    const lock = () => setAuthenticated(false);
    socket.on("disconnect", lock);
    return () => { socket.off("disconnect", lock); };
  }, [socket]);

  const stateLabel = useMemo(() => {
    if (!connected) return connectionError || "Realtime server offline";
    if (!session) return "Reading session";
    return session.status === "live" ? "Audience input is live" : session.status === "paused" ? "Audience input is paused" : "Session is ready";
  }, [connected, connectionError, session]);

  function authenticate() {
    socket?.emit(realtimeEvents.adminAuth, { passcode }, ({ ok, reason }: { ok: boolean; reason?: string }) => {
      setAuthenticated(ok);
      setAuthMessage(ok ? null : reason || "Authentication failed");
      if (ok) setPasscode("");
    });
  }

  function command(type: string, fields: Record<string, unknown> = {}) {
    socket?.emit(realtimeEvents.adminCommand, { type, ...fields });
  }

  return (
    <main className={`route-shell ${styles.page}`}>
      <header className={styles.header}>
        <div>
          <p className="utility">NRF XR Concert 2027</p>
          <h1 className="route-title">Concert control</h1>
        </div>
        <p className={styles.connection}>
          <span className="status-dot" data-live={connected} />
          {stateLabel}
        </p>
      </header>

      <section className={styles.primary} aria-label="Session controls">
        <div className={styles.stateBlock}>
          <span>Current state</span>
          <strong>{session?.status || "offline"}</strong>
        </div>
        <div className={styles.actions}>
          <button className="button button--filled" disabled={!authenticated || session?.status === "live"} onClick={() => command("start")}>Start input</button>
          <button className="button" disabled={!authenticated || session?.status !== "live"} onClick={() => command("pause")}>Pause</button>
          <button className="button button--danger" disabled={!authenticated} onClick={() => command("reset")}>Reset session</button>
        </div>
      </section>

      <div className={styles.columns}>
        <section className={styles.section} aria-labelledby="mode-title">
          <h2 id="mode-title">Visual reading</h2>
          <div className={styles.modeList}>
            {modes.map((mode) => (
              <button
                className={styles.mode}
                data-selected={session?.mode === mode.id}
                disabled={!authenticated}
                key={mode.id}
                onClick={() => command("set-mode", { mode: mode.id })}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="devices-title">
          <h2 id="devices-title">In the room</h2>
          <dl className={styles.counts}>
            <div><dt>Audience</dt><dd>{presence.mobile}</dd></div>
            <div><dt>Screens</dt><dd>{presence.screen}</dd></div>
            <div><dt>Control</dt><dd>{presence.admin}</dd></div>
          </dl>
        </section>

        <section className={styles.section} aria-labelledby="audio-title">
          <h2 id="audio-title">Audio broadcast</h2>
          <p>{audio.broadcasting ? `Sending to ${broadcast.listenerCount} listener${broadcast.listenerCount === 1 ? "" : "s"}.` : "Microphone is not broadcasting."}</p>
          <button className="button" disabled={!authenticated} onClick={audio.broadcasting ? audio.stop : audio.start}>
            {audio.broadcasting ? "Stop broadcast" : "Start microphone"}
          </button>
          {audio.error ? <p className={styles.error}>{audio.error}</p> : null}
        </section>

        <section className={`${styles.section} ${styles.join}`} aria-labelledby="join-title">
          <div>
            <h2 id="join-title">Audience entry</h2>
            <a href={mobileUrl}>{mobileUrl}</a>
          </div>
          <QRCodeSVG aria-label="QR code for the audience mobile route" bgColor="#d9dedb" fgColor="#18201f" level="M" marginSize={0} size={152} value={mobileUrl} />
        </section>
      </div>

      {!authenticated ? (
        <form className={styles.auth} onSubmit={(event) => { event.preventDefault(); authenticate(); }}>
          <label htmlFor="admin-passcode">Unlock controls</label>
          <div>
            <input id="admin-passcode" type="password" autoComplete="current-password" value={passcode} onChange={(event) => setPasscode(event.target.value)} />
            <button className="button button--filled" disabled={!connected || !passcode} type="submit">Unlock</button>
          </div>
          {authMessage ? <p className={styles.error}>{authMessage}</p> : null}
        </form>
      ) : null}
    </main>
  );
}
