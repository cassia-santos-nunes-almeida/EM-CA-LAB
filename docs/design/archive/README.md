# Redesign mockup archive (2026-06-22 → 06-23)

The iteration trail behind the [Navigation & Shell Spec](../2026-06-23-navigation-shell-spec.md). Open the HTML
files in a browser. These are **superseded design explorations**, kept for provenance — the spec + the two
canonical references one level up are the source of truth.

| # | File | What it explored | Outcome |
|---|---|---|---|
| 1 | [`01-three-treatments.html`](./01-three-treatments.html) | Three takes on the locked "Lab Instrument" direction — **A** "The Bench" (dark instrument hero + per-Part traces), **B** "Rack", **C** "Field Notebook" (warm) | Owner chose **A's hero + traces × C's warmth + summaries** |
| 2 | [`02-landing-accordion.html`](./02-landing-accordion.html) | Vertical Part **accordion** landing (open → clickable section list on the left) | Adopted |
| 3 | [`03-sidebar.html`](./03-sidebar.html) | In-course **sidebar** in the same accordion language | Adopted (non-exclusive) |
| 4 | [`04-sidebar-3level-iconrail.html`](./04-sidebar-3level-iconrail.html) | **Three levels** (Part → Section → Subsections) + the collapsible **icon-rail** | Adopted |

**Canonical references** (one level up, the committed spec artifacts):
- [`../nav-behaviors-prototype.html`](../nav-behaviors-prototype.html) — interactive: scroll-spy subnav, persisted collapse, auto-collapse on sim-heavy, mobile.
- [`../landing-and-section-shell.html`](../landing-and-section-shell.html) — the combined landing + section shell.

The combined-landing (round 2) and the interactive nav-behaviours prototype (round 6) live as those two canonical
files rather than in this archive.
