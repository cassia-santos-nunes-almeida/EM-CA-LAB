import type { Challenge } from '@circuits/components/common/ChallengeCard';
import type { CircuitType, InputType } from '@circuits/types/circuit';

/**
 * Challenge definitions for the Interactive Lab.
 * Math/physics uses the same equations as circuitSolver.ts:
 *   R_crit = 2 * sqrt(L/C)  (critical damping)
 *   tau_RC = R*C, tau_RL = L/R
 *   zeta = R / (2 * sqrt(L/C))
 */

interface ChallengeParams {
  circuitType: CircuitType;
  inputType: InputType;
  R: number;
  L: number;
  C: number;
}

type ChallengeFactory = (params: ChallengeParams) => Challenge | null;

const findCriticalDamping: ChallengeFactory = ({ circuitType, R, L, C }) => {
  if (circuitType !== 'RLC') return null;
  const rCrit = 2 * Math.sqrt(L / C);
  return {
    id: 'critical-damping',
    title: 'Find Critical Damping',
    description: `Adjust R until the circuit is critically damped (ζ = 1). For the current L and C values, R_crit ≈ ${rCrit.toFixed(0)} Ω.`,
    hint: `Critical damping occurs at R = 2√(L/C). Try moving R toward ${rCrit.toFixed(0)} Ω.`,
    successMessage: `You found critical damping! At R ≈ ${R.toFixed(0)} Ω, the circuit returns to steady state as fast as possible without oscillating.`,
    check: () => Math.abs(R - rCrit) / rCrit < 0.05,
  };
};

const makeItRing: ChallengeFactory = ({ circuitType, R, L, C }) => {
  if (circuitType !== 'RLC') return null;
  const zeta = R / (2 * Math.sqrt(L / C));
  return {
    id: 'make-it-ring',
    title: 'Make it Ring',
    description: 'Lower R until the circuit oscillates strongly (ζ < 0.3). Watch the ringing in the response!',
    hint: 'Decrease R significantly — try values below ~19 Ω for the default L and C.',
    successMessage: `Strong oscillations! With ζ ≈ ${zeta.toFixed(2)}, the response rings multiple times before settling.`,
    check: () => zeta < 0.3,
  };
};

const observeTimeConstant: ChallengeFactory = ({ circuitType, R, L, C }) => {
  if (circuitType === 'RLC') return null;
  const tau = circuitType === 'RC' ? R * C : L / R;
  const tauMs = tau * 1000;
  return {
    id: 'observe-tau',
    title: 'Double the Time Constant',
    description: circuitType === 'RC'
      ? `Current τ = ${tauMs.toFixed(2)} ms. Try doubling R or C to make the response twice as slow.`
      : `Current τ = ${tauMs.toFixed(2)} ms. Try doubling L or halving R to make the response twice as slow.`,
    hint: circuitType === 'RC'
      ? 'τ = RC. Doubling either R or C doubles τ.'
      : 'τ = L/R. Doubling L or halving R doubles τ.',
  };
};

const compareInputTypes: ChallengeFactory = ({ inputType }) => {
  if (inputType !== 'step') return null;
  return {
    id: 'compare-inputs',
    title: 'Impulse vs Step',
    description: 'Switch between Step and Impulse inputs. Notice how the impulse response is the derivative of the step response.',
    hint: 'The impulse response decays from a peak, while the step response rises toward a steady value. They carry the same information in different forms.',
  };
};

const allChallengeFactories: ChallengeFactory[] = [
  findCriticalDamping,
  makeItRing,
  observeTimeConstant,
  compareInputTypes,
];

/** Get challenges relevant to the current circuit configuration */
export function getChallenges(params: ChallengeParams): Challenge[] {
  return allChallengeFactories
    .map(factory => factory(params))
    .filter((c): c is Challenge => c !== null);
}
