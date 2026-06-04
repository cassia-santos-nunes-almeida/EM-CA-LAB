import type { ReactNode } from 'react';
import { Lightbulb } from 'lucide-react';
import { cn } from '@shared/utils/cn';

/** Props for the SectionHook component that displays a real-world context card at the top of each section. */
interface SectionHookProps {
  /** The hook text to display */
  text: string;
  /** Optional icon override (defaults to Lightbulb) */
  icon?: ReactNode;
  /** Additional CSS class names */
  className?: string;
}

export function SectionHook({ text, icon, className }: SectionHookProps) {
  return (
    <div className={cn(
      'bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg',
      className,
    )}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          {icon ?? <Lightbulb className="w-4 h-4 text-amber-500 dark:text-amber-400" />}
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
            Why This Matters
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}
