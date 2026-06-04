import { Lightbulb } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@shared/utils/cn';

interface HintBoxProps {
  children: ReactNode;
  className?: string;
}

export function HintBox({ children, className }: HintBoxProps) {
  return (
    <div
      className={cn(
        'mt-4 flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800',
        className
      )}
    >
      <Lightbulb size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{children}</p>
    </div>
  );
}
