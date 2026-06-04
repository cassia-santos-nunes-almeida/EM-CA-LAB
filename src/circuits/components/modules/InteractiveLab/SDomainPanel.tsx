import { useMemo } from 'react';
import { MathWrapper } from '@shared/components/common/MathWrapper';
import { PoleTooltip } from '@circuits/components/common/CircuitCharts';
import { PredictionGate } from '@shared/components/common/PredictionGate';
import type { Complex } from '@circuits/types/circuit';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';

interface SDomainPanelProps {
  poles: Complex[];
  numerator: number[];
  denominator: number[];
  alpha: number;
  omega0: number;
  zeta: number;
  dampingType: string;
  chartColors: { grid: string; text: string; legend: string };
  onPredict?: (correct: boolean) => void;
}

export function SDomainPanel({
  poles, numerator, denominator,
  alpha, omega0, zeta, dampingType, chartColors, onPredict,
}: SDomainPanelProps) {
  const poleData = poles.map((pole, idx) => ({
    x: pole.real,
    y: pole.imag,
    name: `Pole ${idx + 1}`,
  }));

  const poleResetKey = useMemo(() =>
    poles.map(p => `${p.real.toFixed(1)},${p.imag.toFixed(1)}`).join('|'),
    [poles],
  );

  const getCorrectPoleAnswer = () => {
    const allReal = poles.every(p => Math.abs(p.imag) < 0.01);
    if (allReal) return 'real-axis';
    return 'complex-conjugate';
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left: Transfer function + parameters */}
      <div className="space-y-4">
        <div className="bg-engineering-blue-50 dark:bg-engineering-blue-900/20 p-4 rounded-lg">
          <MathWrapper
            formula={`H(s) = \\frac{${numerator[0].toFixed(0)}}{s^2 + ${denominator[1].toFixed(2)}s + ${denominator[2].toFixed(0)}}`}
            block
          />
        </div>

        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Characteristic Parameters:</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <MathWrapper formula="\alpha = \frac{R}{2L}" />
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">= {alpha.toFixed(2)} rad/s</p>
            </div>
            <div>
              <MathWrapper formula="\omega_0 = \frac{1}{\sqrt{LC}}" />
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">= {omega0.toFixed(2)} rad/s</p>
            </div>
            <div>
              <MathWrapper formula="\zeta = \frac{\alpha}{\omega_0}" />
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">= {zeta.toFixed(3)}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-1">Is this value in the range you'd expect physically?</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Pole Locations:</p>
          <div className="space-y-1">
            {poles.map((pole, idx) => (
              <p key={idx} className="text-sm text-slate-700 dark:text-slate-300">
                s<sub>{idx + 1}</sub> = {pole.real.toFixed(2)}
                {pole.imag !== 0 && ` ${pole.imag > 0 ? '+' : ''}${pole.imag.toFixed(2)}j`}
              </p>
            ))}
          </div>
        </div>

        <div className={`rounded-lg p-4 ${
          dampingType === 'Underdamped' ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' :
          dampingType === 'Overdamped' ? 'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500' :
          'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500'
        }`}>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Damping Type</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{dampingType}</p>
        </div>

        {/* Stability indicator */}
        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border-l-4 border-amber-500">
          <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-1">Stability:</h4>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {poles.every(p => p.real < 0) ? (
              <span className="text-green-700 dark:text-green-400 font-semibold">
                ✓ STABLE — all poles in left half-plane
              </span>
            ) : (
              <span className="text-red-700 dark:text-red-400 font-semibold">
                ✗ UNSTABLE — poles in right half-plane
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Right: Pole-Zero Map — gated by prediction */}
      <PredictionGate
        question="Given this transfer function, where do you expect the poles to be?"
        options={[
          { id: 'real-axis', label: 'Real axis only' },
          { id: 'complex-conjugate', label: 'Complex conjugate pairs' },
          { id: 'at-origin', label: 'At the origin' },
        ]}
        getCorrectAnswer={getCorrectPoleAnswer}
        explanation={
          <div className="text-sm text-slate-700 dark:text-slate-300">
            <p>The poles are at:</p>
            {poles.map((pole, idx) => (
              <p key={idx} className="ml-2">
                s<sub>{idx + 1}</sub> = {pole.real.toFixed(2)}
                {pole.imag !== 0 && ` ${pole.imag > 0 ? '+' : ''}${pole.imag.toFixed(2)}j`}
              </p>
            ))}
          </div>
        }
        resetKey={poleResetKey}
        onPredict={onPredict}
      >
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">S-Plane Pole-Zero Map</h3>
        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
              <XAxis
                type="number"
                dataKey="x"
                name="Real"
                tick={{ fill: chartColors.text }}
                label={{ value: 'Real Axis (\u03C3)', position: 'insideBottom', offset: -10, fill: chartColors.text }}
                domain={['auto', 'auto']}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Imaginary"
                tick={{ fill: chartColors.text }}
                label={{ value: 'Imaginary Axis (j\u03C9)', angle: -90, position: 'insideLeft', fill: chartColors.text }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ payload }) => <PoleTooltip payload={payload as unknown as Array<{ payload: { name: string; x: number; y: number } }>} />}
              />
              <ReferenceLine x={0} stroke="#64748b" strokeWidth={2} />
              <ReferenceLine y={0} stroke="#64748b" strokeWidth={2} />
              <Scatter
                name="Poles"
                data={poleData}
                fill="#ef4444"
                shape="cross"
                line={false}
                animationDuration={400}
              />
            </ScatterChart>
          </ResponsiveContainer>
          <p className="text-xs text-center text-slate-600 dark:text-slate-400 mt-2">
            Red ✕ marks indicate pole locations
          </p>
        </div>
      </div>
      </PredictionGate>
    </div>
  );
}
