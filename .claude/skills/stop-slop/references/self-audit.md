# Self-Audit Passes

Two self-audit passes run as part of every stop-slop invocation. They execute after the
pattern-matching checklist and before scoring. Both are automatic (not on-request).

Hard constraint: these passes are cosmetic only. They must never alter meaning, remove
content, add new ideas, or override the caller's voice rules. When choosing between
"sounds slightly AI" and "changes what the text says," always keep the meaning.

---

## Execution Order

1. **Pattern matching** (core rules 1-8, quick checks, statistical detection 9-14, all structural patterns)
2. **Pass 1: Conversational voice test** (scoped by cluster)
3. **Pass 2: Pasta test** (runs on all clusters)
4. **Scoring** (5-dimension rubric, only when requested or on full audit)

---

## Pass 1: Conversational Voice Test

### Instruction

Read back what you just wrote. Mark every word or phrase that a human would never say
in a real conversation. Rewrite the draft replacing each one. If you are not sure whether
a phrase sounds human, it does not.

### Scope by cluster

| Cluster | Runs? | Details |
|---|---|---|
| informal-message | Yes, strict | Apply to all text. |
| professional-message | Yes, strict | Apply to all text. |
| academic-formal | **No, skip** | Methods, results, and literature review use formal register by design. Conversational naturalness is not the goal. |
| academic-human | **Partial** | Apply to topic sentences, paragraph transitions, and discussion framing. Skip technical descriptions, statistical references, and method summaries within discussion/conclusion sections. |

### What this pass catches

Phrasing that passes the pattern checklist but still sounds like no human would say it
in conversation. Examples:

- "It is imperative that we consider" (a human would say "we need to think about")
- "This underscores the importance of" (a human would say "this shows why X matters")
- "The aforementioned approach" (a human would say "the approach we described")
- "It bears mentioning that" (a human would just say the thing)

The test is not about making text casual. It is about catching phrases that exist only
in AI-generated or over-formal writing and have no natural spoken equivalent.

---

## Pass 2: Pasta Test

### Instruction

Go through the draft line by line. Delete or rewrite every sentence that could apply to
any topic. Test: if the sentence works equally well for your actual topic and for "how to
cook pasta", it is too generic and it has to go. Replace what you cut with something only
you could say about this topic, drawing on your specific context, data, experience, or
perspective.

### Scope by cluster

| Cluster | Runs? | Details |
|---|---|---|
| informal-message | Yes, strict | Even short messages should say something specific. |
| professional-message | Yes, strict | Full application. |
| academic-formal | Yes, strict | Methods sections are inherently specific (participants, procedures, instruments). The test catches generic methodology boilerplate. |
| academic-human | Yes, strict | Discussion and conclusion sections are the most vulnerable to generic filler. Full application. |

### What this pass catches

Sentences that sound fine but carry no specific information. Examples:

- "This approach has several advantages." (What advantages? Name them.)
- "The results were encouraging." (What results? What was encouraging about them?)
- "This is an important area of research." (Why? For whom?)
- "We hope this contributes to the ongoing discussion." (What discussion? What does it contribute?)
- "There are many factors to consider." (Name the factors.)

The test is "delete or rewrite", not strictly "delete." Transitional sentences may need
to be rewritten to carry more information rather than cut entirely.

### Why this runs on all clusters

Specificity is universal. A vague sentence in an informal WhatsApp message wastes the
reader's time just as much as a vague sentence in a research paper. The pasta test is
the final quality gate because no amount of pattern matching can substitute for saying
something specific about your actual topic.
