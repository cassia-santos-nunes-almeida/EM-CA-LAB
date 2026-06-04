import { Info } from 'lucide-react';
import type { ReactNode } from 'react';

interface TheoryGuideProps {
  children: ReactNode;
}

/** Reusable Theory Guide panel used in every module's control panel */
export function TheoryGuide({ children }: TheoryGuideProps) {
  return (
    <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 text-sm space-y-3">
      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-600 pb-2">
        <Info size={16} />
        <h4 className="font-bold">Theory Guide</h4>
      </div>
      <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">{children}</div>
    </div>
  );
}
