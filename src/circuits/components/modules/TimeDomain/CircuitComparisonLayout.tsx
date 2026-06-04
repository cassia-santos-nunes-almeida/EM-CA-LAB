import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';

/** Shared layout for the time-domain vs s-domain comparison sections (F16). */
export function CircuitComparisonLayout({ timeContent, sContent, conclusion }: {
  timeContent: ReactNode;
  sContent: ReactNode;
  conclusion: ReactNode;
}) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-800 rounded-lg shadow-md p-6 border-l-4 border-blue-500">
        <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Time-Domain Approach</h3>
        <div className="space-y-4">{timeContent}</div>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-slate-800 rounded-lg shadow-md p-6 border-l-4 border-purple-500">
        <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">S-Domain Approach</h3>
        <div className="space-y-4">{sContent}</div>
      </div>

      <div className="col-span-full bg-green-50 dark:bg-green-900/20 rounded-lg shadow-md p-6 border-l-4 border-green-500">
        <div className="flex items-center gap-3 mb-3">
          <ArrowRight className="w-6 h-6 text-green-600 dark:text-green-400" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Conclusion</h3>
        </div>
        {conclusion}
      </div>
    </div>
  );
}
