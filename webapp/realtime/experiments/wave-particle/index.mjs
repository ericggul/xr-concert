import { createWaveParticleModel } from "./model.mjs";

export function createWaveParticleExperiment(options) {
  const model = createWaveParticleModel(options);
  return {
    id: "wave-particle",
    label: "Wave / Particle Study",
    modes: new Set(["particle", "wave", "hybrid"]),
    defaultMode: "hybrid",
    acceptInput: model.accept,
    createFrame: model.frame,
    removeClient: model.remove,
    reset: model.reset,
  };
}
