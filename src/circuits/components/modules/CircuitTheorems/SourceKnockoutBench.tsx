import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { cn } from '@shared/utils/cn';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import {
  knockoutState,
  KNOCKOUT_LEDGER_ORDER,
  LINEARITY_CHIP,
  type KnockoutKey,
} from '@circuits/components/modules/CircuitTheorems/theoremData';
import { SourceNetworkDiagram } from '@circuits/components/modules/CircuitTheorems/TheoremsDiagrams';

/**
 * Superposition bench: two source toggles, a live voltmeter readout on node A,
 * and a visited-states ledger that lights a LINEARITY VERIFIED row once both
 * single-source states have been seen.
 */
export function SourceKnockoutBench() {
  const [vOn, setVOn] = useState(true);
  const [iOn, setIOn] = useState(true);
  const [visited, setVisited] = useState<Record<KnockoutKey, boolean>>({
    'both-on': true,
    'v-only': false,
    'i-only': false,
    'both-off': false,
  });

  const reading = knockoutState(vOn, iOn);
  const linearityVerified = visited['v-only'] && visited['i-only'];

  const applyToggle = (nextVOn: boolean, nextIOn: boolean) => {
    setVOn(nextVOn);
    setIOn(nextIOn);
    const { key } = knockoutState(nextVOn, nextIOn);
    setVisited((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  };

  const toggleClass = (on: boolean) => cn(
    'px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-colors',
    on
      ? 'border-engineering-blue-500 bg-engineering-blue-50 dark:bg-engineering-blue-900/20 text-engineering-blue-700 dark:text-engineering-blue-300'
      : 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400',
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <SourceNetworkDiagram vOn={vOn} iOn={iOn} portMode="open" />
          <p className="text-sm text-muted mt-1">
            The fixed source network: 24 V behind R1 = 6 Ω into node A, a 2 A source injecting
            into A, and R2 = 3 Ω from A down to ground — a dead voltage source becomes a short,
            a dead current source becomes an open.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <button
              aria-pressed={vOn}
              onClick={() => applyToggle(!vOn, iOn)}
              className={toggleClass(vOn)}
            >
              24 V source: {vOn ? 'ON' : 'OFF'}
            </button>
            <button
              aria-pressed={iOn}
              onClick={() => applyToggle(vOn, !iOn)}
              className={toggleClass(iOn)}
            >
              2 A source: {iOn ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="rounded-lg bg-chassis border border-card-border p-4">
            <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-1">
              Voltmeter on node A
            </p>
            <p className="font-mono text-3xl font-bold text-title">
              {reading.vA.toFixed(1)} V
            </p>
            <MathWrapper formula={reading.derivation} block className="text-sm" />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-card-border bg-card p-4">
        <p className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-2">
          State ledger
        </p>
        <ul className="space-y-1.5">
          {KNOCKOUT_LEDGER_ORDER.map((key) => {
            const entry = ledgerEntry(key);
            const seen = visited[key];
            return (
              <li
                key={key}
                className={cn(
                  'flex items-center gap-2 text-sm font-mono',
                  seen ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600',
                )}
              >
                {seen
                  ? <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" aria-hidden="true" />
                  : <span className="w-4 h-4 shrink-0 text-center" aria-hidden="true">·</span>}
                <span>{entry}</span>
              </li>
            );
          })}
        </ul>

        {linearityVerified && (
          <div className="mt-3 flex items-center gap-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 px-3 py-2">
            <span
              className="w-2 h-2 rounded-full bg-led shadow-[0_0_6px_var(--color-led)] shrink-0"
              aria-hidden="true"
            />
            <span className="text-xs font-bold uppercase tracking-widest text-green-700 dark:text-green-400">
              Linearity verified
            </span>
            <MathWrapper formula={LINEARITY_CHIP} className="text-sm" />
            <span className="text-green-700 dark:text-green-400" aria-hidden="true">✓</span>
          </div>
        )}
      </div>

      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Superposition holds because the circuit equations are linear: the response to all
          sources together is the sum of the responses to each source alone. It applies to any
          voltage or current in the network — and NOT to power, as the next check shows.
        </p>
      </div>
    </div>
  );
}

function ledgerEntry(key: KnockoutKey): string {
  switch (key) {
    case 'both-on': return 'Both ON → V_A = 12 V';
    case 'v-only': return '24 V alone (2 A opened) → V_A = 8 V';
    case 'i-only': return '2 A alone (24 V shorted) → V_A = 4 V';
    case 'both-off': return 'Both OFF → V_A = 0 V';
  }
}
