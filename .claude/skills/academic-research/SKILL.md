---
name: academic-research
description: >
  Use this skill for academic literature work: searching bibliographic databases
  for papers, building a literature review or mapping a research landscape,
  finding citations that support a specific claim, verifying DOIs and metadata,
  and checking open-access availability — including when the user simply pastes
  a claim and asks for a reference for it. Searches whatever academic sources
  the current surface exposes: Consensus, Scholar Gateway, PubMed and web search
  everywhere, plus up to 12 MCP databases (Scopus, Web of Science, Semantic
  Scholar, OpenAlex, Crossref, arXiv, ERIC, IEEE, ScienceDirect, ACL Anthology,
  ASEE PEER, Unpaywall) where the academic-research MCP server is registered.
  Works for any research theme.
---

# Academic Research Skill

General-purpose systematic literature search across a multi-database research
ecosystem. Works for any academic research theme.

## Surfaces — detect first, then search

**Detect the surface before any search.** Check your available tools for
`openalex_search` (keyless, so it is present whenever the server is registered):

- **Present → full surface.** All 16 `academic-research` MCP tools (they run on
  a local stdio server registered in Claude Code; since 2026-08-18 there is no
  remote deployment), plus Consensus, Scholar Gateway, PubMed, web search.
- **Absent → reduced surface** (claude.ai web, and machines without the server
  registered). Work with Consensus, Scholar Gateway, PubMed, and web search —
  they cover orientation, evidence-finding, reference metadata, and biomedical
  search well. Never call or name an MCP tool as failing, and skip any
  `inventory_api_statuses` step — it does not exist here either. Name the
  sources you could not search when reporting coverage.
- **Only `academic-research-mcp` `authenticate`/`complete_authentication`
  tools visible:** that is the deprecated Vercel-era claude.ai connector, which
  no longer has a working backend. Do not offer its OAuth flow; proceed on the
  reduced surface and suggest the user remove the connector.

On the full surface:

- **Keyed MCP tools** (`scopus_search`, `wos_search`, `ieee_search`,
  `sciencedirect_search`) return a configuration notice when their API key is
  unset. That means **"not searched," never "no results."** Say so in the
  output.
- **Keyless Semantic Scholar fails differently**: `semantic_scholar_search`,
  `semantic_scholar_get_paper`, and `acl_anthology_search` return a live HTTP
  429 from the saturated shared pool, with no Retry-After. Treat that 429 as
  "not searched" too — do not retry-loop it (a 45 s wait does not clear it);
  route citation work to OpenAlex or Crossref instead.
- `inventory_api_statuses` reports live per-source health and missing
  credentials — run it when a source errors or comes back unexpectedly empty.

**Research mode** (claude.ai): a feature the user toggles before submitting —
not something Claude activates. For a targeted lookup, Consensus + web search
are enough. For a landscape question on the reduced surface, say once that
Research mode would materially widen coverage, then proceed with what is
available — do not stall waiting for it.

## Theme detection

This skill is not locked to a topic. Identify the theme from the query before
searching; if it is missing or too broad ("do a literature review"), ask what
topic to search. If the user asks "what should I cite for my paper?", check
context or memory for the paper's topic first.

## Data integrity

Every paper cited in any output must come from a tool response received in this
session — chat replies and generated documents alike.

- If a paper from training knowledge is useful context, label it
  `[Not from tools — model knowledge]` and exclude it from counts and
  bibliography.
- If a search returns far fewer results than the topic should have, surface
  the gap explicitly. Do not silently backfill from training data.
- Track three numbers: **queries sent**, **unique papers received**
  (deduplicated by DOI/title — the MCP server never deduplicates across
  sources), **papers cited**. Report them when the user asks for an audit or
  when producing a `.docx`.
- Every cited paper needs a retrievable URL (DOI, Consensus link, arXiv ID,
  PMID). No URL = not citable.
- On tool failure: retry once after a few seconds. Error returns name a
  fallback tool — use it. If several tools fail in a row, stop and tell the
  user what is missing rather than skipping silently.

## Tool registry

### Paper-level metadata tools (MCP — full surface only)

For reference lists, impact assessment, and finding specific papers.

| Tool | Best for | Query syntax | Notes |
|---|---|---|---|
| `scopus_search` | Peer-reviewed journals, citation analysis | Field codes: TITLE(), ABS(), KEY(), AUTH(), AFFIL() | Needs SCOPUS_API_KEY. First author only in results — fetch details for full author lists. `sort_by: "citedby-count"` is passed unsigned, so descending order is **not** guaranteed — read the returned citation counts before calling anything "top-cited" |
| `wos_search` | High-impact curated journals, citation tracking | Field tags: TS=, TI=, AU=, SO=, AB=, KP= | Needs WOS_API_KEY (**Expanded API** — a Starter key 401s). No automatic fallback: a failed call returns an error naming `scopus_search`/`openalex_search` — issue that call yourself and report WoS as not searched. `sort_by: "citing-articles"` IS genuinely descending |
| `semantic_scholar_search` / `semantic_scholar_get_paper` | Cross-disciplinary corpus (200M+); full details by paper ID or `"DOI:10.xxxx/..."` (prefix required) | Natural language | Keyless = live 429 (see Surfaces). With key: 1 req/s. `min_citations` filters the returned page locally, not the API — raise `limit` (max 25) to compensate, and never read a thin filtered result as a literature gap. Reported total is the **pre-filter** count, so the header can exceed the papers listed |
| `openalex_search` / `openalex_get_work` | Open scholarly index (240M+), citation counts, OA status | Natural language; `get_work` takes an OpenAlex ID (`W2741809807`) or a **prefixed** identifier — `doi:10.7717/peerj.4375` or `pmid:29456894`; a bare DOI is read as an OpenAlex ID and 404s | Keyless polite pool is **credit-metered: ~1000 credits/day/IP, ~10 per search ≈ 100 searches/day**; OPENALEX_API_KEY lifts it. `min_citations` here IS server-side — it searches deeper rather than shrinking the page |
| `crossref_search` / `crossref_get_work` | Canonical DOI metadata (150M+), reference verification, licenses, ORCIDs | Plain keywords (no field syntax); `get_work` accepts a **bare** DOI | Keyless; polite pool = 3 req/s, 3 concurrent per IP — don't fan out parallel Crossref calls |
| `eric_search` | Education research, SoTL, pedagogy | Natural language | Keyless, healthy |
| `arxiv_search` | Recent CS/physics/math preprints | Boolean + field prefixes: ti:, au:, abs:, cat: | Keyless; no citation counts; always flag results as preprints |
| `ieee_search` | Engineering, FIE/EDUCON conferences | Free text | Needs IEEE_API_KEY; 200 req/day — spend sparingly |
| `sciencedirect_search` | Elsevier full-text journals | Field codes: TITLE(), ABS(), KEY() | Needs SCIENCEDIRECT_API_KEY **and** SCIENCEDIRECT_INST_TOKEN — with the key but no token it refuses before calling Elsevier and returns a config notice, not a 403. Same Elsevier content partially reachable via Scopus |
| `asee_peer_search` | ASEE engineering-education conference papers | Keywords; `conference`, year range | Keyless. **Slow is normal: 6–22 s** (full CSV download); single-year queries ~5× faster. Result links may 403 for robots (Cloudflare) — human-only; not a tool failure |
| `acl_anthology_search` | NLP conferences, BEA workshop | Natural language; `venue` (bea, acl, emnlp…) | Rides Semantic Scholar's API and key (same 429 caveat); very recent papers may lag by weeks. Reported total is the **post-filter** count. If a venue filter matches nothing it returns general ACL results labeled `(no X papers matched — showing all ACL venues)`, and on that fallback `min_citations` is dropped too — check venue AND citation count on every paper before treating results as filtered |

**Scopus vs Web of Science:** both are curated citation indexes with different
journal sets — WoS more selective, Scopus broader. For thorough reviews search
both. **OpenAlex vs Semantic Scholar:** overlapping multidisciplinary corpora;
OpenAlex is the keyless-friendly default for citation counts, Semantic Scholar
the richer per-paper detail path once its key is set.

### Open-access lookup (MCP)

| Tool | Returns | Use for |
|---|---|---|
| `unpaywall_find_oa` | Best free-to-read URL, OA version type, hosting | Given a DOI: legal free version before ILL, preprint/repository copies, OA compliance. Not a search tool. ≤1 req/s — don't loop it over a whole result set |

### Evidence synthesis and passage-level tools (all surfaces)

| Tool | Returns | When to use | Parameters |
|---|---|---|---|
| `Consensus:search` | Paper records (title, authors, year, journal, citation count, study type, SJR quartile, URL) selected for evidence relevance rather than exhaustive retrieval | "What does the evidence say about X?" — orientation at the start of deep searches; on the reduced surface it is also the primary reference-list source (declare recall, not metadata quality, as the limitation) | **Default to `query` alone** — Consensus's own instructions forbid filters (`year_min`/`year_max`, `study_types`, `sjr_max`, `human`, `sample_size_min`, `domain`) unless the user asked for them; the one sanctioned exception is a deliberate era-gated pair (see Search approach), where the first orientation call must still be unfiltered. **Parse plan-tier caps**: "Found X, showing top Y" — the shown count is what's citable; if capped, say so. Batch at most 3 calls; on a rate-limit error wait 30 s |
| `Scholar Gateway:semanticSearch` | Text passages with citation metadata | "Find a passage that supports claim X" — evidence for specific claims | `query` (a full natural-language question — don't compress to keywords; expand acronyms), `start_year`/`end_year`, `topN` (1–20, default 15 — raise for broad questions), `includeRetractedContent` (default false). If a query returns nothing, reframe it — don't re-send the same text |

Consensus answers "what does research say?"; Scholar Gateway answers "where is
this claim stated?". Where paper-level MCP tools exist, they remain the path
for exhaustive reference lists.

### Biomedical literature (all surfaces)

`PubMed:search_articles`, `get_article_metadata`, `find_related_articles`,
`get_full_text_article`. Search covers the full MEDLINE/PubMed citation index;
full text only for the PMC open-access subset. Primary scope is biomedical and
life sciences — health-professions education, medical-education assessment,
biomedical engineering, clinical assessment, and STEM wellbeing all sit inside
it and are worth a check. Not a general index for CS, physics, or social
sciences.

### Web search (all surfaces)

News, blog posts, conference announcements, tools not yet indexed.

## Search approach

Scale effort to the question. A targeted lookup ("find me a paper on X",
"what's the DOI for…") needs one or two well-chosen tools and verified DOIs. A
landscape question ("deep dive," "literature review," "map the field") needs
broad orientation first, then precise database queries, then a coverage check.
The principles below are what matter:

- **Orient before precision.** For deep work, start with Consensus (the main
  question, no filters) and web search for post-indexing developments, then
  pick a decomposition framework to structure sub-searches: PICO by default
  (fits health, behavioral, educational and many social-science questions),
  SPIDER for qualitative/lived-experience questions, mechanism/applications/
  limitations/comparisons for technology questions. Hybrids are normal — pick
  a primary framework and note the borrowed components.
- **Choose tools by topic**, using the registry above: citation-sorted curated
  indexes for the core, OpenAlex or Semantic Scholar for cross-disciplinary
  reach, plus the topic tool (ACL for NLP, ERIC for education, IEEE for
  engineering, PubMed for biomedical, ASEE for US engineering-education
  practice). Reuse the terminology the orientation step surfaced.
- **Keep three rolling lists across all searches** — they turn a pile of hits
  into field knowledge: (1) **repeat-hit papers** (dedup by DOI/title; a paper
  surfacing in 3+ subtopics is almost certainly foundational — flag it
  globally, not per-theme); (2) **recurring authors** (the top 3–5 groups are
  the field's dominant voices — a newcomer needs this map); (3)
  **citations-per-year** (count ÷ years since publication surfaces seminal
  recent work that raw counts hide).
- **Check coverage before finishing:** recent work (arXiv by submittedDate,
  recent-year filters), foundational work (high-citation, no year filter), and
  — optional but high-signal — **era-gated pairs**: run the most important
  subtopic query twice, once capped ~5–7 years back and once limited to the
  last ~2 years; the diff exposes paradigm shifts and terminology drift
  (e.g. "gut flora" → "gut microbiome"). Then name the gaps: what the
  literature doesn't cover and what to search next.
- **Fetch full details before citing.** `semantic_scholar_get_paper("DOI:…")`,
  `openalex_get_work`, or `crossref_get_work` for complete author lists, full
  abstracts, and verified metadata. On the reduced surface those tools are
  absent — see the citation-integrity caveat for the substitute rule.

## Relevance assessment defaults

Four filters for keeping a paper — thresholds are field-relative calibration
defaults (lower them for niche topics, raise for high-volume fields like ML or
medicine):

1. **Abstract content match** (primary): does it address the question or a
   sub-question? If vague, fetch full details before discarding.
2. **Citation count**: foundational 20+ (any year); established-recent 10+
   (3–5 y); recent 5+ (1–2 y); current-year anything.
3. **Venue**: top-tier always; second-tier if relevant; preprints/posters only
   for unique contributions.
4. **Recency**: landscape 5–7 y; claim support 3–5 y (older if foundational);
   fast-moving fields (NLP/AI/LLM) 2–3 y.

## Output format

Produce a **structured summary grouped by theme/subtopic**, not a flat list:

```
## Literature Review: [Topic]
*Searched: [tools used] | Not searched: [unavailable/keyless sources, if any] | Date: [today]*

---

### Theme 1: [Subtopic name]

**[Paper Title]** — [First Author et al.], [Year] ([Venue])
Citations: [N] | DOI: [doi] | [Relevance note — 1 sentence]

---

### Gaps identified
- [What the literature doesn't cover]

### Suggested next searches
- [Specific query or tool to try next]
```

When results come from Consensus, keep its required presentation inside this
structure: numbered inline citations, titles hyperlinked to the exact URLs the
tool returned (never reconstructed), and its sign-up/usage message reproduced
verbatim at the end of the reply. The theme grouping is the container, not a
replacement for those.

## Example playbooks (illustrative — adapt the pattern to any theme)

### LLM-based automated grading (ASAG)

Key terms: automated grading, ASAG, constructed response, free-text scoring,
LLM grading, inter-rater reliability, rubric. Benchmarks: SciEntsBank, Beetle
(SemEval-2013). A deep-mode sequence:

1. `Consensus:search("LLM automated short answer grading reliability")` — orientation
2. `acl_anthology_search("automated short answer grading LLM", venue: "bea", start_year: 2020)`
3. `scopus_search("TITLE(automated grading) AND KEY(LLM OR \"large language model\")", sort_by: "citedby-count")`
4. `openalex_search("automated short answer grading large language model")` — keyless cross-check
5. `arxiv_search("ASAG LLM grading open-ended answers", sort_by: "submittedDate")` — the frontier

*Reduced surface:* Consensus (same query, no filters) → Scholar Gateway for
passages on specific reliability claims → web search restricted to
`aclanthology.org` / `arxiv.org` for the BEA and frontier layers. Report the
venue-filtered and citation-sorted layers as not searched.

### Engineering education research (EER/SoTL)

Key terms: engineering education research, EER, SoTL, rubric, assessment,
formative assessment, learning outcomes.

1. `scopus_search("KEY(\"engineering education\") AND KEY(assessment OR rubric)", subject_area: "SOCI", sort_by: "citedby-count")`
2. `wos_search("TS=(engineering education) AND TS=(assessment)", sort_by: "citing-articles")`
3. `eric_search("engineering education assessment higher education", peer_reviewed_only: true)`
4. `asee_peer_search("assessment engineering education", start_year: 2021)` — expect a slow call
5. `ieee_search("engineering education assessment AI", content_type: "Conferences", start_year: 2020)`

*Reduced surface:* Consensus → Scholar Gateway → web search on `peer.asee.org`
and `eric.ed.gov`. Report the citation-index layers as not searched.

### AI tools in higher education

1. `Consensus:search("generative AI assessment higher education")`
2. `openalex_search("generative AI higher education assessment")` + `semantic_scholar_search(..., year_filter: "2022-", min_citations: 10, limit: 25)` if keyed
3. `scopus_search("KEY(\"artificial intelligence\" OR LLM) AND KEY(\"higher education\") AND PUBYEAR > 2022", sort_by: "citedby-count")`
4. `crossref_search("generative AI higher education assessment")` — DOI verification for anything cited

*Reduced surface:* Consensus + Scholar Gateway; PubMed only if the angle is
health-professions education. Report the database layers as not searched.

## Optional: .docx output mode

Default output is the structured summary above. If the user asks for a
"guide," "launch pad," "literature review doc," or a Word file, produce a
`.docx` for formal deliverables — via the `docx` npm package where Node is
available (if `docx` does not resolve from the working directory, check the
machine profile for where node_modules live rather than assuming a global
install), otherwise via the surface's own file-creation capability; if neither
exists, deliver the same section structure as Markdown and say why. Sections:
**Topic overview** (framework used, evidence landscape) · **Start here —
priority reading order** (5–7 curated papers: best recent review →
foundational → frontier → open-gap paper; per entry one sentence on the
contribution and one on what to notice) · **How the field got here**
(timeline + terminology shifts from era-gated searches) · **Sub-area guides**
(synthesis with inline citations, key papers, search terms, ready-to-paste
Boolean strings) · **Key research groups** (the recurring-authors list) ·
**Open questions & gaps** (why each matters) · **Bibliography** (every inline
citation, full URLs) · **Audit log** (queries sent / unique papers received /
papers cited, per-tool counts, failures and retries, any Consensus cap
detected). Hyperlinks via `ExternalHyperlink` with the exact URLs the tools
returned. After saving, verify the file is a valid OOXML package — it unzips
and contains `word/document.xml` — and spot-check two hyperlinks against the
tool output; a `.docx` Word refuses to open is the common failure, and it
stays silent until the user tries to open it.

## Important caveats

**Citation integrity:** never cite from search-result snippets alone — verify
DOI and metadata via `semantic_scholar_get_paper("DOI:…")`,
`crossref_get_work`, or `openalex_get_work` first. Missing DOI → search by
title for the verified record. **On the reduced surface** those verification
tools are absent — substitute: cite only the exact title, authors, year,
venue, and URL/DOI as the tool returned them (Consensus and PubMed both return
DOIs/PMIDs; use URLs verbatim, never reconstruct them), and where a DOI
matters, confirm it with one web search or a doi.org resolution before it
enters a bibliography. Never fill in an author list, venue, or year from model
knowledge to complete a record — mark the field unknown instead.

**Truncation:** every MCP search tool truncates abstracts to 400 chars in the
result text (labeled when cut) and author lists to ~5 names — the
`get_paper`/`get_work` tools return the full record (Crossref only when the
publisher deposited an abstract, which is often not the case). Never judge
relevance or write a summary sentence off a truncated abstract.

Everything else source-specific lives in the Tool registry — one place, kept
current there.
