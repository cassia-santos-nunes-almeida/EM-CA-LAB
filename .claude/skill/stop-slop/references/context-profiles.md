# Context Profiles

stop-slop accepts an optional context parameter that selects one of four enforcement
clusters. When called without a context parameter, it defaults to `professional-message`.

---

## Cluster Definitions

| Cluster | Covers | Default caller | Character |
|---|---|---|---|
| `informal-message` | Personal notes, quick internal writing, WhatsApp to close contacts | message-coach (Personal mode) | Lightest overall enforcement. Catch only the worst offenders. |
| `professional-message` | Teams messages, colleague emails, student materials, lecture scripts | message-coach (Work mode), **default** | Full enforcement, both audit passes. |
| `academic-formal` | Methods, results, literature review sections | eer-paper-writing (per section) | Strict pattern rules, skip conversational voice test. Relax hedging and rhythm for precision. |
| `academic-human` | Discussion, conclusion, introduction, abstract sections | eer-paper-writing (per section) | Full pattern rules, partial conversational voice test (topic sentences and transitions only). |

---

## Tolerance Matrix

| Rule category | informal-message | professional-message | academic-formal | academic-human |
|---|---|---|---|---|
| Tier 1 banned words | strict | strict | strict | strict |
| Tier 2 banned words (cluster) | relaxed (3+ in paragraph) | strict (2+ in paragraph) | strict, with tech exceptions (a) | strict |
| Tier 3 banned words (density) | skip | strict | relaxed (b) | strict |
| Banned phrases | relaxed (c) | strict | strict | strict |
| Banned structures | relaxed | strict | strict | strict |
| Em-dashes | **strict** | **strict** | **strict** | **strict** |
| Opener monotony (25%) | skip | strict | strict | strict |
| Vocabulary clustering (3+ per page) | skip | strict | strict | strict |
| Hedging density (3+ per paragraph) | skip | strict | relaxed (d) | strict |
| Transition overload (2+ per page) | skip | strict | relaxed (d) | strict |
| Paragraph uniformity | skip | strict | strict | strict |
| Setup-then-deliver | skip | strict | strict | strict |
| Rhythm variation | skip | strict | relaxed (d) | strict |
| Copula avoidance | skip | strict | relaxed | strict |
| Synonym cycling | skip | strict | strict | strict |
| New structural patterns (e) | skip | strict | strict | strict |
| Scoring rubric | skip | strict | strict | strict |
| Conversational voice test (Pass 1) | strict | strict | **skip** | **partial** (f) |
| Pasta test (Pass 2) | strict | strict | strict | strict |

### Notes

**(a)** Technical-term exceptions for academic-formal: "robust", "comprehensive",
"ecosystem", "facilitate", "streamline" are legitimate in technical writing contexts.
Still catch: "delve", "tapestry", "beacon", "embark", "testament to", "game-changer",
"harness."

**(b)** Tier 3 words in academic-formal: many (significant, effective, innovative) appear
legitimately in results and methods. Detect only at high saturation (4+ instances per page).

**(c)** Informal-message: catch only throat-clearing openers and emphasis crutches.
Skip business jargon and meta-commentary checks for personal notes.

**(d)** Methods sections within academic-formal may relax hedging, transitions, and rhythm
for procedural precision. Epistemic caution ("may", "could", "suggests") is appropriate
in methods. Formal transitions may aid procedural clarity. Rhythm may be even for
procedural sequences.

**(e)** New structural patterns include: copula avoidance, synonym cycling, vague
attributions, significance inflation, promotional language, false ranges, novelty
inflation, emotional flatline, false concession, parenthetical hedging, numbered list
inflation, reasoning chain artifacts, sycophantic tone, acknowledgment loops, superficial
-ing analyses, formulaic challenges, excessive structure.

**(f)** Partial conversational voice test for academic-human: apply to topic sentences,
paragraph transitions, and discussion framing. Skip technical descriptions, statistical
reporting, and method references within discussion sections.

---

## Auto-Detection Cues

When no context parameter is provided and the caller does not specify a cluster,
infer from these signals:

| Signal | Inferred cluster |
|---|---|
| Salutation ("Hi", "Dear", "Oi") + short body + sign-off | professional-message |
| Academic section headings (Methods, Results, Discussion, Literature Review) | academic-formal or academic-human (by heading) |
| WhatsApp, SMS, or quick note indicators | informal-message |
| No clear signals | professional-message (safest default) |

---

## Em-dash Rule

The em-dash rule is absolute zero across all clusters. No exceptions, no "1 per 1,000
words" relaxation. This overrides any external source. Both the Unicode em dash and the
double-hyphen substitute are caught.
