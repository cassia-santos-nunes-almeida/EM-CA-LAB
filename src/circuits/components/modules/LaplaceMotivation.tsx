import { MathWrapper } from '@shared/components/common/MathWrapper';
import { PredictionGate } from '@shared/components/common/PredictionGate';
import { useProgressStore } from '@shared/store/progressStore';

interface LaplaceMotivationProps {
  /**
   * Seeds the gate as already-passed on mount. The parent lifts this above the
   * Tabs so a tab switch — which remounts this panel (key={activeIndex}) — does
   * not re-lock the gate and demand a second prediction.
   */
  initialPassed?: boolean;
  /** Fires when the gate is passed, so the parent above the Tabs can persist it. */
  onPassed?: () => void;
}

export function LaplaceMotivation({ initialPassed, onPassed }: LaplaceMotivationProps = {}) {
  const markPredictionGate = useProgressStore((s) => s.markPredictionGate);
  return (
    <section className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3">
        Why Laplace Transforms?
      </h2>

      <p className="text-slate-700 dark:text-slate-300 mb-3">
        Consider a simple RC circuit ODE with zero initial conditions:
      </p>

      <div className="bg-engineering-blue-50 dark:bg-engineering-blue-900/20 p-4 rounded-lg mb-6">
        <MathWrapper
          formula="RC\,\frac{dv}{dt} + v = V_s, \quad v(0) = 0"
          block
        />
      </div>

      <PredictionGate
        question="How many algebraic steps does the classical time-domain solution require?"
        options={[
          { id: '2-3', label: '2-3 steps' },
          { id: '4-6', label: '4-6 steps' },
          { id: '7+', label: '7+ steps' },
        ]}
        getCorrectAnswer={() => '4-6'}
        onPredict={(correct) => markPredictionGate('laplace-motivation', correct)}
        initialPassed={initialPassed}
        onPassed={onPassed}
        explanation={
          <p>
            The classical approach requires separation of variables, integration of both sides,
            applying the initial condition, and simplifying — typically 4-6 distinct steps of
            calculus. Let's see how both approaches compare.
          </p>
        }
      >
        {/* Two-column comparison revealed after the gate */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Left column: Time-Domain */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-5 border border-slate-200 dark:border-slate-600">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Time-Domain Approach (Classical ODE)
            </h3>
            <ol className="space-y-4 list-none">
              <li>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  1. Rearrange
                </p>
                <MathWrapper formula="\frac{dv}{dt} = \frac{V_s - v}{RC}" block />
              </li>
              <li>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  2. Separate variables
                </p>
                <MathWrapper formula="\frac{dv}{V_s - v} = \frac{dt}{RC}" block />
              </li>
              <li>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  3. Integrate both sides
                </p>
                <MathWrapper formula="-\ln(V_s - v) = \frac{t}{RC} + C_1" block />
              </li>
              <li>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  4. Exponentiate
                </p>
                <MathWrapper formula="V_s - v = Ae^{-t/RC}" block />
              </li>
              <li>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  5. Apply IC v(0)=0
                </p>
                <MathWrapper formula="A = V_s" block />
              </li>
              <li>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  6. Final answer
                </p>
                <MathWrapper formula="v(t) = V_s\!\left(1 - e^{-t/RC}\right)" block />
              </li>
            </ol>
          </div>

          {/* Right column: Laplace */}
          <div className="bg-engineering-blue-50 dark:bg-engineering-blue-900/20 rounded-lg p-5 border border-engineering-blue-200 dark:border-engineering-blue-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Laplace Approach (s-Domain)
            </h3>
            <ol className="space-y-4 list-none">
              <li>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  1. Transform
                </p>
                <MathWrapper formula="RC\,V(s)\cdot s + V(s) = \frac{V_s}{s}" block />
              </li>
              <li>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  2. Solve algebraically
                </p>
                <MathWrapper formula="V(s) = \frac{V_s}{s(RCs + 1)} = \frac{V_s}{s} - \frac{V_s}{s + 1/RC}" block />
              </li>
              <li>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  3. Inverse transform from table
                </p>
                <MathWrapper formula="v(t) = V_s\!\left(1 - e^{-t/RC}\right)" block />
              </li>
            </ol>
          </div>
        </div>

        {/* Summary card */}
        <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg p-4">
          <p className="text-sm font-semibold text-green-900 dark:text-green-300">
            The Laplace transform reduced 6 steps of calculus to 3 steps of algebra. For
            second-order circuits (RLC), the savings are even more dramatic.
          </p>
        </div>
      </PredictionGate>
    </section>
  );
}
