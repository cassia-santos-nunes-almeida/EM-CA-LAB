---
name: citation-verification
description: >
  Use this skill whenever verifying, checking, or adding citations in academic writing.
  Trigger on "verify my references," "check this citation," "is this paper real,"
  "find the DOI for," "prevent fake citations," "find me a source for [claim],"
  "verify this .bib file," or any time citations need to be confirmed before they
  go into a paper. Also trigger automatically during eer-paper-writing when citations
  are added. Covers four modes: single-citation verification, bulk .bib/reference-list
  verification with table output, claim-first source discovery, and paywalled-paper
  limited verification. Venue-agnostic — works for any conference or journal submission.
---

# Citation Verification Reference Guide

**Core Principle**: Proactively verify every citation during the writing process, against the best source the current surface exposes (see "Tool surface" below) - never against memory.

## Core Problems

Citation issues in academic papers seriously impact research integrity:

1. **Fake citations** - Citing non-existent papers (common issue with AI-generated citations)
2. **Incorrect information** - Mismatched authors, titles, years, etc.
3. **Inconsistent formatting** - Mixed citation formats
4. **Missing citations** - Referenced but uncited work

**Special risk with AI-assisted writing**: a model asked for a reference it has not looked up will produce a plausible, correctly formatted, non-existent one. The failure is silent and the output is indistinguishable from a real citation. Every citation must be retrieved from a live source before it is used.

## Tool surface - check before verifying

Web search is the floor, not the ceiling. Detect the surface first, then verify
against the most authoritative source it exposes:

- **Bibliographic MCP tools.** Probe for `openalex_search` (keyless, so it is
  present whenever the `academic-research` server is registered). If present,
  `crossref_get_work` or `openalex_get_work` on a DOI is the strongest
  existence-and-metadata check available, and `unpaywall_find_oa` collapses
  Mode D step 1 into one call. `personal/academic-research` (Surfaces section)
  is the source of truth for which tools exist, which need keys, and which
  connectors are dead - do not restate its inventory here.
- **Consensus** and **Scholar Gateway** - present on claude.ai and wherever
  connected. Scholar Gateway returns passages with citation metadata, the
  direct instrument for section 4 and for Mode C.
- **Web search + fetch** - always available, and on some machines the only
  surface. Sufficient, but name in the report which sources you could not
  reach.

"Not searched" is never "not found" - say which it was.

## Verification Principles

This skill provides verification principles based on the surface detected
above:

### 1. Proactive Verification (Verify During Writing)

**Core idea**: Verify immediately when adding a citation, rather than checking after writing is complete.

- Search for the paper each time a citation is needed
- Confirm the paper exists in a record you retrieved, never from memory
- Add to bibliography only after verification passes

### 2. Existence and metadata verification

Google Scholar has the broadest coverage and its citation count is worth
reading as a credibility signal, but Claude cannot click its "Cite" button and
its result pages are hostile to automated retrieval. Treat Scholar as a
coverage signal, not as the record.

**Verification steps**:
1. Search for `[paper title] [first author] [year]`, and separately for the
   DOI if one was supplied.
2. Confirm the paper appears in results, from a source that is not the
   citation being checked.
3. Check the citation count where one is shown (an abnormally low count for an
   allegedly well-known paper is a fabrication signal).
4. Take the BibTeX from a machine-readable record - never from memory, never
   retyped from a search snippet. DOI content negotiation
   `curl -LH "Accept: application/x-bibtex" https://doi.org/<DOI>` is the most
   reliable path; the publisher or arXiv page is the fallback.

### 3. Information Matching Verification

**Information that must match**:
- Title (minor differences allowed, e.g., capitalization)
- Authors (at least the first author must match)
- Year (±1 year difference allowed, considering preprints)
- Publication venue (conference/journal name)

### 4. Claim Verification

**Key principle**: When citing a specific claim, you must confirm the claim actually appears in the paper.

- Retrieve the paper itself - WebSearch finds where it is, a fetch tool
  (WebFetch, or the surface's own page/PDF reader) opens it. A search-result
  snippet is never sufficient evidence that a claim is in the paper.
- Search the retrieved text for the claim's distinctive terms or figures
- Confirm the accuracy of the claim
- Record the section/page where the claim appears
- If the full text cannot be reached, do not improvise - go to Mode D and use
  its depth markers.

## Verification Workflow

### Integration into Writing Process

The order is fixed. Other sections address these steps by number, so keep the
numbering:

1. Find the paper.
2. Confirm it exists, in a source other than the citation being checked.
3. Confirm its details (matching tolerances: section 3).
4. Obtain BibTeX from a machine-readable record.
5. If a specific claim is being cited, verify the claim appears in the paper.
6. Add it to the bibliography.

Nothing enters the `.bib` before its verification step passes.

**Key point**: Verification is part of the writing process, not a separate post-processing step.

## Operating modes

The skill handles four distinct verification tasks. Identify the mode
from the user's request before starting.

### Mode A — Single citation verification

User supplies one reference (inline or paraphrase) and asks "check this."
Follow the six numbered steps above. This is the default mode.

### Mode B — Bulk verification of a .bib file or reference list

User supplies a file or paste of 5+ entries and asks to verify them.

1. **Parse** the list. For each entry, extract: first author, year,
   title, venue, DOI if present. Tolerate BibTeX, APA, or numbered
   lists.
2. **Verify serially** through Mode A for each entry. Do not parallelize
   more than 3 WebSearch calls at a time — Scholar rate-limits and
   batching hides which query produced which result.
   *Optional, Claude Code only:* for a long list (20+ entries), fan the
   entries out over Agent-tool subagents, each verifying its slice and
   returning only its table rows. The win is context isolation — per-entry
   search noise stays in the subagent — not wall-clock: the 3-concurrent-search
   ceiling is a remote rate limit and binds across the WHOLE fan-out, not per
   subagent. To stay inside it, run at most 3 subagents and instruct each one
   to search strictly one query at a time. Spawn with the model tier stated
   explicitly, one tier below the session model.
3. **Report as a table** with one row per entry:
   - Columns: `#`, `First author (year)`, `Status`, `Issues found`, `Action`
   - Status values: `verified`, `verified with correction`, `unverifiable`, `error`
   - "Issues found" names the specific mismatch (wrong year, author typo,
     wrong venue, DOI resolves to a different paper, paper not found)
   - "Action" is what the user should do (accept, apply correction,
     mark `[CITATION NEEDED]`, manually confirm)
4. **Summary line** at the end: `N verified · M corrected · K
   unverifiable` and a recommended next step.

Do not silently "correct" entries — every change requires an explicit
line in the report so the user can accept or reject it.

### Mode C — Claim-first source discovery

User states a claim (e.g. "GPT-4 passes the bar exam at 90th
percentile") and asks "find me a source." This is discovery, not
verification, but the skill's integrity rules still apply.

1. **WebSearch** with the claim's specific numbers or key terms —
   include quoted phrases where the exact figure matters (e.g.
   `"90th percentile" GPT-4 bar exam`). Scholar-scoped queries are
   second-best for discovery because the primary source may be a
   preprint, blog, or press release that predates indexing.
2. **Identify candidate papers or reports** from the results. Prefer
   peer-reviewed sources; accept preprints (arXiv, OSF) if that is
   where the original claim was published; accept technical reports
   from reputable labs when the claim is explicitly the lab's own
   finding.
3. **Open the candidate and locate the claim.** Use the search-within-
   page function, or a targeted search for the specific number. If the
   candidate is paywalled, fall back to the abstract, the
   arXiv/preprint version, or an author's posted PDF.
4. **Cross-check at least one secondary source** — an independent
   reference, press coverage, or citation that attributes the claim to
   the candidate paper. If no independent source attributes the claim
   to this paper, treat as "plausible but single-sourced" and tell the
   user.
5. **Deliver** the verified source, the BibTeX entry, and the specific
   page/section where the claim appears. If no candidate passes step 3,
   tell the user the claim could not be sourced and suggest a rewrite
   that does not depend on it.

If the claim is specific (a number, a name, a date), never accept a
candidate whose text does not literally contain that specific. Loose
paraphrases are the most common fabrication vector.

### Mode D — Paywalled paper claim verification

Mode A step 5 (verify the claim appears in the paper) assumes PDF
access. When the paper is behind a paywall:

1. **Try open alternatives first**: arXiv, the author's institutional
   page, ResearchGate, Semantic Scholar's open-access copy, Unpaywall.
   A surprisingly high share of paywalled papers have a free version
   the author has posted.
2. **If no open copy exists**, read the abstract carefully. If the
   claim is in the abstract, cite with a note that verification was
   limited to the abstract. If the claim is NOT in the abstract, you
   cannot verify — never extrapolate from the abstract to specific
   figures, methods, or findings that only appear in the body.
3. **Mark the citation** with the limited-verification state so the
   user knows the depth of the check: `[VERIFIED — abstract only]`
   or `[VERIFIED — metadata only, claim not checked]`. Never silently
   promote an abstract-only check to a full-text check.

### Handling ambiguous matches (applies to all modes)

When Google Scholar or WebSearch returns multiple candidates with the
same or near-identical title (common for conference-then-journal
versions, or for papers with republished versions):

1. **Prefer the earliest peer-reviewed publication** as the primary
   citation. If a preprint came before a conference paper, and both
   exist, cite the conference paper — readers expect the venue of
   record.
2. **If the user's existing citation points to one version**, keep it
   unless the metadata is wrong. Do not "upgrade" a journal citation
   to a newer book chapter just because it looks more authoritative.
3. **If the candidates differ in authorship or substance** (not just
   venue), present the options to the user rather than guessing - in Claude
   Code as an AskUserQuestion whose options are the candidate records (title,
   year, venue, and what differs); on surfaces without that tool, as a
   numbered list in the reply. Never pick for the user. If several ambiguous
   citations are batched into one call, diff the answers against the questions
   per question afterwards: batches can come back with individual questions
   silently unanswered, and an unanswered one is deferred, never approved.

## Usage Guide

### Using with paper-writing skills

There is no programmatic auto-trigger - no paper-writing skill invokes this
one mechanically. The frontmatter's "trigger during eer-paper-writing" line is
a description-level trigger: load this skill when citation work starts in a
paper session, rather than waiting to be called.

`eer-paper-writing` also ships its own `references/citation-guide.md`, which is
SEFI/EER-flavoured (Scholar/Scopus/ERIC, APA, SEFI venues) by its own
declaration (`eer-paper-writing/SKILL.md`:48-55). The two are complementary,
not alternatives: take venue conventions and reference formatting from that
guide, and take the verification modes it does not carry from here - bulk
`.bib` verification (Mode B), paywalled verification and its depth markers
(Mode D), and ambiguous-match resolution.

### Worked example (goal-level)

To cite "Attention is All You Need": search for the title plus first author,
confirm a record exists in a source other than the citation being checked,
read venue and year off that record (NeurIPS 2017 - off the record, not off
memory), pull BibTeX by DOI content negotiation, then add it to the `.bib`.
If title, first author, year (+/-1), or venue disagrees with the retrieved
record, resolve the disagreement before the entry goes in - never average the
two.

### Handling Verification Failures

**If the paper cannot be found**: re-query before concluding it does not exist
(spelling, alternate title, arXiv, DOI resolution). Then stop - never fabricate
a plausible substitute. Mark the citation `[CITATION NEEDED]`, tell the user
exactly which citations failed, and say why each one failed.

**If information doesn't match**: first establish you found the right paper,
then check whether the mismatch is a preprint-versus-published difference
before treating it as an error. Cite the version the user actually read; where
that is a choice rather than a fact, the ambiguous-match rules below govern.
Record the discrepancy and its reason in the report - never overwrite the
user's metadata silently.

## Best Practices

### Preventing Fake Citations

1. **Never generate citations from memory** - an un-looked-up reference is fabricated by construction, however plausible it looks
2. **Use WebSearch to find** - Verify every citation through WebSearch
3. **Confirm against a retrieved record** - Scholar, Crossref, or the publisher page; never a search snippet
4. **Verify promptly** - Verify when adding citations, don't wait until finished

### Improving Verification Accuracy

1. **Complete queries** - Include title, author, year
