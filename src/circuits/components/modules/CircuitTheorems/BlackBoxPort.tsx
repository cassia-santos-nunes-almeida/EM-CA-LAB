import { useReducer } from 'react';
import { CheckCircle } from 'lucide-react';
import { cn } from '@shared/utils/cn';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import {
  blackBoxReducer,
  initialBlackBoxState,
  RTH_CHOICES,
  LOAD_TABLE,
  V_TH,
  I_SC,
  type LoadR,
} from '@circuits/components/modules/CircuitTheorems/theoremData';
import {
  SourceNetworkDiagram,
  TheveninTwinDiagram,
  type PortMode,
} from '@circuits/components/modules/CircuitTheorems/TheoremsDiagrams';

const ALL_LOADS: LoadR[] = [1, 2, 4, 10];

/**
 * Thevenin-by-measurement instrument: measure V_oc and I_sc at the port,
 * compute R_th, reveal the two-component twin, then attach all four catalog
 * loads and watch the full network and the twin never disagree.
 */
export function BlackBoxPort() {
  const [state, dispatch] = useReducer(blackBoxReducer, initialBlackBoxState);

  const vocMeasured = state.phase !== 'idle';
  const iscMeasured = vocMeasured && state.phase !== 'voc';
  const twinRevealed = state.phase === 'twin' || state.phase === 'congruence' || state.phase === 'done';
  const loadsActive = state.phase === 'congruence' || state.phase === 'done';

  const portMode: PortMode =
    state.phase === 'idle' ? 'open'
      : state.phase === 'voc' ? 'voltmeter'
        : state.phase === 'isc' ? 'ammeter'
          : state.activeLoad ? 'load' : 'open';

  const activeRow = state.activeLoad ? LOAD_TABLE.find((row) => row.r === state.activeLoad) : undefined;

  return (
    <div className="space-y-4">
      <div className={cn('grid gap-4', twinRevealed && 'md:grid-cols-2')}>
        <div>
          <SourceNetworkDiagram portMode={portMode} loadR={state.activeLoad ?? undefined} />
          <p className="text-sm text-muted mt-1">
            The full source network, treated as a mystery box: only its two port terminals
            (node A and ground) are accessible to your instruments.
          </p>
          {loadsActive && activeRow && (
            <p className="text-sm font-mono text-slate-700 dark:text-slate-300 mt-1">
              Full network: i_L = {activeRow.iL} A, v_L = {activeRow.vL} V
            </p>
          )}
        </div>
        {twinRevealed && (
          <div>
            <TheveninTwinDiagram loadR={state.activeLoad ?? undefined} />
            <p className="text-sm text-muted mt-1">
              The Thevenin twin: a single 12 V source in series with 2 Ω, port-aligned beside
              the full network.
            </p>
            {loadsActive && activeRow && (
              <p className="text-sm font-mono text-slate-700 dark:text-slate-300 mt-1">
                Thevenin twin: i_L = {activeRow.iL} A, v_L = {activeRow.vL} V
              </p>
            )}
          </div>
        )}
      </div>

      {/* Measurement log */}
      <div className="rounded-lg bg-chassis border border-card-border p-4 space-y-2">
        <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">
          Measurement log
        </p>
        {!vocMeasured && (
          <p className="text-sm text-muted">No measurements yet — start with the open-circuit voltage.</p>
        )}
        {vocMeasured && (
          <p className="flex items-baseline gap-2 text-sm font-mono text-slate-700 dark:text-slate-300">
            <span>V_oc (open-circuit voltage):</span>
            <span className="text-lg font-bold text-title">{V_TH.toFixed(1)} V</span>
          </p>
        )}
        {iscMeasured && (
          <p className="flex items-baseline gap-2 text-sm font-mono text-slate-700 dark:text-slate-300">
            <span>I_sc (short-circuit current):</span>
            <span className="text-lg font-bold text-title">{I_SC.toFixed(1)} A</span>
          </p>
        )}
      </div>

      {state.phase === 'idle' && (
        <button
          onClick={() => dispatch({ type: 'measureVoc' })}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-engineering-blue-600 text-white hover:bg-engineering-blue-700 transition-colors"
        >
          Measure V_oc
        </button>
      )}

      {state.phase === 'voc' && (
        <div className="space-y-3">
          <p className="text-xs text-engineering-blue-700 dark:text-engineering-blue-400 bg-engineering-blue-50 dark:bg-engineering-blue-900/20 rounded px-3 py-2 inline-block">
            You built this very number on the Knock-Out Bench: 8 + 4 V.
          </p>
          <div>
            <button
              onClick={() => dispatch({ type: 'measureIsc' })}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-engineering-blue-600 text-white hover:bg-engineering-blue-700 transition-colors"
            >
              Measure I_sc
            </button>
          </div>
        </div>
      )}

      {state.phase === 'isc' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded px-3 py-2 inline-block">
            With the port shorted, R2 carries nothing: 24/6 = 4 A through R1 plus the 2 A source.
          </p>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Compute R_th from your two measurements:
          </p>
          <div className="flex flex-wrap gap-2">
            {RTH_CHOICES.map((choice) => (
              <button
                key={choice.id}
                onClick={() => dispatch({ type: 'pickRth', choiceId: choice.id })}
                className="px-4 py-2 rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 hover:border-engineering-blue-400 dark:hover:border-engineering-blue-500 text-sm font-mono text-slate-700 dark:text-slate-300 transition-colors"
              >
                {choice.label}
              </button>
            ))}
          </div>
          {state.feedback && (
            <p className="text-sm text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded px-3 py-2">
              {state.feedback}
            </p>
          )}
        </div>
      )}

      {state.phase === 'twin' && (
        <div className="space-y-3">
          <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-lg p-4">
            <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-2">
              The Thevenin twin
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              The model that reproduces both measurements is V_th = 12 V in series with
              R_th = 12/6 = 2 Ω. Cross-check the second way: with both sources killed, looking
              into the port you see <MathWrapper formula="6 \parallel 3 = 2\ \Omega" /> — two
              independent routes agreeing builds confidence.
            </p>
          </div>
          <button
            onClick={() => dispatch({ type: 'continue' })}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-engineering-blue-600 text-white hover:bg-engineering-blue-700 transition-colors"
          >
            Attach loads
          </button>
        </div>
      )}

      {loadsActive && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Attach each catalog load to BOTH circuits:
          </p>
          <div className="flex flex-wrap gap-2">
            {ALL_LOADS.map((r) => (
              <button
                key={r}
                onClick={() => dispatch({ type: 'attachLoad', r })}
                className={cn(
                  'px-4 py-2 rounded-lg border-2 text-sm font-mono transition-colors',
                  state.activeLoad === r
                    ? 'border-engineering-blue-500 bg-engineering-blue-50 dark:bg-engineering-blue-900/20 text-engineering-blue-700 dark:text-engineering-blue-300'
                    : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 hover:border-engineering-blue-400 dark:hover:border-engineering-blue-500 text-slate-700 dark:text-slate-300',
                )}
              >
                {r} Ω
              </button>
            ))}
          </div>

          <table className="w-full text-sm text-left">
            <caption className="sr-only">Load results from both the full network and the Thevenin twin</caption>
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <th scope="col" className="py-1.5 pr-3">R_L</th>
                <th scope="col" className="py-1.5 pr-3">i_L</th>
                <th scope="col" className="py-1.5 pr-3">v_L</th>
                <th scope="col" className="py-1.5">Twin agrees?</th>
              </tr>
            </thead>
            <tbody className="font-mono text-slate-700 dark:text-slate-300">
              {LOAD_TABLE.map((row) => {
                const seen = state.visitedLoads.includes(row.r);
                return (
                  <tr key={row.r} className={cn('border-b border-slate-100 dark:border-slate-700/50', !seen && 'opacity-40')}>
                    <td className="py-1.5 pr-3">{row.r} Ω</td>
                    <td className="py-1.5 pr-3">{seen ? `${row.iL} A` : '—'}</td>
                    <td className="py-1.5 pr-3">{seen ? `${row.vL} V` : '—'}</td>
                    <td className="py-1.5">{seen ? '✓ identical' : 'not attached'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {state.phase === 'done' && (
            <div className="flex items-start gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 px-3 py-2">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-green-800 dark:text-green-300">
                Indistinguishable at the terminals. The four-load puzzle from the top of the
                page is now four one-line divisions: i_L = 12 / (2 + R_L).
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
