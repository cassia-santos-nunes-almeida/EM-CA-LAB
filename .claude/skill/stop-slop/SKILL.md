---
name: stop-slop
description: >
  Use this skill whenever Claude is about to deliver prose of any kind -- emails,
  papers, reports, student materials, lecture notes, any written output. Also trigger
  when Cássia says "check this for AI patterns," "audit my writing," "de-slop this,"
  "remove AI language," "make this sound more human," or "clean up my text." Invoked
  automatically as a final quality pass by message-coach and eer-paper-writing. Detects
  and removes predictable AI writing patterns: filler phrases, passive voice, formulaic
  structures, hedging density, and sentence monotony. Supports four enforcement clusters
  from informal messages to formal academic prose.
metadata:
  trigger: Writing prose, editing drafts, reviewing content for AI patterns. Also invoked by message-coach and eer-paper-writing as a final quality pass.
  author: "Adapted from Hardik Pandya (https://hvpandya.com), extended by Cassia Almeida. Patterns cross-validated 2026-04-18 against Wikipedia:Signs_of_AI_writing (CC-BY-SA 4.0) and blader/humanizer (MIT)."
---

# Stop Slop

Shared voice-and-pattern quality layer. Detect and remove predictable AI writing patterns from prose.

## Invocation

stop-slop accepts an optional `context` parameter selecting one of four enforcement clusters. When called without a parameter, it defaults to `professional-message`.

| Cluster | Covers | Character |
|---|---|---|
| `informal-message` | Personal notes, quick internal writing | Lightest enforcement |
| `professional-message` | Teams, emails, student materials, lectures | Full enforcement (default) |
| `academic-formal` | Methods, results, literature review | Strict patterns, skip conversational voice test |
| `academic-human` | Discussion, conclusion, introduction, abstract | Full patterns, partial conversational voice test |

See [references/context-profiles.md](references/context-profiles.md) for the full tolerance matrix and auto-detection cues.

## Core Rules

1. **Cut filler phrases.** Remove throat-clearing openers, emphasis crutches, and all adverbs. See [references/banned-phrases.md](references/banned-phrases.md).

2. **Break formulaic structures.** Avoid binary contrasts, negative listings, dramatic fragmentation, rhetorical setups, false agency, copula avoidance, synonym cycling, and all structural AI patterns. See [references/banned-structures.md](references/banned-structures.md).

3. **Use active voice.** Every sentence needs a human subject doing something. No passive constructions. No inanimate objects performing human actions ("the complaint becomes a fix").

4. **Be specific.** No vague declaratives ("The reasons are structural"). Name the specific thing. No lazy extremes ("every," "always," "never") doing vague work.

5. **Put the reader in the room.** No narrator-from-a-distance voice. "You" beats "People." Specifics beat abstractions.

6. **Vary rhythm.** Mix sentence lengths. Two items beat three. End paragraphs differently. No em dashes. Zero tolerance, all clusters.

7. **Trust readers.** State facts directly. Skip softening, justification, hand-holding.

8. **Cut quotables.** If it sounds like a pull-quote, rewrite it.

## Quick Checks

Before delivering prose:

- Any adverbs? Kill them.
- Any passive voice? Find the actor, make them the subject.
- Inanimate thing doing a human verb ("the decision emerges")? Name the person.
- Sentence starts with a Wh- word? Restructure it.
- Any "here's what/this/that" throat-clearing? Cut to the point.
- Any "not X, it's Y" contrasts? State Y directly.
- Three consecutive sentences match length? Break one.
- Paragraph ends with punchy one-liner? Vary it.
- Em-dash anywhere? Remove it. Zero tolerance.
- Any curly quotes, emoji, or Title Case Heading? Fix.
- Any cutoff or sourcing disclaimer ("as of my last update", "based on available information")? Delete.
- Vague declarative ("The implications are significant")? Name the specific implication.
- Narrator-from-a-distance ("Nobody designed this")? Put the reader in the scene.
- Meta-joiners ("The rest of this essay...")? Delete.
- More than ~25% of sentences share an opener? Vary them.
- Three or more Tier 2 words in one paragraph? Replace with simpler alternatives.
- Three or more hedges in one paragraph? Commit or cut.
- More than two formal transitions per page? Remove or restructure.
- All paragraphs roughly the same length? Break the pattern.
- Spot the three-beat setup-bridge-point? Collapse to the point.
- Copula avoidance ("serves as," "features," "boasts")? Use "is" or "has."
- Synonym cycling in one paragraph? Repeat the right word.

## Statistical Detection Patterns

Subtler tells that survive after the obvious slop is removed.

### 9. Sentence opener monotony
If more than ~25% of sentences start with the same word, rewrite openers to vary them.

### 10. Vocabulary clustering
Detect using the three-tier system in [references/banned-phrases.md](references/banned-phrases.md). Tier 1: always replace. Tier 2: catch 2+ in one paragraph. Tier 3: catch at high density only.

### 11. Hedging density
Three or more hedges per paragraph is a problem. Commit to the claim or cut it. **Exception:** Methods sections in academic papers may need more hedging. Scoped by the academic-formal cluster.

### 12. Transition word overload
"However," "Moreover," "Furthermore," "Additionally" appearing more than twice per page. Remove or restructure.

### 13. Paragraph length uniformity
If all paragraphs are within ~20% of each other in length, break the pattern.

### 14. Setup-then-deliver pattern
Collapse the three-beat "[Context]. [Bridge]. [Point]." pattern. Lead with the point.

## Execution Order

1. **Pattern matching:** Core rules (1-8), quick checks, statistical detection (9-14), structural patterns
2. **Conversational voice test:** Scoped by cluster. See [references/self-audit.md](references/self-audit.md).
3. **Pasta test:** Runs on all clusters. See [references/self-audit.md](references/self-audit.md).
4. **Scoring:** 5-dimension rubric (only when requested or on full audit)
5. **Final em-dash gate (mandatory, runs last, never skipped):** Before declaring any version clean or delivering output, scan the text character by character for any em-dash (`—`, Unicode U+2014) or en-dash (`–`, Unicode U+2013). If any are found, replace with comma, period, or semicolon as appropriate. This gate runs even when all prior checks reported clean. The rule is absolute across all four clusters with no exception. Do not confuse em-dash with hyphen (`-`, U+002D): hyphens in compound words (`end-to-end`, `cross-functional`) are fine; the ban is on dashes used as punctuation. If you catch an em-dash at this stage, the correct narration is "removed 1 em-dash at final gate," matching the "removed N em-dashes" wording used by callers in their version/section footers. Do not report "clean" for a version that had an em-dash caught at any stage.

## Hard Constraints

**The de-AI audit is cosmetic only.** It must never alter meaning, remove content, add new ideas, or override the caller's voice fingerprint. When choosing between "sounds slightly AI" and "changes what the text says," always keep the meaning. When in doubt, leave the text as-is.

**Self-reference escape hatch.** When writing about AI writing patterns (blog posts, tutorials, skill documentation), quoted examples are exempt from detection. Only catch patterns that appear in the author's own prose, not in cited examples of bad writing.

**Over-polishing warning.** Aggressively removing every irregularity can push human writing toward AI statistical profiles. Natural disfluency, idiosyncratic word choices, and uneven pacing keep text out of the "AI-generated" classification. Watch for three cosmetic signs the rewrite has overshot:

- Every sentence within 5 words of the same length: vary one.
- Every idiosyncratic word normalized to its plainest synonym: keep one.
- Zero hedges remaining where genuine uncertainty exists: restore one.

This skill should make writing sound more human, not less. Voice-level signs of over-polish (first-person use, opinions, symmetric framing) are owned by the voice layer in `style/writing-voice.md` and `style/signs-of-over-polish.md`.

**Backward compatibility.** stop-slop remains fully functional when called without a context parameter. The default cluster is `professional-message`.

## Scoring

Rate 1-10 on each dimension:

| Dimension | Question |
|---|---|
| Directness | Statements or announcements? |
| Rhythm | Varied or metronomic? |
| Trust | Respects reader intelligence? |
| Authenticity | Sounds human? |
| Density | Anything cuttable? |

Below 35/50: revise.

## Reference Files

| File | Contains |
|---|---|
| [references/banned-phrases.md](references/banned-phrases.md) | Tiered banned words (1/2/3), phrases, transitions, chatbot artifacts |
| [references/banned-structures.md](references/banned-structures.md) | All banned structural patterns (original + avoid-ai-writing additions) |
| [references/before-after.md](references/before-after.md) | Before/after transformation examples |
| [references/context-profiles.md](references/context-profiles.md) | Cluster definitions, tolerance matrix, auto-detection cues |
| [references/self-audit.md](references/self-audit.md) | Conversational voice test and pasta test with scoping rules |

## License

MIT
