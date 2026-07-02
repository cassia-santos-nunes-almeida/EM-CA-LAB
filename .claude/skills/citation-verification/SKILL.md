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

A reference guide for citation verification in academic paper writing, providing verification principles and best practices.

**Core Principle**: Proactively verify every citation during the writing process using WebSearch and Google Scholar.

## Core Problems

Citation issues in academic papers seriously impact research integrity:

1. **Fake citations** - Citing non-existent papers (common issue with AI-generated citations)
2. **Incorrect information** - Mismatched authors, titles, years, etc.
3. **Inconsistent formatting** - Mixed citation formats
4. **Missing citations** - Referenced but uncited work

These issues can lead to:
- Paper rejection or retraction
- Damage to academic reputation
- Reviewers questioning research rigor

**Special risk with AI-assisted writing**: AI-generated citations have approximately 40% error rate; every citation must be verified via WebSearch.

## Verification Principles

This skill provides verification principles based on WebSearch and Google Scholar:

### 1. Proactive Verification (Verify During Writing)

**Core idea**: Verify immediately when adding a citation, rather than checking after writing is complete.

- Search for the paper via WebSearch each time a citation is needed
- Confirm the paper exists on Google Scholar
- Add to bibliography only after verification passes

### 2. Google Scholar Verification

**Why Google Scholar**:
- Most comprehensive academic literature coverage
- Provides citation count (credibility indicator)
- Directly provides BibTeX format
- Free and no API required

**Verification steps**:
1. WebSearch query: `"site:scholar.google.com [paper title] [first author]"`
2. Confirm the paper appears in results
3. Check citation count (abnormally low counts may indicate issues)
4. Click "Cite" to get BibTeX

### 3. Information Matching Verification

**Information that must match**:
- Title (minor differences allowed, e.g., capitalization)
- Authors (at least the first author must match)
- Year (±1 year difference allowed, considering preprints)
- Publication venue (conference/journal name)

### 4. Claim Verification

**Key principle**: When citing a specific claim, you must confirm the claim actually appears in the paper.

- Use WebSearch to access the paper PDF
- Search for relevant keywords
- Confirm the accuracy of the claim
- Record the section/page where the claim appears

## Verification Workflow

### Integration into Writing Process

```
Need a citation during writing
    ↓
WebSearch to find the paper
    ↓
Google Scholar to verify existence
    ↓
Confirm paper details
    ↓
Get BibTeX
    ↓
(If citing a specific claim) Verify the claim
    ↓
Add to bibliography
```

**Key point**: Verification is part of the writing process, not a separate post-processing step.

## Operating modes

The skill handles four distinct verification tasks. Identify the mode
from the user's request before starting.

### Mode A — Single citation verification

User supplies one reference (inline or paraphrase) and asks "check this."
Follow the flowchart above. This is the default mode.

### Mode B — Bulk verification of a .bib file or reference list

User supplies a file or paste of 5+ entries and asks to verify them.

1. **Parse** the list. For each entry, extract: first author, year,
   title, venue, DOI if present. Tolerate BibTeX, APA, or numbered
   lists.
2. **Verify serially** through Mode A for each entry. Do not parallelize
   more than 3 WebSearch calls at a time — Scholar rate-limits and
   batching hides which query produced which result.
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
   venue), present the options to the user rather than guessing.

## Usage Guide

### Using with paper-writing skills

The verification principles of this skill are integrated into the Citation Workflow of any paper-writing skill that delegates citation work (e.g. `eer-paper-writing`).

**Auto-trigger**: Citation verification is automatically executed when a paper-writing skill invokes it.

**Manual reference**: Refer to this skill when you need detailed verification principles.

### Verification Step Example

**Scenario**: Need to cite the Transformer paper

```
Step 1: WebSearch lookup
Query: "Attention is All You Need Vaswani 2017"
Result: Found multiple sources for the paper

Step 2: Google Scholar verification
Query: "site:scholar.google.com Attention is All You Need Vaswani"
Result: ✅ Paper exists, 50,000+ citations, NeurIPS 2017

Step 3: Confirm details
- Title: "Attention is All You Need"
- Authors: Vaswani, Ashish; Shazeer, Noam; Parmar, Niki; ...
- Year: 2017
- Venue: NeurIPS (NIPS)

Step 4: Get BibTeX
- Click "Cite" on Google Scholar
- Select BibTeX format
- Copy BibTeX entry

Step 5: Add to bibliography
- Paste into .bib file
- Use \cite{vaswani2017attention} in the paper
```

### Handling Verification Failures

**If the paper cannot be found on Google Scholar**:

1. **Check spelling** - Is the title or author name correct?
2. **Try different queries** - Use different keyword combinations
3. **Find alternative sources** - Try arXiv, DOI
4. **Mark as pending** - Use `[CITATION NEEDED]` marker
5. **Notify the user** - Clearly state the citation cannot be verified

**If information doesn't match**:

1. **Confirm the source** - Did you find the correct paper?
2. **Check versions** - Preprint vs. published version
3. **Update information** - Use the most accurate version
4. **Record discrepancies** - Note the reason for differences

## Best Practices

### Preventing Fake Citations

1. **Never generate citations from memory** - AI-generated citations have 40% error rate
2. **Use WebSearch to find** - Verify every citation through WebSearch
3. **Confirm on Google Scholar** - Verify paper existence on Google Scholar
4. **Verify promptly** - Verify when adding citations, don't wait until finished

### Handling Verification Failures

1. **Don't guess** - If you can't find the paper, don't fabricate information
2. **Mark clearly** - Use `[CITATION NEEDED]` to mark explicitly
3. **Notify the user** - Clearly state which citations cannot be verified
4. **Provide reasons** - Explain why verification failed (not found, info mismatch, etc.)

### Improving Verification Accuracy

1. **Complete queries** - Include title, author, year
2. **Check citation count** - Citation count on Google Scholar is a credibility indicator
3. **Confirm venue** - Verify conference/journal name is correct
4. **Verify claims** - When citing specific claims, confirm they exist in the paper

### Common Pitfalls

❌ **Wrong approach**:
- Generating BibTeX from memory
- Skipping Google Scholar verification
- Assuming a paper exists
- Not marking unverifiable citations

✅ **Correct approach**:
- Search every citation with WebSearch
- Confirm on Google Scholar
- Copy BibTeX from Google Scholar
- Clearly mark unverifiable citations

## Summary

**Core Principle**: Proactively verify every citation during the writing process using WebSearch and Google Scholar.

**Key Steps**:
1. WebSearch to find the paper
2. Google Scholar to verify existence
3. Confirm details
4. Get BibTeX
5. Verify claims (if needed)
6. Add to bibliography

**Failure handling**: When verification fails, mark as `[CITATION NEEDED]` and clearly notify the user.

**Integration**: The principles of this skill are integrated into paper-writing skills (e.g. eer-paper-writing) for automatic verification.
