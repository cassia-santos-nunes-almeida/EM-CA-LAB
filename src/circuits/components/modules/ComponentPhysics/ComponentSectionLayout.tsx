import type { ReactNode } from 'react';
import { CollapsibleSection } from '@shared/components/common/CollapsibleSection';

/** Shared two-column layout for component sections (F13/F14). */
export function ComponentSectionLayout({ theory, materialsTitle, materials, interactive }: {
  theory: ReactNode;
  materialsTitle: string;
  materials: ReactNode;
  interactive: ReactNode;
}) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <section className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">{theory}</section>
        <CollapsibleSection title={materialsTitle} defaultOpen={false}>
          {materials}
        </CollapsibleSection>
      </div>
      <div className="space-y-6">
        <section className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">{interactive}</section>
      </div>
    </div>
  );
}
