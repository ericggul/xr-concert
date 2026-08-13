import { createWaveParticleExperiment } from "./wave-particle/index.mjs";

export function createExperimentRegistry() {
  const experiments = [createWaveParticleExperiment()];
  const ids = new Set();
  for (const experiment of experiments) {
    if (ids.has(experiment.id)) throw new Error(`Duplicate experiment id: ${experiment.id}`);
    ids.add(experiment.id);
  }
  return new Map(experiments.map((experiment) => [experiment.id, experiment]));
}
