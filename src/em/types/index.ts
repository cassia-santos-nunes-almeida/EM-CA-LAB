/** Point charge for Coulomb's Law simulations */
export interface Charge {
  x: number;
  y: number;
  q: number;
  id: number;
}

/** Equation entry for EquationBox */
export interface Equation {
  label: string;
  math: string;
  color?: string;
}

/** A single tiered hint for a quiz question. */
export interface QuizHint {
  /** Hint tier: 1 = conceptual, 2 = procedural, 3 = worked example. */
  tier: 1 | 2 | 3;
  /** Button label shown to the student. */
  label: string;
  /** The hint content. */
  content: string;
}

/** Quiz question for ConceptCheck component */
export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  /** Optional tiered hints revealed sequentially after wrong answers. */
  hints?: QuizHint[];
}

/** Challenge for GuidedChallenge component */
export interface Challenge {
  title: string;
  description: string;
  instructions: string[];
  checkFn?: () => boolean;
  hint?: string;
}

/** EM Wave simulation state */
export interface EMWaveState {
  frequency: number;
  amplitude: number;
  speed: number;
  vAmplitude: number;
  iAmplitude: number;
  vPhase: number;
  iPhase: number;
  isPlaying: boolean;
  refractiveIndex: number;
}

/** Chat message for Think it Through tutor */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
