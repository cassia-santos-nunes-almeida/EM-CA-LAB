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
}

interface PhysicsChartProps {
  title: string;
  data: Record<string, number | string>[];
  xKey: string;
  xLabel: string;
  yLabel: string;
  lines: ChartLine[];
}

export function PhysicsChart({ title, data, xKey, xLabel, yLabel, lines }: PhysicsChartProps) {
  const isDarkMode = useThemeStore((s) => s.theme === 'dark');
  const textColor = isDarkMode ? '#94a3b8' : '#64748b';
  const gridColor = isDarkMode ? '#334155' : '#e2e8f0';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 10, fill: textColor }}
            label={{ value: xLabel, position: 'insideBottom', offset: -10, fontSize: 11, fill: textColor }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: textColor }}
            label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 5, fontSize: 11, fill: textColor }}
          />
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
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
