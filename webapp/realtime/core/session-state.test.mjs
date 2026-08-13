import assert from "node:assert/strict";
import test from "node:test";
import { applySessionCommand, createSessionState } from "./session-state.mjs";

const experiment = { modes: new Set(["particle", "wave", "hybrid"]), reset() {} };

test("session commands preserve a revisioned state boundary", () => {
  const initial = createSessionState({ experimentId: "wave-particle", mode: "hybrid" });
  const live = applySessionCommand(initial, { type: "start" }, experiment);
  assert.equal(live.status, "live");
  assert.equal(live.revision, 1);
  const wave = applySessionCommand(live, { type: "set-mode", mode: "wave" }, experiment);
  assert.equal(wave.mode, "wave");
  assert.equal(wave.revision, 2);
  assert.strictEqual(applySessionCommand(wave, { type: "set-mode", mode: "invalid" }, experiment), wave);
});

test("reset creates a new epoch", () => {
  const initial = createSessionState({ experimentId: "wave-particle", mode: "hybrid" });
  const reset = applySessionCommand(initial, { type: "reset" }, experiment);
  assert.notEqual(reset.epoch, initial.epoch);
  assert.equal(reset.status, "idle");
});
