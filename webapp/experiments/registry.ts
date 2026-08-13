import { WaveParticleMobile } from "./wave-particle/mobile/wave-particle-mobile";
import { WaveParticleScreen } from "./wave-particle/screen/wave-particle-screen";

export const experimentRegistry = {
  "wave-particle": {
    id: "wave-particle",
    label: "Wave / Particle Study",
    Mobile: WaveParticleMobile,
    Screen: WaveParticleScreen,
  },
} as const;

export type ExperimentId = keyof typeof experimentRegistry;

export function getExperiment(id: string | undefined) {
  if (!id || !(id in experimentRegistry)) return experimentRegistry["wave-particle"];
  return experimentRegistry[id as ExperimentId];
}
