const defaultDevHostname = "macbook-air-5.local";

function getDevHostname() {
  return process.env.NEXT_PUBLIC_DEV_HOSTNAME || defaultDevHostname;
}

export function getAppOrigin() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  const port = process.env.NEXT_PUBLIC_WEB_PORT || "10000";
  return `https://${getDevHostname()}:${port}`;
}

export function getRealtimeOrigin() {
  if (process.env.NEXT_PUBLIC_REALTIME_URL) return process.env.NEXT_PUBLIC_REALTIME_URL;
  const port = process.env.NEXT_PUBLIC_REALTIME_PORT || "10001";
  return `https://${getDevHostname()}:${port}`;
}

export function getIceServers(): RTCIceServer[] {
  const fallback: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];
  const encoded = process.env.NEXT_PUBLIC_WEBRTC_ICE_SERVERS;
  if (!encoded) return fallback;
  try {
    const parsed: unknown = JSON.parse(encoded);
    return Array.isArray(parsed) ? (parsed as RTCIceServer[]) : fallback;
  } catch {
    return fallback;
  }
}
