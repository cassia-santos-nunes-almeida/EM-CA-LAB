import { MathWrapper } from '@shared/components/common/MathWrapper';

export function MethodComparisonTable() {
  return (
    <div>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
        Time-domain vs s-domain: when to use each approach
      </p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 px-4 py-3 text-left font-semibold text-slate-800 dark:text-slate-200 w-1/4">Aspect</th>
              <th className="border border-slate-300 dark:border-slate-600 bg-blue-50 dark:bg-blue-900/30 px-4 py-3 text-left font-semibold text-blue-800 dark:text-blue-300 w-[37.5%]">Time-Domain</th>
              <th className="border border-slate-300 dark:border-slate-600 bg-purple-50 dark:bg-purple-900/30 px-4 py-3 text-left font-semibold text-purple-800 dark:text-purple-300 w-[37.5%]">S-Domain (Laplace)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Mathematical tool</td>
              <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-slate-700 dark:text-slate-300">Differential equations (ODE/PDE)</td>
              <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-slate-700 dark:text-slate-300">Algebraic equations in <MathWrapper formula="s" /></td>
            </tr>
            <tr className="bg-slate-50/50 dark:bg-slate-700/30">
              <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Initial conditions</td>
              <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-slate-700 dark:text-slate-300">Applied after finding the general solution (constants of integration)</td>
              <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-slate-700 dark:text-slate-300">Built into the transform automatically from the start</td>
            </tr>
            <tr>
              <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Complexity scaling</td>
              <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-slate-700 dark:text-slate-300">Grows rapidly with circuit order; 2nd-order and above require characteristic equation, multiple cases</td>
              <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-slate-700 dark:text-slate-300">Remains algebraic regardless of order; higher-order just means more terms in the polynomial</td>
            </tr>
            <tr className="bg-slate-50/50 dark:bg-slate-700/30">
              <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Physical intuition</td>
              <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-slate-700 dark:text-slate-300">Direct view of how voltages/currents evolve over time</td>
              <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-slate-700 dark:text-slate-300">Insight via poles/zeros, transfer functions, and frequency response</td>
            </tr>
            <tr>
              <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Input handling</td>
              <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-slate-700 dark:text-slate-300">Each input type (step, impulse, sinusoid) may need a different solution technique</td>
              <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-slate-700 dark:text-slate-300">Multiply transfer function by input's Laplace transform — same procedure every time</td>
            </tr>
            <tr className="bg-slate-50/50 dark:bg-slate-700/30">
              <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Stability analysis</td>
              <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-slate-700 dark:text-slate-300">Must examine solution behavior as <MathWrapper formula="t \to \infty" /></td>
              <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-slate-700 dark:text-slate-300">Check if all poles have negative real parts (left half-plane)</td>
            </tr>
            <tr>
              <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Best suited for</td>
              <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-slate-700 dark:text-slate-300">Simple 1st-order circuits, building foundational understanding</td>
              <td className="border border-slate-300 dark:border-slate-600 px-4 py-3 text-slate-700 dark:text-slate-300">Higher-order circuits, control systems, frequency-domain design</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
