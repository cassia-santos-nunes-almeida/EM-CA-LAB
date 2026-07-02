---
name: academic-research
description: >
  Use this skill whenever the user asks to search for papers, build a literature review,
  find citations to support a claim, map the research landscape on a topic, or says
  "search the databases," "find me papers on," "what do I cite for," "do a literature
  review," "deep dive on," "what has been done on X," "what does the evidence say
  about," or "systematic search." Even if she just pastes a claim and says "find me a
  reference for this," use this skill. Searches across 10+ databases: Scopus, Web of
  Science, Semantic Scholar, arXiv, ERIC, IEEE, ScienceDirect, ACL Anthology, ASEE
  PEER, Consensus, Scholar Gateway, and PubMed. Works for any research theme.
---

# Academic Research Skill

General-purpose systematic literature search across a multi-database research
ecosystem. Works for any academic research theme.

## Theme detection

This skill is not locked to a specific research topic. At the start of any research
task, identify the theme from the user's query. If the theme is unclear or too broad,
ask before searching. Examples:

- "find me papers on automated grading with LLMs" -- theme is clear, proceed
- "do a literature review" -- theme missing, ask: "What topic should I search?"
- "deep dive on transformer attention mechanisms" -- theme is clear, proceed
- "what should I cite for my paper?" -- check context/memory for the paper topic

Once the theme is identified, select tools and construct queries accordingly.

---

## Data integrity

Every paper cited in any output must come from a tool response received in this
session. These rules apply equally to chat replies and to generated documents.

- Only cite what a tool returned in this session. If a paper from training
  knowledge is useful for context, label it `[Not from tools — model knowledge]`
  and exclude it from counts and bibliography.
- If a search returns fewer results than expected (0--2 hits for a topic that
  should have more), surface the gap explicitly. Do not silently backfill from
  training data.
- Track three separate numbers: **queries sent**, **unique papers received**
  (deduplicated by DOI/title), **papers cited** in the final output. Report
  them when the user asks for an audit or when producing a `.docx`.
- Every cited paper must have a retrievable URL (DOI, Consensus link, arXiv
  ID, PMID). No URL = not citable.
- On tool failure: wait 3 seconds, retry once, log the outcome. After 3
  consecutive failures across any tools, stop and tell the user what's
  missing rather than skipping silently.

---

## Tool registry

All available research tools, grouped by what they return.

### Paper-level metadata tools (titles, authors, citations, DOIs)

Use these for building reference lists, assessing impact, and finding specific papers.

| Tool | Best for | Query syntax | Key filters |
|---|---|---|---|
| `scopus_search` | Peer-reviewed journals, citation analysis | Field codes: TITLE(), ABS(), KEY(), AUTH(), AFFIL() | `subject_area`, `sort_by` (citedby-count), year range |
| `wos_search` | High-impact curated journals, interdisciplinary citation tracking | Field tags: TS=, TI=, AU=, SO=, AB=, KP= | `sort_by` (citing-articles), year range. **Requires WOS_API_KEY** -- falls back to Scopus if unavailable |
| `semantic_scholar_search` | Cross-disciplinary, large corpus (200M+ papers) | Natural language | `fields_of_study`, `min_citations`, `year_filter` |
| `semantic_scholar_get_paper` | Full details for a known paper | Paper ID or `"DOI:10.xxxx/..."` | -- |
| `acl_anthology_search` | NLP conferences, BEA workshop | Natural language | `venue` (bea, acl, emnlp...), `min_citations` |
| `eric_search` | Education research, SoTL, pedagogy | Natural language | `peer_reviewed_only`, `publication_type` |
| `arxiv_search` | Recent CS/physics/math preprints | Boolean + field prefixes: ti:, au:, abs:, cat: | `sort_by` (submittedDate) |
| `ieee_search` | Engineering, FIE/EDUCON conferences | Free text | `content_type` (Conferences, Journals) |
| `sciencedirect_search` | Elsevier full-text journals | Field codes: TITLE(), ABS(), KEY() | `subject_area`, `open_access_only` |
| `asee_peer_search` | ASEE conference papers (2021--present) | Keywords | `conference`, year range |

**Scopus vs Web of Science:** Both are curated citation databases, but they index
different journal sets. WoS is more selective; Scopus has broader coverage. For
thorough literature reviews, search both. WoS is especially strong for
interdisciplinary citation tracking via its `citing-articles` sort.

### Evidence synthesis and passage-level tools

These do NOT return standard paper metadata. Use them for orientation and
evidence-finding, then verify with paper-level tools above.

| Tool | Returns | When to use | Key parameters |
|---|---|---|---|
| `Consensus:search` | Papers with study-type classification and SJR quartile | "What does the evidence say about X?" -- orientation at the start of deep searches | `study_types` (meta-analysis, rct, systematic review...), `sjr_max` (1=Q1..4=Q4), `year_min`/`year_max`, `sample_size_min`, `human`. **Parse plan-tier caps**: responses often say "Found X, showing top Y" -- the *shown* count is what's citable (unauth ~3, free ~10, pro ~20). If a cap is detected, log it and surface: sparse results may reflect the cap, not a literature gap. Rate limit: 1 q/s sequential. |
| `Scholar Gateway:semanticSearch` | Text passages with inline citations | "Find me a passage that supports claim X" -- evidence for specific claims | `interaction_id` (UUID, reuse per prompt), `inferred_intent` (why the user needs this), `topN`, year range |

**Do not confuse them:**
- Consensus answers "what does research say?" (cross-database synthesis, filterable by study design)
- Scholar Gateway answers "where is this claim stated?" (passage retrieval from peer-reviewed text)
- Neither replaces paper-level tools for building reference lists with DOIs and citation counts

### Biomedical literature

| Tool | Returns | When to use |
|---|---|---|
| `PubMed:search_articles` | Biomedical papers from MEDLINE | Health education, biomedical engineering, clinical assessment, STEM wellbeing |
| `PubMed:get_article_metadata` | Full metadata for known PMIDs | After PubMed search to get details |
| `PubMed:find_related_articles` | Similar papers by content analysis | Expanding from a known biomedical paper |
| `PubMed:get_full_text_article` | Full text from PMC | Only ~6M articles available; needs PMC ID |

PubMed only indexes biomedical/life sciences. Do not use for CS, engineering, physics,
or social sciences topics -- use the paper-level tools above instead.

### Web-facing tools

| Tool | Role |
|---|---|
| Web search | News, blog posts, conference announcements, tools not yet in databases |

**About Research mode:** Research mode is a Claude.ai feature that the user toggles
ON before submitting a query -- it is not a tool Claude can activate mid-conversation.
For deep literature reviews, the user can optionally run a Research mode session first
to get broad orientation, then start a regular session where this skill handles
precise database searches. However, Consensus + web search already cover most
orientation needs within a single session.

---

## Mode detection

Claude already scales effort based on natural language cues ("deep dive,"
"comprehensive," "research"). This skill adds academic-specific routing.

### Quick mode (2--4 tool calls)

**Triggers:** "find me a paper on," "what should I cite for," "is there a reference
for," "look up [specific paper]," "find the DOI for," or any short factual lookup.

**Workflow:**
1. Pick 1--2 best paper-level tools based on topic and query syntax
2. Run targeted queries with filters (year, citation count)
   - For niche or very recent topics: drop `min_citations` — strict filters
     on small fields return too few results
3. Fetch full details with `semantic_scholar_get_paper` when DOI is available
4. Return structured results with DOIs

### Deep mode (8--15+ tool calls)

**Triggers:** "deep dive," "comprehensive review," "literature review," "map the
landscape," "what has been done on," "systematic search," or any open-ended question.

**Phase A -- Orientation and framework selection**
Start broad. Get the lay of the land before precise database queries.

1. `Consensus:search` with the main research question (no filters first) to see
   what the evidence says and which subtopics emerge
2. `web_search` for recent developments not yet in databases: conference
   announcements, new tools, blog posts, emerging terminology
3. **Pick a decomposition framework** to structure the landscape into searchable
   sub-areas. Try PICO first (it fits more than just clinical questions):
   - **PICO** -- Population / Intervention / Comparison / Outcome. Default choice.
     Works for health, clinical, behavioral, educational, and many social-science
     questions.
   - **SPIDER** -- Sample / Phenomenon of Interest / Design / Evaluation /
     Research type. Use for qualitative or lived-experience questions with no
     clear intervention or comparison group.
   - **Decomposition** -- Core mechanism / Applications / Limitations /
     Comparisons with alternatives. Use for technology-focused questions.
   - Many real questions are hybrids (e.g., "social media and teen wellbeing"
     has PICO + qualitative components). Pick a primary framework for structure,
     note which components borrow from others.
4. Document what Phase A found: framework chosen, key terms, key authors,
   subtopics, terminology shifts observed across eras.

*Note: If the user ran a Research mode session before this one, incorporate any
orientation findings they share from that session.*

**Phase B -- Landscape search (paper-level tools)**
Run 2--3 tools chosen by topic. Use terms surfaced in Phase A.

1. Scopus or WoS (citation-sorted): `sort_by: "citedby-count"`, `max_results: 10`, recent years
2. Semantic Scholar (cross-disciplinary): `year_filter`, `min_citations: 5`
3. Topic-specific tool: ACL for NLP, ERIC for education, IEEE for engineering,
   PubMed for biomedical, ASEE for US engineering education practice

**Phase C -- Deep dive on hits**
For each promising paper from Phase B:
- `semantic_scholar_get_paper("DOI:...")` for full abstract and author list
- `Scholar Gateway:semanticSearch` if a specific claim needs passage-level evidence
- Note: title, authors, year, venue, citation count, key claims

**Cross-search intelligence (track across all Phase B/C results)**

While results come in, keep three rolling lists. These convert a pile of hits
into actual field knowledge:

1. **Repeat-hit papers** -- deduplicate by DOI/title across every search. A paper
   that surfaces in 3+ subtopics is almost certainly foundational; flag it
   explicitly in the output, not just in one theme.
2. **Recurring authors** -- the author groups that appear in multiple searches
   are the dominant labs/voices. List the top 3--5; a researcher entering the
   field needs this map.
3. **Citations-per-year signal** -- citation count divided by years since
   publication. A 2024 paper with 150 citations is a stronger signal than a
   2008 paper with 150 citations. Use this to surface seminal work, not just
   raw citation count.

**Phase D -- Coverage check**
1. Recent: `arxiv_search` sorted by `submittedDate`; Semantic Scholar with recent year filter
2. Foundational: Scopus/WoS with `min_citations: 50`, no year filter
3. **Era-gated pairs (optional, high-signal)** -- for the most important subtopic,
   run the same query twice: once with `year_max: <5-7 years ago>` and once with
   `year_min: <last 2 years>`. The diff surfaces paradigm shifts, terminology
   drift (e.g., "gut flora" -> "gut microbiome"), and methodological evolution.
   Document the contrast in the output.
4. Gap identification: what's missing? what should be searched next?

---

## Relevance assessment criteria

Apply these four filters when deciding whether to keep a paper. These are
topic-agnostic -- adjust thresholds to the specific field's norms.

**1. Abstract content match** (primary)
Does the abstract directly address the research question or a sub-question?
If vague, fetch full details before discarding.

**2. Citation count** (impact)
- Foundational: 20+ citations (any year)
- Established recent: 10+ citations (3--5 years old)
- Recent: 5+ citations (1--2 years old)
- Very recent (current year): any count acceptable

These thresholds suit mid-sized fields. For niche topics, lower them.
For high-volume fields (ML, medicine), raise them.

**3. Publication venue** (credibility)
- Keep always: top-tier journals and conferences in the field
- Keep if relevant: second-tier venues, well-known workshops
- Keep only if unique contribution: preprints, posters, working papers

**4. Year** (recency)
- Landscape map: 5--7 years
- Specific claim support: 3--5 years preferred, older if foundational
- Fast-moving fields (NLP, AI, LLM): 2--3 years

---

## Output format

Always produce a **structured summary grouped by theme/subtopic**, not a flat list.

```
## Literature Review: [Topic]
*Searched: [tools used] | Mode: [quick/deep] | Date: [today]*

---

### Theme 1: [Subtopic name]

**[Paper Title]** -- [First Author et al.], [Year] ([Venue])
Citations: [N] | DOI: [doi] | [Relevance note -- 1 sentence]

---

### Theme 2: [Subtopic name]
...

---

### Gaps identified
- [What the literature doesn't cover]

### Suggested next searches
- [Specific query or tool to try next]
```

---

## Example playbooks

These playbooks illustrate how to build topic-specific search sequences for a few
common research themes. Adapt the pattern for any theme.

### Example: LLM-based automated grading (ASAG)

**Key terms:** automated grading, automatic short answer grading, ASAG, constructed
response, free-text scoring, LLM grading, inter-rater reliability, rubric

**Deep mode sequence:**
1. `Consensus:search("LLM automated short answer grading reliability")` -- orientation
2. `acl_anthology_search("automated short answer grading LLM", venue: "bea", start_year: 2020)`
3. `scopus_search("TITLE(automated grading) AND KEY(LLM OR \"large language model\")", sort_by: "citedby-count")`
4. `wos_search("TS=(automated grading) AND TS=(large language model)", sort_by: "citing-articles")`
5. `semantic_scholar_search("ASAG LLM engineering education open-ended", year_filter: "2022-")`
6. `arxiv_search("ASAG LLM grading open-ended answers", sort_by: "submittedDate")`

**Key benchmarks:** SciEntsBank, Beetle (SemEval-2013).
**Key authors:** Kortemeyer G., Grévisse C., Pinto G.

### Example: Engineering education research (EER/SoTL)

**Key terms:** engineering education research, EER, SoTL, scholarship of teaching and
learning, rubric, assessment, formative assessment, learning outcomes

**Deep mode sequence:**
1. `scopus_search("KEY(\"engineering education\") AND KEY(assessment OR rubric)", subject_area: "SOCI", sort_by: "citedby-count")`
2. `wos_search("TS=(engineering education) AND TS=(assessment)", sort_by: "citing-articles")`
3. `eric_search("engineering education assessment higher education", peer_reviewed_only: true)`
4. `asee_peer_search("assessment engineering education", start_year: 2021)`
5. `ieee_search("engineering education assessment AI", content_type: "Conferences", start_year: 2020)`

### Example: AI tools in higher education

**Key terms:** artificial intelligence education, generative AI, ChatGPT education,
LLM higher education, AI feedback, AI assessment

**Deep mode sequence:**
1. `Consensus:search("generative AI assessment higher education", year_min: 2022)`
2. `semantic_scholar_search("LLM generative AI higher education assessment", year_filter: "2022-", min_citations: 10)`
3. `scopus_search("KEY(\"artificial intelligence\" OR LLM) AND KEY(\"higher education\") AND PUBYEAR > 2022", sort_by: "citedby-count")`
4. `wos_search("TS=(generative AI) AND TS=(higher education) AND TS=(assessment)", start_year: 2022, sort_by: "citing-articles")`
5. `sciencedirect_search("TITLE(AI OR LLM) AND ABS(higher education assessment)", start_year: 2022)`

---

## Optional: .docx output mode

Default output is the structured summary above. If the user asks for a "guide,"
"launch pad," "literature review doc," or explicitly requests a Word file,
produce a `.docx` using the `docx` npm package (`npm install -g docx`) with the
following structure. This mode is for formal deliverables (shareable with
co-authors, mentors, or students), not for quick chat answers.

Sections:
1. **Topic overview** -- 4--6 sentences, framework used, evidence landscape.
2. **Start here -- priority reading order** -- 5--7 curated papers in the
   order a newcomer should read them: best recent review first, then
   foundational paper(s), then current frontier, ending with a paper that
   highlights an open gap. Each entry: clickable title, authors/year, one
   sentence on what it contributes, one sentence on what to notice while
   reading.
3. **How the field got here** -- chronological timeline table + note on any
   terminology shifts observed in era-gated searches.
4. **Sub-area guides** (one per framework component) -- 2--3-sentence
   synthesis with inline citations, 3--5 key papers, key search terms,
   2--3 ready-to-paste Boolean strings.
5. **Key research groups** -- the recurring-authors list from cross-search
   intelligence.
6. **Open questions & gaps** -- methodological / population-context /
   conceptual. For each gap, explain why it matters.
7. **Bibliography** -- full list, every inline citation has an entry,
   URLs full not truncated.
8. **Audit log** -- queries sent, papers received (deduplicated), papers
   cited, per-tool result counts, any failed or retried searches, and any
   Consensus plan-tier cap detected.

Hyperlinks: `ExternalHyperlink` with `style: "Hyperlink"` and the full URL
returned by the tool. Page: US Letter, 1-inch margins, Arial body. Validate
with `python <docx-skill-path>/scripts/office/validate.py` after saving.

---

## Important caveats

**Citation integrity:** Never use search results as citations without verifying DOI
and metadata. Always fetch full details via `semantic_scholar_get_paper("DOI:...")`
before adding to a paper. If DOI is missing, search by title to find the verified record.

**Database limitations:**
- Scopus returns first author only -- fetch full details for complete author list
- WoS Starter API requires WOS_API_KEY — if not configured, the tool returns 401.
  Use Scopus as primary fallback for citation analysis until WoS key is set up.
  Daily quota depends on the institutional subscription tier.
- arXiv results are not peer-reviewed -- always flag as preprints
- ASEE PEER uses HTML parsing -- if results are sparse, try peer.asee.org directly
- ACL Anthology uses Semantic Scholar index -- very recent papers may lag by weeks
- Consensus returns synthesis, not raw metadata -- verify claims with paper-level tools
- Scholar Gateway returns passages, not paper metadata -- requires `interaction_id` (UUID) and `inferred_intent` (free text describing the user's goal)
- PubMed only covers biomedical/life sciences -- not for CS, engineering, or social sciences

**Rate limits:**
- Semantic Scholar: 1 req/s with API key -- space out rapid calls
- IEEE: 200 req/day -- use sparingly, prioritize other tools first
- Scopus: generous limits with institutional key
- WoS: depends on subscription tier

**ScienceDirect:** If 401 errors persist, use Scopus as fallback (same Elsevier
content, slightly different coverage).
