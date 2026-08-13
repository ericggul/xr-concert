const VALID_STATUSES = new Set(["idle", "live", "paused"]);

export function createSessionState({ experimentId, mode }) {
  return {
    activeExperiment: experimentId,
    mode,
    status: "idle",
    revision: 0,
    epoch: crypto.randomUUID(),
    updatedAt: Date.now(),
  };
}

export function applySessionCommand(state, command, experiment) {
  if (!command || typeof command.type !== "string") return state;

  let next = state;
  if (command.type === "start") {
    next = { ...state, status: "live" };
  } else if (command.type === "pause") {
    next = { ...state, status: "paused" };
  } else if (command.type === "set-mode" && experiment.modes.has(command.mode)) {
    next = { ...state, mode: command.mode };
  } else if (command.type === "reset") {
    experiment.reset();
    next = { ...state, status: "idle", epoch: crypto.randomUUID() };
  } else if (command.type === "set-status" && VALID_STATUSES.has(command.status)) {
    next = { ...state, status: command.status };
  }

  if (next === state) return state;
  return { ...next, revision: state.revision + 1, updatedAt: Date.now() };
}
