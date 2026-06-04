import { Settings2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@shared/utils/cn';

interface ControlPanelProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function ControlPanel({ title, children, className }: ControlPanelProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm',
        className
      )}
    >
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-3 mb-4">
        <Settings2 size={16} />
        <h3 className="text-xs font-bold uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  );
}
