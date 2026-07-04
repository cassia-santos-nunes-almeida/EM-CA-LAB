import { useState, useMemo, useDeferredValue, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { clampNum, parseEnum, useUrlSync, useCopyLink } from '@circuits/hooks/useShareableParams';
import { useChartExport } from '@circuits/hooks/useChartExport';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Download, Link2 } from 'lucide-react';
import { calculateCircuitResponse, calculateTransferFunction, type CircuitType, type InputType, type CircuitResponse } from '@circuits/utils/circuitSolver';
import { dampingLabel } from '@circuits/types/circuit';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { ResponseChartTooltip } from '@circuits/components/common/CircuitCharts';
import { CircuitParameterSliders } from '@circuits/components/common/CircuitParameterSliders';
import { CollapsibleSection } from '@shared/components/common/CollapsibleSection';
import { ChallengeCard } from '@circuits/components/common/ChallengeCard';
import { ConceptCheck } from '@shared/components/common/ConceptCheck';
import { CourseNavigation } from '@shared/components/common/CourseNavigation';
import { CircuitDiagram } from '@circuits/components/modules/InteractiveLab/CircuitDiagram';
import { SDomainPanel } from '@circuits/components/modules/InteractiveLab/SDomainPanel';
import { getChallenges } from '@circuits/components/modules/InteractiveLab/challenges';
import { useThemeStore, useProgressStore } from '@shared/store/progressStore';
import { getSectionNumber } from '@shared/constants/curriculum';
import { SectionHook } from '@shared/components/common/SectionHook';
import { FigureImage } from '@shared/components/common/FigureImage';
import { PredictionGate } from '@shared/components/common/PredictionGate';
import { classifyDamping } from '@circuits/types/circuit';

/**
 * Y-axis label for the response chart. A step response is plotted in V / mA; an
 * impulse response h(t) = ds/dt carries an extra 1/time, so its axis is a rate
 * (V/s, mA/s) and must relabel accordingly (Appendix A.2#5).
 */
// Exported (helper, not a component) for the impulse-label test; index already exports the section.
// eslint-disable-next-line react-refresh/only-export-components
export function responseYAxisLabel(inputType: InputType): string {
  return inputType === 'impulse'
    ? 'Voltage rate (V/s) / Current rate (mA/s)'
    : 'Voltage (V) / Current (mA)';
}

/**
 * Response-chart time-constant marker (completes P-03). The chart previously
 * marked 2L/R for every RLC damping type, but 2L/R (= 1/α) is only the governing
 * constant for under/critically-damped — for overdamped RLC the SLOWEST mode
 * s₁ governs settling, per RLCAnalysisPanel's `slowestTauMs`. Reuses the exact
 * same response.alpha/response.omega0 fields so the chart marker and the panel
 * always show the SAME number. RC/RL and RLC under/critically-damped keep the
 * existing fallback (envelopeTauMs, already 2L/R = 1/α upstream).
 */
// eslint-disable-next-line react-refresh/only-export-components
export function chartTauMarkerMs(
  circuitType: CircuitType,
  response: CircuitResponse,
  envelopeTauMs: number,
): number {
  if (circuitType === 'RLC' && response.dampingType === 'overdamped'
    && response.alpha !== undefined && response.omega0 !== undefined) {
    const { alpha, omega0 } = response;
    return 1000 / Math.abs(-alpha + Math.sqrt(alpha * alpha - omega0 * omega0));
  }
  return envelopeTauMs;
}

/** Circuit equations panel showing formulas for the selected circuit/input type (F24). */
function CircuitEquations({ circuitType, inputType, response }: {
  circuitType: CircuitType;
  inputType: InputType;
  response: CircuitResponse;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          inputType === 'step'
            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
            : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
        }`}>
          {inputType === 'step' ? 'Step Response' : 'Impulse Response'}
        </span>
      </div>

      {circuitType === 'RC' && inputType === 'step' && (
        <div className="grid md:grid-cols-3 gap-3">
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Time Constant:</p>
            <MathWrapper formula="\tau = RC" block />
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Voltage Response:</p>
            <MathWrapper formula="v_C(t) = V_s(1 - e^{-t/\tau})" block />
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Current Response:</p>
            <MathWrapper formula="i(t) = \frac{V_s}{R}e^{-t/\tau}" block />
          </div>
        </div>
      )}

      {circuitType === 'RC' && inputType === 'impulse' && (
        <div className="space-y-3">
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border-l-3 border-amber-400 dark:border-amber-500">
            <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">Impulse response h(t) = derivative of step response</p>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Voltage (Impulse Response):</p>
              <MathWrapper formula="v_C(t) = \frac{V_s}{RC}e^{-t/\tau}" block />
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">S-Domain:</p>
              <MathWrapper formula="H(s) = \frac{1/RC}{s + 1/RC}" block />
            </div>
          </div>
        </div>
      )}

      {circuitType === 'RL' && inputType === 'step' && (
        <div className="grid md:grid-cols-3 gap-3">
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Time Constant:</p>
            <MathWrapper formula="\tau = \frac{L}{R}" block />
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Current Response:</p>
            <MathWrapper formula="i(t) = \frac{V_s}{R}(1 - e^{-t/\tau})" block />
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Voltage Response:</p>
            <MathWrapper formula="v_L(t) = V_s e^{-t/\tau}" block />
          </div>
        </div>
      )}

      {circuitType === 'RL' && inputType === 'impulse' && (
        <div className="space-y-3">
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border-l-3 border-amber-400 dark:border-amber-500">
            <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">Impulse response h(t) = derivative of step response</p>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Current (Impulse Response):</p>
              <MathWrapper formula="i(t) = \frac{V_s}{L}e^{-Rt/L}" block />
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">S-Domain:</p>
              <MathWrapper formula="H(s) = \frac{1/L}{s + R/L}" block />
            </div>
          </div>
        </div>
      )}

      {circuitType === 'RLC' && response.alpha && response.omega0 && response.zeta && (
        <div className="space-y-3">
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Characteristic Parameters:</p>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <MathWrapper formula="\alpha = \frac{R}{2L}" />
                <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">= {response.alpha.toFixed(2)} rad/s</span>
              </div>
              <div>
                <MathWrapper formula="\omega_0 = \frac{1}{\sqrt{LC}}" />
                <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">= {response.omega0.toFixed(2)} rad/s</span>
              </div>
              <div>
                <MathWrapper formula="\zeta = \frac{\alpha}{\omega_0}" />
                <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">= {response.zeta.toFixed(3)}</span>
              </div>
            </div>
          </div>

          {inputType === 'impulse' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border-l-3 border-amber-400 dark:border-amber-500">
              <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                Impulse response: <MathWrapper formula="h(t) = \mathcal{L}^{-1}\{H(s)\}" /> — the most fundamental characterization of the system
              </p>
            </div>
          )}

          {response.dampingType === 'underdamped' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Underdamped {inputType === 'impulse' ? 'Impulse' : 'Step'} Response:
              </p>
              {inputType === 'step' ? (
                <MathWrapper formula="v_C(t) = V_s\left(1 - e^{-\alpha t}\left(\cos(\omega_d t) + \frac{\alpha}{\omega_d}\sin(\omega_d t)\right)\right)" block />
              ) : (
                <MathWrapper formula="v_C(t) = \frac{V_s\omega_0^2}{\omega_d}e^{-\alpha t}\sin(\omega_d t)" block />
              )}
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                where <MathWrapper formula="\omega_d = \omega_0\sqrt{1-\zeta^2}" /> = {(response.omega0 * Math.sqrt(1 - response.zeta * response.zeta)).toFixed(2)} rad/s
              </p>
            </div>
          )}

          {response.dampingType === 'critically-damped' && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-l-4 border-green-500">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Critically Damped {inputType === 'impulse' ? 'Impulse' : 'Step'} Response:
              </p>
              {inputType === 'step' ? (
                <MathWrapper formula="v_C(t) = V_s(1 - e^{-\alpha t}(1 + \alpha t))" block />
              ) : (
                <MathWrapper formula="v_C(t) = V_s\omega_0^2 t e^{-\alpha t}" block />
              )}
            </div>
          )}

          {response.dampingType === 'overdamped' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border-l-4 border-amber-500">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Overdamped {inputType === 'impulse' ? 'Impulse' : 'Step'} Response:
              </p>
              {inputType === 'step' ? (
                <>
                  <MathWrapper formula="v_C(t) = V_s + A_1 e^{s_1 t} + A_2 e^{s_2 t}" block />
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">where s&#8321;, s&#8322; are the two distinct real roots; the initial conditions fix the constants (v(0)=0 &rArr; V_s + A&#8321; + A&#8322; = 0); both roots are negative, so the modes decay and v(&infin;) = V_s</p>
                </>
              ) : (
                <MathWrapper formula="v_C(t) = \frac{V_s\omega_0^2}{s_1 - s_2}(e^{s_1 t} - e^{s_2 t})" block />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** RLC circuit analysis sidebar showing damping info and parameters (F24). */
export function RLCAnalysisPanel({ response }: { response: CircuitResponse; timeConstantMs: number }) {
  const { alpha = 0, omega0 = 0, dampingType } = response;
  const slowestTauMs = dampingType === 'overdamped'
    ? 1000 / Math.abs(-alpha + Math.sqrt(alpha * alpha - omega0 * omega0))
    : 1000 / alpha;
  const tauLabel = dampingType === 'overdamped' ? 'Slowest mode τ = 1/|s₁|'
    : dampingType === 'critically-damped' ? 'Decay τ = 1/α'
    : 'Envelope τ = 1/α';
  const tauHint = dampingType === 'overdamped'
    ? 'The slow pole s₁ governs settling: about five of these time constants reach ~99% of the final value — check it against the chart.'
    : dampingType === 'critically-damped'
      ? '(1 + αt)e^{−αt} settles slower than a pure exponential — expect roughly seven time constants to reach 99%.'
      : 'How many envelope time constants until the response reaches ~99% of its final value? Does the simulation confirm about five?';
  return (
    <div className="space-y-3 flex-1">
      <div className={`rounded-lg p-4 ${
        response.dampingType === 'underdamped' ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' :
        response.dampingType === 'critically-damped' ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500' :
        'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500'
      }`}>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Damping Type</p>
        <p className="text-xl font-bold capitalize text-slate-900 dark:text-white mt-0.5">
          {response.dampingType!.replace('-', ' ')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Damping Coefficient &#945;</p>
          <p className="text-lg font-bold text-engineering-blue-700 dark:text-engineering-blue-400 mt-0.5">
            {response.alpha?.toFixed(2)} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">rad/s</span>
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Natural Frequency &#969;&#8320;</p>
          <p className="text-lg font-bold text-engineering-blue-700 dark:text-engineering-blue-400 mt-0.5">
            {response.omega0?.toFixed(2)} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">rad/s</span>
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-1">If you doubled both L and C, what happens to ω₀? Try it.</p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Damping Ratio &#950;</p>
          <p className="text-lg font-bold text-engineering-blue-700 dark:text-engineering-blue-400 mt-0.5">
            {response.zeta?.toFixed(4)}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-1">Is this value in the range you'd expect physically?</p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{tauLabel}</p>
          <p className="text-lg font-bold text-green-700 dark:text-green-400 mt-0.5">
            {slowestTauMs.toFixed(3)} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">ms</span>
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-1">{tauHint}</p>
        </div>

        {response.dampingType === 'underdamped' && response.omega0 && response.zeta && (
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Damped Frequency &#969;<sub>d</sub></p>
            <p className="text-lg font-bold text-engineering-blue-700 dark:text-engineering-blue-400 mt-0.5">
              {(response.omega0 * Math.sqrt(1 - response.zeta * response.zeta)).toFixed(2)} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">rad/s</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/** First-order (RC/RL) analysis sidebar showing time constant info (F24). */
export function FirstOrderAnalysisPanel({ circuitType, response, R, L, C, inputType }: {
  circuitType: CircuitType;
  response: CircuitResponse;
  R: number;
  L: number;
  C: number;
  inputType: InputType;
}) {
  // A first-order impulse response decays to 0 (no final value); at t=τ it sits at
  // e⁻¹ = 36.8% of its PEAK. Step language ("…% of final value") is wrong for it (A.2#6).
  const isImpulse = inputType === 'impulse';
  return (
    <div className="space-y-3 flex-1">
      <div className="bg-engineering-blue-50 dark:bg-engineering-blue-900/20 rounded-lg p-4 border-l-4 border-engineering-blue-500">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Time Constant &#964;</p>
        <p className="text-xl font-bold text-engineering-blue-700 dark:text-engineering-blue-400 mt-0.5">
          {response.timeConstant ? (response.timeConstant * 1000).toFixed(3) : '—'} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">ms</span>
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-1">{isImpulse
          ? 'How many time constants until the response decays to under 1% of its peak value? Does the simulation confirm that?'
          : 'How many time constants until the response reaches 99% of its final value? Does the simulation confirm that?'}</p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Formula</p>
        <div className="mt-1">
          {circuitType === 'RC'
            ? <MathWrapper formula={`\\tau = RC = ${R} \\times ${(C * 1e6).toFixed(1)} \\mu F = ${((R * C) * 1000).toFixed(3)}\\text{ ms}`} />
            : <MathWrapper formula={`\\tau = \\frac{L}{R} = \\frac{${(L * 1000).toFixed(1)}\\text{ mH}}{${R}\\;\\Omega} = ${((L / R) * 1000).toFixed(3)}\\text{ ms}`} />
          }
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">At t = &#964;</p>
        <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
          Response {isImpulse ? 'decays to ' : 'reaches '}
          <span className="font-semibold text-engineering-blue-700 dark:text-engineering-blue-400">{isImpulse ? '36.8%' : '63.2%'}</span>
          {isImpulse ? ' of peak value' : ' of final value'}
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">At t = 5&#964;</p>
        <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
          Response {isImpulse ? 'decays to ' : 'reaches '}
          <span className="font-semibold text-engineering-blue-700 dark:text-engineering-blue-400">{isImpulse ? '0.7%' : '99.3%'}</span>
          {isImpulse ? ' of peak (≈ fully decayed)' : ' of final value (steady state)'}
        </p>
      </div>
    </div>
  );
}

const CIRCUIT_TYPES: CircuitType[] = ['RC', 'RL', 'RLC'];
const INPUT_TYPES: InputType[] = ['step', 'impulse'];



export function InteractiveLab() {
  const [searchParams] = useSearchParams();

  const [circuitType, setCircuitType] = useState<CircuitType>(() =>
    parseEnum(searchParams.get('circuit'), CIRCUIT_TYPES, 'RLC'));
  const [inputType, setInputType] = useState<InputType>(() =>
    parseEnum(searchParams.get('input'), INPUT_TYPES, 'step'));
  const [R, setR] = useState(() => clampNum(searchParams.get('R'), 1, 10000, 100));
  const [L, setL] = useState(() => clampNum(searchParams.get('L'), 0.001, 1, 0.1));
  const [C, setC] = useState(() => clampNum(searchParams.get('C'), 1e-6, 1e-3, 0.0001));
  const [voltage, setVoltage] = useState(() => clampNum(searchParams.get('V'), 1, 50, 10));
  const [duration, setDuration] = useState(0.01);
  const [autoDuration, setAutoDuration] = useState(false);
  const [showCurrent, setShowCurrent] = useState(true);
  const [showVoltage, setShowVoltage] = useState(true);
  const [showSDomain, setShowSDomain] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // Sync state → URL params (debounced via useDeferredValue)
  const dRForUrl = useDeferredValue(R);
  const dLForUrl = useDeferredValue(L);
  const dCForUrl = useDeferredValue(C);
  const dVForUrl = useDeferredValue(voltage);
  useUrlSync({ circuit: circuitType, input: inputType, R: dRForUrl, L: dLForUrl, C: dCForUrl, V: dVForUrl });

  const { copyLink: handleCopyLink, linkCopied } = useCopyLink();
  const handleDownloadChart = useChartExport(chartRef, `${circuitType}-${inputType}-response`);

  const isDark = useThemeStore((s) => s.theme) === 'dark';
  const markVisited = useProgressStore((s) => s.markVisited);
  const markPredictionGate = useProgressStore((s) => s.markPredictionGate);
  const incrementConceptChecks = useProgressStore((s) => s.incrementConceptChecks);
  const incrementHints = useProgressStore((s) => s.incrementHints);
  useEffect(() => { markVisited('interactive-lab'); }, [markVisited]);
  const chartColors = {
    grid: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#cbd5e1' : '#475569',
    legend: isDark ? '#e2e8f0' : '#334155',
  };

  // Defer slider values so chart doesn't re-render on every pixel of drag
  const dR = useDeferredValue(R);
  const dL = useDeferredValue(L);
  const dC = useDeferredValue(C);
  const dV = useDeferredValue(voltage);

  // Compute the time constant for the current circuit
  const timeConstant = useMemo(() => {
    if (circuitType === 'RC') return dR * dC;
    if (circuitType === 'RL') return dL / dR;
    return (2 * dL) / dR;
  }, [circuitType, dR, dL, dC]);

  // R_crit for RLC: R = 2*sqrt(L/C)
  const rCrit = useMemo(() => {
    if (circuitType === 'RLC') return 2 * Math.sqrt(dL / dC);
    return null;
  }, [circuitType, dL, dC]);

  // Auto-duration: 5*tau, clamped to [1ms, 100ms]
  const effectiveDuration = useMemo(() => {
    if (autoDuration) {
      return Math.max(0.001, Math.min(0.1, 5 * timeConstant));
    }
    return duration;
  }, [autoDuration, timeConstant, duration]);

  const response = useMemo(() => {
    return calculateCircuitResponse(
      circuitType,
      { R: dR, L: dL, C: dC, voltage: dV },
      effectiveDuration / 1000,
      effectiveDuration,
      inputType
    );
  }, [circuitType, dR, dL, dC, dV, effectiveDuration, inputType]);

  const chartData = useMemo(() => {
    return response.data.map((point) => ({
      time: point.time * 1000,
      voltage: point.voltage,
      current: point.current * 1000,
    }));
  }, [response.data]);

  const timeConstantMs = timeConstant * 1000;

  // Damping-aware marker: overdamped RLC uses the slowest-mode constant so the
  // chart marker matches RLCAnalysisPanel's "Slowest mode τ" number (P-03).
  const tauMarkerMs = useMemo(
    () => chartTauMarkerMs(circuitType, response, timeConstantMs),
    [circuitType, response, timeConstantMs],
  );
  const tauMarkerLabel = circuitType === 'RLC' && response.dampingType === 'overdamped'
    ? 'τ (slowest)'
    : 'τ';

  const dampedPeriodMs = useMemo(() => {
    if (circuitType === 'RLC' && response.dampingType === 'underdamped' && response.omega0 && response.zeta) {
      const omegaD = response.omega0 * Math.sqrt(1 - response.zeta * response.zeta);
      return (2 * Math.PI / omegaD) * 1000;
    }
    return null;
  }, [circuitType, response]);

  // Transfer function data for S-Domain panel (RLC only)
  const transferFunction = useMemo(() => {
    if (circuitType !== 'RLC') return null;
    const tf = calculateTransferFunction(dR, dL, dC);
    const alpha = dR / (2 * dL);
    const omega0 = 1 / Math.sqrt(dL * dC);
    const zeta = alpha / omega0;
    return { ...tf, alpha, omega0, zeta };
  }, [circuitType, dR, dL, dC]);

  const challenges = useMemo(() =>
    getChallenges({ circuitType, inputType, R: dR, L: dL, C: dC }),
    [circuitType, inputType, dR, dL, dC],
  );

  // The damping gate grades against classifyDamping(response.zeta), so the gate
  // must re-lock exactly when that classification changes — and only then. Keying
  // on raw R/L/C buckets re-locked needlessly within a category AND, worse, could
  // keep a stale "Correct!" when a parameter tweak crossed the ζ=1 boundary inside
  // the same bucket. Key on the verdict itself, using the SAME ζ the gate reads.
  const predictionResetKey = useMemo(
    () => (response.zeta !== undefined ? classifyDamping(response.zeta) : 'n/a'),
    [response.zeta],
  );

  const handleReset = useCallback(() => {
    setR(100);
    setL(0.1);
    setC(0.0001);
    setVoltage(10);
    setDuration(0.01);
    setAutoDuration(false);
  }, []);

  const predictionGateOptions = [
    {
      id: 'overdamped',
      label: 'Overdamped',
      visual: (
        <svg viewBox="0 0 120 60" className="w-full h-12">
          <path d="M 5 55 Q 30 55 50 20 Q 65 8 80 6 L 115 5" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-600 dark:text-slate-300" />
          <line x1="5" y1="5" x2="115" y2="5" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" className="text-slate-300 dark:text-slate-600" />
        </svg>
      ),
    },
    {
      id: 'critically-damped',
      label: 'Critically damped',
      visual: (
        <svg viewBox="0 0 120 60" className="w-full h-12">
          <path d="M 5 55 Q 20 55 35 10 Q 45 3 60 5 L 115 5" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-600 dark:text-slate-300" />
          <line x1="5" y1="5" x2="115" y2="5" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" className="text-slate-300 dark:text-slate-600" />
        </svg>
      ),
    },
    {
      id: 'underdamped',
      label: 'Underdamped',
      visual: (
        <svg viewBox="0 0 120 60" className="w-full h-12">
          <path d="M 5 55 Q 15 55 22 -5 Q 28 -5 35 12 Q 42 25 48 2 Q 54 -5 60 8 Q 66 15 72 4 Q 78 0 85 5 L 115 5" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-600 dark:text-slate-300" />
          <line x1="5" y1="5" x2="115" y2="5" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" className="text-slate-300 dark:text-slate-600" />
        </svg>
      ),
    },
  ];

  /** Chart + analysis panel rendered as ROW 3 */
  const chartAndAnalysis = (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      {/* Left: Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Response Visualization</h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              inputType === 'step' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
            }`}>
              {inputType === 'step' ? 'Step Input u(t)' : 'Impulse Input \u03B4(t)'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showVoltage} onChange={(e) => setShowVoltage(e.target.checked)} className="w-4 h-4 accent-blue-500" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Voltage</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showCurrent} onChange={(e) => setShowCurrent(e.target.checked)} className="w-4 h-4 accent-red-500" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Current</span>
              </label>
            </div>
            <div className="flex gap-1.5 border-l border-slate-200 dark:border-slate-600 pl-3">
              <button
                onClick={handleDownloadChart}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Download chart as PNG"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopyLink}
                className={`p-1.5 rounded-md transition-colors ${
                  linkCopied
                    ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title={linkCopied ? 'Link copied!' : 'Copy shareable link'}
              >
                <Link2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div ref={chartRef}>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis dataKey="time" tick={{ fill: chartColors.text }} label={{ value: 'Time (ms)', position: 'insideBottom', offset: -5, fill: chartColors.text }} />
            <YAxis tick={{ fill: chartColors.text }} label={{ value: responseYAxisLabel(inputType), angle: -90, position: 'insideLeft', fill: chartColors.text }} />
            <Tooltip content={({ payload, label }) => <ResponseChartTooltip payload={payload as unknown as Array<{ color?: string; name?: string; value?: string | number }>} label={label} />} />
            <Legend wrapperStyle={{ color: chartColors.legend }} />
            {/* Time constant marker \u2014 damping-aware for RLC (P-03) */}
            {tauMarkerMs <= effectiveDuration * 1000 && (
              <ReferenceLine
                x={tauMarkerMs}
                stroke="#16a34a"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                label={{ value: tauMarkerLabel, position: 'top', fill: '#16a34a', fontWeight: 'bold', fontSize: 14 }}
              />
            )}
            {/* Damped period marker for underdamped RLC */}
            {dampedPeriodMs && dampedPeriodMs <= effectiveDuration * 1000 && (
              <ReferenceLine
                x={dampedPeriodMs}
                stroke="#7c3aed"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                label={{ value: 'T\u1D48', position: 'top', fill: '#7c3aed', fontWeight: 'bold', fontSize: 13 }}
              />
            )}
            {showVoltage && (
              <Line type="monotone" dataKey="voltage" stroke="#3b82f6" name="Voltage" dot={false} strokeWidth={2} animationDuration={500} animationEasing="ease-out" />
            )}
            {showCurrent && (
              <Line type="monotone" dataKey="current" stroke="#ef4444" name="Current" dot={false} strokeWidth={2} animationDuration={500} animationEasing="ease-out" />
            )}
          </LineChart>
        </ResponsiveContainer>
        </div>
      </div>

      {/* Right: Analysis panel */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 flex flex-col">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Circuit Analysis</h2>

        {circuitType === 'RLC' && response.dampingType && (
          <RLCAnalysisPanel response={response} timeConstantMs={timeConstantMs} />
        )}

        {(circuitType === 'RC' || circuitType === 'RL') && (
          <FirstOrderAnalysisPanel circuitType={circuitType} response={response} R={R} L={L} C={C} inputType={inputType} />
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <SectionHook text="In 1926, the same mathematics used here predicted that a radio receiver's selectivity depended on the Q factor of its tank circuit. Engineers have been tuning poles ever since." />

      <div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
          <span className="font-mono text-3xl text-engineering-blue-600 dark:text-engineering-blue-400 mr-2">
            {getSectionNumber('interactive-lab')}
          </span>
          Interactive Lab
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Real-time circuit simulation and visualization
        </p>
      </div>

      <FigureImage
        className="mb-6"
        src={`${import.meta.env.BASE_URL}figures/digital-multimeter.jpg`}
        alt="Digital multimeter on a lab bench"
        caption="A digital multimeter: the interactive lab below simulates the same measurements you'd make with real instruments."
        attribution="André Karwath (Aka), CC BY-SA 2.5 — Wikimedia Commons"
        sourceUrl="https://commons.wikimedia.org/wiki/File:Digital_Multimeter_Aka.jpg"
      />

      {/* Circuit type tabs + input type toggle */}
      <div className="flex items-center justify-between border-b-2 border-slate-200 dark:border-slate-700">
        <div className="flex">
          {(['RC', 'RL', 'RLC'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setCircuitType(type)}
              className={`px-6 py-3 font-semibold text-sm transition-colors border-b-3 -mb-[2px] ${
                circuitType === type
                  ? 'border-engineering-blue-600 text-engineering-blue-700 dark:text-engineering-blue-400 bg-engineering-blue-50 dark:bg-engineering-blue-900/20'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {type} Circuit
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 mr-2">
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 mr-2 font-medium">Input:</span>
            {(['step', 'impulse'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setInputType(type)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors capitalize ${
                  inputType === type
                    ? 'bg-engineering-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {type === 'step' ? 'Step u(t)' : 'Impulse \u03B4(t)'}
              </button>
            ))}
          </div>
          {circuitType === 'RLC' && (
            <button
              onClick={() => setShowSDomain(!showSDomain)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                showSDomain
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              S-Domain
            </button>
          )}
        </div>
      </div>

      {/* Getting started banner + guided challenges */}
      {challenges.length > 0 && (() => {
        const completed = challenges.filter(c => c.check?.()).length;
        const checkable = challenges.filter(c => c.check).length;
        return (
          <>
            <div className="bg-engineering-blue-50 dark:bg-engineering-blue-900/20 border border-engineering-blue-200 dark:border-engineering-blue-800 rounded-lg px-4 py-3 text-sm text-engineering-blue-800 dark:text-engineering-blue-200">
              Select a circuit type above, adjust the sliders, and work through the guided challenges below.
            </div>
            <CollapsibleSection
              title={checkable > 0 ? `Try This (${completed}/${checkable} completed)` : 'Try This'}
              defaultOpen={true}
              variant="inline"
              className="space-y-3"
            >
              <div className="grid sm:grid-cols-2 gap-3 px-1">
                {challenges.map(challenge => (
                  <ChallengeCard key={challenge.id} challenge={challenge} />
                ))}
              </div>
            </CollapsibleSection>
          </>
        );
      })()}

      {/* ROW 1: Config + Circuit Diagram (2-col) */}
      <div className="grid lg:grid-cols-2 gap-6">
        <CircuitParameterSliders
          R={R} L={L} C={C}
          onR={setR} onL={setL} onC={setC}
          circuitType={circuitType}
          voltage={{ value: voltage, onChange: setVoltage }}
          duration={{ effectiveDuration, autoDuration, duration, onAutoDurationChange: setAutoDuration, onDurationChange: setDuration }}
          onReset={handleReset}
          rCrit={rCrit}
        />

        {/* Right: Circuit diagram */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">{circuitType} Circuit Diagram</h2>
          <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-700 rounded-lg p-4 border border-slate-100 dark:border-slate-600">
            <CircuitDiagram type={circuitType} R={R} L={L} C={C} voltage={voltage} />
          </div>
        </div>
      </div>

      {/* ROW 2: Equations (collapsible) */}
      <CollapsibleSection title="Circuit Equations" defaultOpen={true}>
        <CircuitEquations circuitType={circuitType} inputType={inputType} response={response} />
      </CollapsibleSection>

      {/* S-Domain Panel (RLC only, toggled) */}
      {showSDomain && transferFunction && response.dampingType && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">S-Domain Analysis</h3>
          <SDomainPanel
            poles={transferFunction.poles}
            numerator={transferFunction.numerator}
            denominator={transferFunction.denominator}
            alpha={transferFunction.alpha}
            omega0={transferFunction.omega0}
            zeta={transferFunction.zeta}
            dampingType={dampingLabel(response.dampingType)}
            chartColors={chartColors}
            onPredict={(correct) => markPredictionGate('interactive-lab-sdomain', correct)}
          />
        </div>
      )}

      {/* ROW 3: Chart + Analysis side by side */}
      {circuitType === 'RLC' && inputType === 'step' && response.zeta !== undefined ? (
        <PredictionGate
          // resetKey re-locks this gate on parameter changes; Skip is the designed one-click escape for a student who already predicted
          allowSkip
          question="With the current R, L, C values, what do you expect the step response to look like?"
          options={predictionGateOptions}
          getCorrectAnswer={() => classifyDamping(response.zeta!)}
          explanation={
            <div className="space-y-1">
              <MathWrapper
                formula={`\\zeta = \\frac{R}{2\\sqrt{L/C}} = \\frac{${dR}}{2\\sqrt{${dL}/${dC}}} = ${response.zeta!.toFixed(4)}`}
                block
              />
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {response.zeta! < 1 ? 'ζ < 1 → underdamped (oscillation)' : response.zeta! > 1 ? 'ζ > 1 → overdamped (no oscillation)' : 'ζ ≈ 1 → critically damped (fastest, no overshoot)'}
              </p>
            </div>
          }
          resetKey={predictionResetKey}
          onPredict={(correct) => markPredictionGate('interactive-lab', correct)}
        >
          {chartAndAnalysis}
        </PredictionGate>
      ) : (
        chartAndAnalysis
      )}

      {/* Concept check */}
      {circuitType === 'RLC' && (
        <ConceptCheck data={{
          mode: 'multiple-choice',
          question: 'If you increase R from underdamped to overdamped, does the steady-state capacitor voltage change?',
          options: [
            { text: 'No — steady-state voltage stays at Vs', correct: true, explanation: 'Correct! At DC steady state, the capacitor is fully charged and no current flows. The voltage drop across R is zero regardless of R, so V_C = V_s always. R only affects how the circuit gets there (oscillation vs. smooth approach).' },
            { text: 'Yes — higher R means lower steady-state voltage', correct: false, explanation: 'At steady state, current is zero. With no current, there\'s no voltage drop across R (V_R = IR = 0), so all the source voltage appears across the capacitor: V_C = V_s.' },
            { text: 'Yes — higher R means higher steady-state voltage', correct: false, explanation: 'The steady-state voltage is always V_s for a step response, independent of R. Try it with the sliders to verify!' },
          ],
        }}
          onComplete={() => incrementConceptChecks('interactive-lab')}
          onHint={() => incrementHints('interactive-lab')}
        />
      )}

      {/* Tips (collapsible, default closed to reduce scroll) */}
      <CollapsibleSection
        title="Experiment Tips"
        defaultOpen={false}
        className="bg-gradient-to-r from-engineering-blue-50 to-slate-50 dark:from-engineering-blue-900/20 dark:to-slate-800 border-l-4 border-engineering-blue-600"
      >
        <ul className="space-y-2 text-slate-700 dark:text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-engineering-blue-600 font-bold mt-1">&#8226;</span>
            <span><strong>RC Circuits:</strong> Increase R or C to slow down the response. The voltage across the capacitor rises exponentially.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-engineering-blue-600 font-bold mt-1">&#8226;</span>
            <span><strong>RL Circuits:</strong> Increase L or decrease R to slow the current rise. The inductor opposes rapid changes in current.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-engineering-blue-600 font-bold mt-1">&#8226;</span>
            <span><strong>RLC Circuits:</strong> Adjust R to change damping. Low R gives oscillations (underdamped), high R eliminates them (overdamped). The green R<sub>crit</sub> marker on the slider shows where critical damping occurs.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-engineering-blue-600 font-bold mt-1">&#8226;</span>
            <span>The dashed green line on the chart marks the governing time constant &#964; (the slowest mode, when the RLC circuit is overdamped). For underdamped RLC, the purple line marks one damped period T<sub>d</sub>.</span>
          </li>
        </ul>
      </CollapsibleSection>

      <CourseNavigation />
    </div>
  );
}
