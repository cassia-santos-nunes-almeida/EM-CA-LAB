import { MathWrapper } from '@shared/components/common/MathWrapper';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';

export function CircuitAnalysisExercise({ onConceptCheckComplete, onHint }: { onConceptCheckComplete?: () => void; onHint?: (tier: number) => void }) {
  return (
    <div className="space-y-8">
      {/* Problem 1: Series RLC — KVL */}
      <div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-5 mb-4 border border-slate-200 dark:border-slate-700">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Problem 1: Series RLC Circuit</h4>
          <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
            A series RLC circuit with voltage source{' '}
            <MathWrapper formula="V_s" />, resistor <MathWrapper formula="R" />,
            inductor <MathWrapper formula="L" />, and capacitor <MathWrapper formula="C" />.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Apply Kirchhoff's Voltage Law (KVL) around the loop.
          </p>
        </div>
        <ConceptCheck
          onComplete={onConceptCheckComplete}
          onHint={onHint}
          data={{
            mode: 'multiple-choice',
            question: 'Which equation correctly represents KVL around the loop?',
            options: [
              {
                text: 'Vs = Ri + L(di/dt) + (1/C)∫i dt',
                correct: true,
                explanation:
                  'Correct! KVL states the source voltage equals the sum of all voltage drops: resistor (Ri), inductor (L di/dt), and capacitor ((1/C)∫i dt).',
              },
              {
                text: 'Vs = Ri + L(di/dt) - (1/C)∫i dt',
                correct: false,
                explanation:
                  'The capacitor voltage adds to the other drops, not subtracts. All three elements consume voltage from the source.',
              },
              {
                text: 'Vs = Ri - L(di/dt) + (1/C)∫i dt',
                correct: false,
                explanation:
                  'The inductor voltage drop is +L(di/dt), not negative. The sign comes from the voltage-current relationship v = L(di/dt).',
              },
              {
                text: 'Vs = Ri/L + C(dv/dt)',
                correct: false,
                explanation:
                  'This mixes up the constitutive relationships. KVL sums voltage drops: Ri + L(di/dt) + (1/C)∫i dt.',
              },
            ],
          }}
        />
      </div>

      {/* Problem 2: Parallel RC — KCL */}
      <div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-5 mb-4 border border-slate-200 dark:border-slate-700">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Problem 2: Parallel RC Circuit</h4>
          <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
            A parallel RC circuit: current source{' '}
            <MathWrapper formula="I_s" /> in parallel with <MathWrapper formula="R" /> and{' '}
            <MathWrapper formula="C" />.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Apply Kirchhoff's Current Law (KCL) at the top node.
          </p>
        </div>
        <ConceptCheck
          onComplete={onConceptCheckComplete}
          onHint={onHint}
          data={{
            mode: 'multiple-choice',
            question: 'Which equation correctly represents KCL at the top node?',
            options: [
              {
                text: 'Is = v/R + C(dv/dt)',
                correct: true,
                explanation:
                  'Correct! KCL says the source current equals the sum of branch currents: v/R through the resistor and C(dv/dt) through the capacitor.',
              },
              {
                text: 'Is = vR + C/(dv/dt)',
                correct: false,
                explanation:
                  'The resistor current is v/R (not vR), and the capacitor current is C(dv/dt), not C divided by dv/dt.',
              },
              {
                text: 'Is = v/R - C(dv/dt)',
                correct: false,
                explanation:
                  'Both branch currents flow out of the node, so they add together. The capacitor current is +C(dv/dt), not subtracted.',
              },
              {
                text: 'Is = Rv + Cv',
                correct: false,
                explanation:
                  'The resistor current is v/R (Ohm\'s law), not Rv. And the capacitor current depends on dv/dt, not v directly.',
              },
            ],
          }}
        />
      </div>

      {/* Problem 3: Series RL with Step — Standard Form ODE */}
      <div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-5 mb-4 border border-slate-200 dark:border-slate-700">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Problem 3: Series RL Circuit with Step Input</h4>
          <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
            A series RL circuit driven by step voltage{' '}
            <MathWrapper formula="V_s \cdot u(t)" />.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Write the governing first-order ODE for the current <MathWrapper formula="i(t)" />.
          </p>
        </div>
        <ConceptCheck
          onComplete={onConceptCheckComplete}
          onHint={onHint}
          data={{
            mode: 'multiple-choice',
            question: 'What is the correct first-order ODE for the current i(t)?',
            options: [
              {
                text: 'L(di/dt) + Ri = Vs',
                correct: true,
                explanation:
                  'Correct! KVL gives Vs = L(di/dt) + Ri. The inductor voltage plus the resistor voltage equals the source voltage.',
              },
              {
                text: 'R(di/dt) + Li = Vs',
                correct: false,
                explanation:
                  'The coefficients are swapped. The inductor contributes L(di/dt) and the resistor contributes Ri, not the other way around.',
              },
              {
                text: 'di/dt + (R/L)i = R/Vs',
                correct: false,
                explanation:
                  'The right-hand side should be Vs/L, not R/Vs. Dividing the standard form L(di/dt) + Ri = Vs by L gives di/dt + (R/L)i = Vs/L.',
              },
              {
                text: 'L(di/dt) - Ri = Vs',
                correct: false,
                explanation:
                  'The resistor voltage drop has the same sign as the inductor voltage drop in KVL. Both are positive: L(di/dt) + Ri = Vs.',
              },
            ],
          }}
        />
      </div>
    </div>
  );
}
