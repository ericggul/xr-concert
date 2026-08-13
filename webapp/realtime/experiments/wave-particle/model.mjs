const MAX_SEQUENCE = Number.MAX_SAFE_INTEGER;
const DEFAULT_STALE_MS = 750;

function clamp01(value, fallback = 0.5) {
  return Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : fallback;
}

function validShortString(value, maxLength = 96) {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength;
}

export function createWaveParticleModel({ staleMs = DEFAULT_STALE_MS } = {}) {
  const samples = new Map();
  const sequences = new Map();
  let tick = 0;
  let startsSinceFrame = 0;

  function accept(socketId, payload, now = Date.now()) {
    if (!payload || payload.version !== 1) return false;
    if (!validShortString(payload.interactionId)) return false;
    if (!Number.isSafeInteger(payload.seq) || payload.seq < 0 || payload.seq > MAX_SEQUENCE) {
      return false;
    }
    if (!validShortString(payload.phase, 8) || !["start", "move", "end"].includes(payload.phase)) {
      return false;
    }

    const sequenceKey = `${socketId}:${payload.interactionId}`;
    const previousSequence = sequences.get(sequenceKey) ?? -1;
    if (payload.seq <= previousSequence) return false;
    sequences.set(sequenceKey, payload.seq);

    if (payload.phase === "end") {
      samples.delete(socketId);
      return true;
    }

    if (payload.phase === "start") startsSinceFrame += 1;
    samples.set(socketId, {
      x: clamp01(payload.x),
      y: clamp01(payload.y),
      pressure: clamp01(payload.pressure, 0.5),
      receivedAt: now,
      interactionId: payload.interactionId,
    });
    return true;
  }

  function remove(socketId) {
    samples.delete(socketId);
    for (const key of sequences.keys()) {
      if (key.startsWith(`${socketId}:`)) sequences.delete(key);
    }
  }

  function frame(now = Date.now()) {
    for (const [socketId, sample] of samples) {
      if (now - sample.receivedAt > staleMs) samples.delete(socketId);
    }

    const active = [...samples.values()];
    const count = active.length;
    let x = 0.5;
    let y = 0.5;
    let energy = 0;
    let coherence = 0;

    if (count > 0) {
      x = active.reduce((sum, sample) => sum + sample.x, 0) / count;
      y = active.reduce((sum, sample) => sum + sample.y, 0) / count;
      energy = active.reduce((sum, sample) => sum + sample.pressure, 0) / count;
      const variance = active.reduce((sum, sample) => {
        const dx = sample.x - x;
        const dy = sample.y - y;
        return sum + dx * dx + dy * dy;
      }, 0) / count;
      coherence = clamp01(1 - variance / 0.5, 0);
    }

    const output = {
      version: 1,
      experimentId: "wave-particle",
      serverTime: now,
      tick: tick++,
      activeContributors: count,
      centroid: { x, y },
      energy,
      coherence,
      impulses: startsSinceFrame,
    };
    startsSinceFrame = 0;
    return output;
  }

  function reset() {
    samples.clear();
    sequences.clear();
    startsSinceFrame = 0;
    tick = 0;
  }

  return { accept, frame, remove, reset };
}
