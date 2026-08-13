"use client";

import { useMemo } from "react";
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
  const mobileUrl = `${getAppOrigin()}/mobile`;

  const stateLabel = useMemo(() => {
    if (!connected) return connectionError || "Realtime server offline";
    if (!session) return "Reading session";
    return session.status === "live" ? "Audience input is live" : session.status === "paused" ? "Audience input is paused" : "Session is ready";
  }, [connected, connectionError, session]);

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
          <button className="button button--filled" disabled={!connected || session?.status === "live"} onClick={() => command("start")}>Start input</button>
          <button className="button" disabled={!connected || session?.status !== "live"} onClick={() => command("pause")}>Pause</button>
          <button className="button button--danger" disabled={!connected} onClick={() => command("reset")}>Reset session</button>
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
                disabled={!connected}
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
          <label className={styles.audioInput}>
            <span>Input</span>
            <select disabled={audio.broadcasting} value={audio.deviceId} onChange={(event) => audio.setDeviceId(event.target.value)}>
              {audio.devices.map((device, index) => (
                <option key={device.deviceId || index} value={device.deviceId}>
                  {device.label || `Audio input ${index + 1}`}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.meter} aria-label="Input signal level"><span style={{ width: `${audio.level * 100}%` }} /></div>
          <button className="button" disabled={!connected} onClick={audio.broadcasting ? audio.stop : audio.start}>
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

    </main>
  );
}
