import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, ReferenceLine, ReferenceDot,
} from 'recharts';
import { useThemeStore } from '@shared/store/progressStore';
import {
  MAX_POWER_POINTS,
  LOAD_TABLE,
  R_TH,
  P_MAX,
} from '@circuits/components/modules/CircuitTheorems/theoremData';

/**
 * Precomputed P_L(R_L) sweep for the 12 V / 2 Ω Thevenin source, with the
 * matched-load peak marked and the four catalog loads shown as instrument pips.
 */
export function MaxPowerChart() {
  const isDark = useThemeStore((s) => s.theme) === 'dark';
  const chartColors = {
    grid: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#cbd5e1' : '#475569',
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={MAX_POWER_POINTS} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
          <XAxis
            dataKey="r"
            type="number"
            domain={[0, 10]}
            tickCount={11}
            tick={{ fill: chartColors.text }}
            label={{ value: 'Load resistance R_L (Ω)', position: 'insideBottom', offset: -5, fill: chartColors.text }}
          />
          <YAxis
            domain={[0, 20]}
            tick={{ fill: chartColors.text }}
            label={{ value: 'Load power P_L (W)', angle: -90, position: 'insideLeft', fill: chartColors.text }}
          />
          <ReferenceLine
            x={R_TH}
            stroke="#16a34a"
            strokeWidth={1.5}
            strokeDasharray="6 3"
            label={{ value: 'R_L = R_th', position: 'top', fill: '#16a34a', fontSize: 12 }}
          />
          <Line type="monotone" dataKey="p" stroke="#3b82f6" dot={false} strokeWidth={2} animationDuration={400} />
          {LOAD_TABLE.map((row) => (
            <ReferenceDot key={row.r} x={row.r} y={row.p} r={4} fill="#f59e0b" stroke="#fff" strokeWidth={1.5} />
          ))}
          <ReferenceDot
            x={R_TH}
            y={P_MAX}
            r={5}
            fill="#16a34a"
            stroke="#fff"
            strokeWidth={1.5}
            label={{ value: '18 W', position: 'right', fill: '#16a34a', fontSize: 12, fontWeight: 'bold' }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-sm text-muted mt-1">
        Load power against load resistance for the 12 V / 2 Ω source: the curve rises, peaks at
        exactly R_L = R_th = 2 Ω with 18 W, then falls — the four amber pips are the catalog loads.
      </p>
    </div>
  );
}
