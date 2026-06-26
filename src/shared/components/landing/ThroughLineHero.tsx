/**
 * ThroughLineHero — the slimmed dark instrument strip above the Part accordion.
 *
 * Deliberately separable: the owner may drop it by removing it from
 * CourseLanding.tsx without touching any other code (spec §9).
 *
 * Contains:
 *  - The accessible page <h1> (required, even if the hero is dropped the h1
 *    must be preserved elsewhere)
 *  - A compact dark hero bar with the course title and a mono eyebrow tag
 *  - The "through-line" statement ("circuits → fields → waves → lines")
 */

export function ThroughLineHero() {
  return (
    <header
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--color-screen)' }}
    >
      <div className="px-6 py-5 md:px-8 md:py-6">
        {/* Mono eyebrow */}
        <p
          className="font-mono text-[9px] tracking-[0.18em] uppercase mb-2"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          Five instruments · one bench
        </p>

        {/* Page title */}
        <h1
          className="text-2xl md:text-3xl font-semibold leading-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'rgba(255,255,255,0.92)' }}
        >
          Electromagnetism &amp; Circuit Analysis
        </h1>

        {/* Through-line descriptor */}
        <p
          className="mt-2 font-mono text-[10px] tracking-wider"
          style={{ color: 'rgba(255,255,255,0.38)' }}
        >
          circuits&nbsp;&rarr;&nbsp;fields&nbsp;&rarr;&nbsp;waves&nbsp;&rarr;&nbsp;lines
        </p>
      </div>
    </header>
  );
}
