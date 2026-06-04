import { useEffect, type ReactNode } from 'react';
import { SectionHook } from '@shared/components/common/SectionHook';
import { TableOfContents } from '@shared/components/common/TableOfContents';
import { CourseNavigation } from '@shared/components/common/CourseNavigation';
import { useProgressStore } from '@shared/store/progressStore';
import { MODULES } from '@em/constants/physics';

interface TocEntry {
  id: string;
  label: string;
}

interface SectionLayoutProps {
  /** Section id — matches the MODULES id; used for markVisited + prev/next nav. */
  sectionId: string;
  /** "Why This Matters" hook text (replaces the old RealWorldHook). */
  hook: string;
  /** Optional heading. Defaults to the MODULES label for this section. */
  title?: string;
  /** Optional subheading. Defaults to the MODULES description. */
  subtitle?: ReactNode;
  /** Optional jump-to-section pills. */
  toc?: TocEntry[];
  /** Optional icon override for the hook card. */
  hookIcon?: ReactNode;
  /** Section body: interleaved theory, simulations, and inline ConceptChecks. */
  children: ReactNode;
}

/**
 * Linear section shell (replaces the tabbed ModuleLayout). Renders, top to
 * bottom: SectionHook → optional TableOfContents → body → ModuleNavigation, and
 * records the visit on mount. See docs/m1-section-migration-spec.md §2.3.
 */
export function SectionLayout({
  sectionId,
  hook,
  title,
  subtitle,
  toc,
  hookIcon,
  children,
}: SectionLayoutProps) {
  const markVisited = useProgressStore((s) => s.markVisited);

  useEffect(() => {
    markVisited(sectionId);
  }, [markVisited, sectionId]);

  const moduleDef = MODULES.find((m) => m.id === sectionId);
  const heading = title ?? moduleDef?.label ?? '';
  const sub = subtitle ?? moduleDef?.description;

  return (
    <div className="space-y-6">
      <SectionHook text={hook} icon={hookIcon} />

      {heading && (
        <header>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{heading}</h1>
          {sub && <p className="mt-1 text-slate-600 dark:text-slate-400">{sub}</p>}
        </header>
      )}

      {toc && toc.length > 0 && <TableOfContents items={toc} />}

      {children}

      <CourseNavigation currentSectionId={sectionId} />
    </div>
  );
}
