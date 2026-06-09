import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useThemeStore } from '@shared/store/progressStore';

interface ChartLine {
  dataKey: string;
  color: string;
  name: string;
  axis?: 'left' | 'right';   // default 'left'
}

interface PhysicsChartProps {
  title: string;
  data: Record<string, number | string>[];
  xKey: string;
  xLabel: string;
  yLabel: string;
  lines: ChartLine[];
  xType?: 'number' | 'category';                 // default 'category' (preserves current behavior)
  xDomain?: [number | string, number | string];
  yScale?: 'linear' | 'log';                      // default 'linear'
  yDomain?: [number | string, number | string];
  y2Label?: string;                               // presence enables a right axis
  y2Scale?: 'linear' | 'log';
}

export function PhysicsChart({
  title,
  data,
  xKey,
  xLabel,
  yLabel,
  lines,
  xType = 'category',
  xDomain,
  yScale = 'linear',
  yDomain,
  y2Label,
  y2Scale = 'linear',
}: PhysicsChartProps) {
  const isDarkMode = useThemeStore((s) => s.theme === 'dark');
  const textColor = isDarkMode ? '#94a3b8' : '#64748b';
  const gridColor = isDarkMode ? '#334155' : '#e2e8f0';

  return (
    <div className="bg-card rounded-xl border border-card-border p-4 shadow-sm">
      <h3 className="text-sm font-bold text-title mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey={xKey}
            type={xType}
            {...(xType === 'number' ? { domain: xDomain ?? ['dataMin', 'dataMax'], allowDecimals: true } : {})}
            tick={{ fontSize: 10, fill: textColor }}
            label={{ value: xLabel, position: 'insideBottom', offset: -10, fontSize: 11, fill: textColor }}
          />
          <YAxis
            yAxisId="left"
            scale={yScale}
            {...(yScale === 'log' ? { allowDataOverflow: true } : {})}
            {...(yDomain ? { domain: yDomain } : yScale === 'log' ? { domain: ['auto', 'auto'] } : {})}
            tick={{ fontSize: 10, fill: textColor }}
            label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 5, fontSize: 11, fill: textColor }}
          />
          {y2Label && (
            <YAxis
              yAxisId="right"
              orientation="right"
              scale={y2Scale}
              tick={{ fontSize: 10, fill: textColor }}
              label={{ value: y2Label, angle: 90, position: 'insideRight', offset: 5, fontSize: 11, fill: textColor }}
            />
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: isDarkMode ? '#1e293b' : '#fff',
              border: `1px solid ${gridColor}`,
              borderRadius: '8px',
              fontSize: '11px',
              color: isDarkMode ? '#e2e8f0' : '#1e293b',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color}
              name={line.name}
              yAxisId={line.axis === 'right' && y2Label ? 'right' : 'left'}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
