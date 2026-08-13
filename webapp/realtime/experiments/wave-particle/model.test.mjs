import assert from "node:assert/strict";
import test from "node:test";
import { createWaveParticleModel } from "./model.mjs";

function sample(overrides = {}) {
  return {
    version: 1,
    interactionId: "gesture-1",
    seq: 0,
    phase: "start",
    x: 0.25,
    y: 0.75,
    pressure: 0.8,
    ...overrides,
  };
}

test("accepts ordered lifecycle samples and rejects duplicates", () => {
  const model = createWaveParticleModel();
  assert.equal(model.accept("phone-a", sample(), 1000), true);
  assert.equal(model.accept("phone-a", sample(), 1001), false);
  assert.equal(model.accept("phone-a", sample({ seq: 1, phase: "move" }), 1002), true);
});

test("aggregates contributors into abstract parameters", () => {
  const model = createWaveParticleModel();
  model.accept("phone-a", sample({ x: 0, y: 0, pressure: 0.4 }), 1000);
  model.accept("phone-b", sample({ interactionId: "gesture-2", x: 1, y: 1, pressure: 0.8 }), 1000);
  const frame = model.frame(1100);
  assert.equal(frame.activeContributors, 2);
  assert.deepEqual(frame.centroid, { x: 0.5, y: 0.5 });
  assert.ok(Math.abs(frame.energy - 0.6) < 1e-9);
  assert.equal(frame.impulses, 2);
  assert.equal("color" in frame, false);
  assert.equal("radius" in frame, false);
});

test("expires abandoned interactions and ends explicit ones", () => {
  const model = createWaveParticleModel({ staleMs: 100 });
  model.accept("phone-a", sample(), 1000);
  assert.equal(model.frame(1200).activeContributors, 0);
  model.accept("phone-a", sample({ interactionId: "gesture-2" }), 1300);
  model.accept("phone-a", sample({ interactionId: "gesture-2", seq: 1, phase: "end" }), 1310);
  assert.equal(model.frame(1320).activeContributors, 0);
});

test("clamps bounded values and rejects malformed payloads", () => {
  const model = createWaveParticleModel();
  assert.equal(model.accept("phone-a", sample({ x: -9, y: 4, pressure: 5 }), 1000), true);
  const frame = model.frame(1010);
  assert.deepEqual(frame.centroid, { x: 0, y: 1 });
  assert.equal(frame.energy, 1);
  assert.equal(model.accept("phone-b", sample({ version: 2 }), 1000), false);
  assert.equal(model.accept("phone-b", sample({ seq: Number.NaN }), 1000), false);
});
