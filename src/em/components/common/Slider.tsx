import { cn } from '@shared/utils/cn';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  color?: string;
  onChange: (value: number) => void;
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  color = 'bg-indigo-600',
  onChange,
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </label>
        <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200">
          {typeof value === 'number' ? (Number.isInteger(step) ? value : value.toFixed(1)) : value}
          {unit}
        </span>
      </div>
      <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn('absolute h-full rounded-full transition-all', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full -mt-2 opacity-0 cursor-pointer h-6"
        aria-label={label}
      />
    </div>
  );
}
