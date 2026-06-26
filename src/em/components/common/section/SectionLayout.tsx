import { useEffect, type ReactNode } from 'react';
import { SectionHook } from '@shared/components/common/SectionHook';
import { TableOfContents } from '@shared/components/common/TableOfContents';
import { CourseNavigation } from '@shared/components/common/CourseNavigation';
import { useProgressStore } from '@shared/store/progressStore';
import { SECTIONS, getSectionNumber, getPartForSection, PART_QUANTITIES } from '@shared/constants/curriculum';
import { useScrollSpy } from '@shared/hooks/useScrollSpy';

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
 * bottom: breadcrumb → SectionHook → warm-chrome header → optional
 * TableOfContents → body → ModuleNavigation, and records the visit on mount.
 * See docs/m1-section-migration-spec.md §2.3.
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
  const { anchors, activeId } = useScrollSpy();

  useEffect(() => {
    markVisited(sectionId);
  }, [markVisited, sectionId]);

  const section = SECTIONS[sectionId];
  const heading = title ?? section?.title ?? '';
  const sub = subtitle ?? section?.subtitle;

  const part = getPartForSection(sectionId);
  const sectionNum = getSectionNumber(sectionId);

  // Active subsection info from scroll-spy
  const activeAnchorIdx = anchors.findIndex((a) => a.id === activeId);
  const activeAnchor = activeAnchorIdx !== -1 ? anchors[activeAnchorIdx] : null;

  return (
    <div className="space-y-6">
      {/* ── Mono breadcrumb ── */}
      {part && (
        <div className="font-mono text-xs flex items-center gap-1 flex-wrap" style={{ color: 'var(--color-muted)' }}>
          {/* PART 0N · QUANTITY */}
          <span
            className="font-semibold tracking-widest uppercase"
            style={{ color: `var(--color-part-${part.number})` }}
          >
            PART {String(part.number).padStart(2, '0')}
          </span>
          <span>·</span>
          <span
            className="font-semibold tracking-widest uppercase"
            style={{ color: `var(--color-part-${part.number})` }}
          >
            {PART_QUANTITIES[part.number]}
          </span>
          {sectionNum && (
            <>
              <span>/</span>
              <span>{sectionNum}</span>
              {heading && (
                <span>{heading}</span>
              )}
            </>
          )}
          {/* Active subsection segment */}
          {activeAnchor && (
            <>
              <span>/</span>
              <span>{activeAnchor.label}</span>
            </>
          )}
          {/* k/total subsection progress meter */}
          {anchors.length > 0 && (
            <span className="ml-1 opacity-60">
              {activeAnchorIdx !== -1 ? activeAnchorIdx + 1 : 0}/{anchors.length}
            </span>
          )}
        </div>
      )}

      <SectionHook text={hook} icon={hookIcon} />

      {heading && (
        <header className="bg-[--color-card] border border-[--color-card-border] rounded-xl px-5 py-4">
          <h1
            className="font-display text-2xl md:text-3xl text-[--color-title]"
          >
            {sectionNum && (
              <span
                className="font-mono mr-2"
                style={{ color: part ? `var(--color-part-${part.number})` : 'var(--color-muted)' }}
              >
                {sectionNum}
              </span>
            )}
            {heading}
          </h1>
          {sub && (
            <p className="mt-1 text-[--color-muted]">{sub}</p>
          )}
        </header>
      )}

      {toc && toc.length > 0 && <TableOfContents items={toc} />}

      {children}

      <CourseNavigation currentSectionId={sectionId} />
    </div>
  );
}
