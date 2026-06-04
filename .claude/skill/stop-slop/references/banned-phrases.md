# Banned Phrases and Words

Words and phrases are organized into three tiers based on how reliably they signal
AI-generated text. This tiered approach reduces false positives on words that are
fine in isolation but suspicious in clusters.

- **Tier 1: Always replace.** These words appear far more often in AI text than
  human text. Replace on sight.
- **Tier 2: Catch in clusters.** Individually fine, but two or more in the same
  paragraph is a strong AI signal. Catch when they appear together.
- **Tier 3: Catch by density.** Common words that AI overuses. Only catch when
  they make up a noticeable fraction of the text (roughly 3%+ of total words).

---

## Tier 1: Always Replace

### Throat-Clearing Openers

Remove these announcement phrases. State the content directly.

- "Here's the thing:"
- "Here's what [X]"
- "Here's this [X]"
- "Here's that [X]"
- "Here's why [X]"
- "The uncomfortable truth is"
- "It turns out"
- "The real [X] is"
- "Let me be clear"
- "The truth is,"
- "I'll say it again:"
- "I'm going to be honest"
- "Can we talk about"
- "Here's what I find interesting"
- "Here's the problem though"

Any "here's what/this/that" construction is throat-clearing before the point. Cut it and state the point.

### Emphasis Crutches

These add no meaning. Delete them.

- "Full stop." / "Period."
- "Let that sink in."
- "This matters because"
- "Make no mistake"
- "Here's why that matters"

### Business Jargon

Replace with plain language.

| Avoid | Use instead |
|-------|-------------|
| Navigate (challenges) | Handle, address |
| Unpack (analysis) | Explain, examine |
| Lean into | Accept, embrace |
| Landscape (context) | Situation, field |
| Game-changer | Significant, important |
| Double down | Commit, increase |
| Deep dive | Analysis, examination |
| Take a step back | Reconsider |
| Moving forward | Next, from now |
| Circle back | Return to, revisit |
| On the same page | Aligned, agreed |
| Touch base | Check in, talk about, discuss |
| As per my last email | (cut; restate the point directly) |

### Hyphenated Business-Speak Pairs

Pre-compounded qualifiers read as deck or pitch language. Pick a specific word or phrase instead.

| Avoid | Use instead |
|-------|-------------|
| cross-functional | across teams |
| data-driven | based on data, uses data |
| customer-centric | focused on customers |
| user-centric | focused on users |
| forward-thinking | (describe the actual thinking) |
| future-proof | lasting, durable |
| end-to-end | complete, full |
| results-driven | (describe the results) |
| mission-critical | essential, required |
| growth-minded | (describe the mindset) |
| purpose-driven | (state the purpose) |
| value-added | useful, worth it |
| solution-oriented | practical |

"World-class", "state-of-the-art", and "best-in-class" stay at Tier 3 (density detection) because they appear in legitimate benchmark comparisons. The pairs above are slot-fill qualifiers that rarely add meaning.

### Adverbs

Kill all adverbs. No -ly words. No softeners, no intensifiers, no hedges.

Specific offenders:

- "really"
- "just"
- "literally"
- "genuinely"
- "honestly"
- "simply"
- "actually"
- "deeply"
- "truly"
- "fundamentally"
- "inherently"
- "inevitably"
- "interestingly"
- "importantly"
- "crucially"

Also cut these filler phrases:

- "At its core"
- "In today's [X]"
- "It's worth noting"
- "It is important to note" / "It is important to note that"
- "At the end of the day"
- "When it comes to"
- "In a world where"
- "The reality is"

### Meta-Commentary

Remove self-referential asides. The essay should move, not announce its own structure.

- "Hint:"
- "Plot twist:" / "Spoiler:"
- "You already know this, but"
- "But that's another post"
- "X is a feature, not a bug"
- "Dressed up as"
- "The rest of this essay explains..."
- "Let me walk you through..."
- "In this section, we'll..."
- "As we'll see..."
- "I want to explore..."

### Performative Emphasis

False intimacy or manufactured sincerity:

- "creeps in"
- "I promise"
- "They exist, I promise"

### Telling Instead of Showing

Announcing difficulty or significance rather than demonstrating it:

- "This is genuinely hard"
- "This is what leadership actually looks like"
- "This is what X actually looks like"
- "actually matters"

### Vague Declaratives

Sentences that announce importance without naming the specific thing. Kill these.

- "The reasons are structural"
- "The implications are significant"
- "This is the deepest problem"
- "The stakes are high"
- "The consequences are real"

If a sentence says something is important/deep/structural without showing the specific thing, cut it or replace it with the specific thing.

### Tier 1 Word Replacements (from avoid-ai-writing)

These words appear far more often in AI text than human text. Replace on sight.

| Replace | With |
|---|---|
| crucial | important, key, necessary |
| vital | important, essential, necessary |
| groundbreaking | significant, new, first (or describe what it changed) |
| tapestry | (describe the actual complexity) |
| realm | area, field, domain |
| paradigm | model, approach, framework |
| embark | start, begin |
| beacon | (rewrite entirely) |
| testament to | shows, proves, demonstrates |
| robust | strong, reliable, solid |
| comprehensive | thorough, complete, full |
| cutting-edge | latest, newest, advanced |
| pivotal | important, key |
| underscores | highlights, shows |
| meticulous / meticulously | careful, detailed, precise |
| seamless / seamlessly | smooth, easy, without friction |
| hit differently / hits different | (say what changed, or cut) |
| utilize | use |
| watershed moment | turning point, shift |
| marking a pivotal moment | (state what happened) |
| the future looks bright | (cut or say something specific) |
| only time will tell | (cut or say something specific) |
| nestled | is located, sits |
| vibrant | (describe what makes it active, or cut) |
| thriving | growing, active (or cite a number) |
| despite challenges...continues to thrive | (name challenge and response, or cut) |
| showcasing | showing, demonstrating |
| bustling | busy, active |
| intricate / intricacies | complex, detailed (or name the specifics) |
| complexities | (name them, or use "problems" / "details") |
| ever-evolving | changing, growing (or describe how) |
| enduring | lasting, long-running |
| daunting | hard, difficult, challenging |
| holistic / holistically | complete, full, whole |
| actionable | practical, useful, concrete |
| impactful | effective, significant (or describe the impact) |
| learnings | lessons, findings, takeaways |
| thought leader / thought leadership | expert, authority |
| best practices | what works, proven methods |
| synergy / synergies | (describe the combined effect) |
| interplay | relationship, connection, interaction |
| in order to | to |
| due to the fact that | because |
| serves as | is |
| features (verb, inflated) | has, includes |
| boasts | has |
| presents (inflated) | is, shows |
| commence | start, begin |
| ascertain | find out, determine |
| endeavor | effort, attempt, try |
| keen (as intensifier) | interested, eager |
| symphony (metaphor) | (describe the coordination) |
| embrace (metaphor) | adopt, accept, use |
| Additionally (sentence-opener) | (cut, use "also", or restructure) |
| align with | match, fit, agree with |
| delve | explore, look at, examine |
| enhance | improve, strengthen, add to |
| garner | earn, receive, collect |
| focal point | center, key part (or name the specific thing) |
| indelible mark | (describe the specific change, or cut) |
| deeply rooted | (name the origin, or cut) |
| setting the stage for | (state what it enables, or cut) |
| shaping the | (describe how, or use "changed", "influenced") |
| reflects broader | (name the broader thing, or cut) |
| profound | (describe the specific effect) |
| exemplifies | shows, illustrates, is an example of |
| in the heart of | in, at the center of |
| breathtaking | (describe what's impressive) |
| stunning | (describe what's impressive) |
| renowned | well-known, respected |
| commitment to | (state the specific action, or cut) |
| in the event that | if |
| has the ability to | can |
| at this point in time | now |
| up to my last training update | (cut; cutoff disclaimer) |

### Vague Endorsement Phrases

These substitute a generic thumbs-up for a specific reason. Say why something matters instead.

- "worth reading"
- "worth paying attention to"
- "worth a look"
- "worth exploring"
- "worth checking out"
- "worth your time"

### Template Phrases (Slot-Fill Constructions)

If a phrase has a blank where any noun or adjective could go and still sound the same, it is too generic.

- "a [adjective] step towards/forward for [noun]" (describe the specific capability or outcome)
- "Whether you're [X] or [Y]" (false-breadth construction; pick the actual audience)
- "I recently had the pleasure of [verb]-ing" (review/social AI pattern; just say what happened)

### Transition Phrases to Remove or Rewrite

- "In an era where" (cut or state specific context)
- "Here's what's interesting / Here's what caught my eye / Here's what stood out" (reader-steering frames; let the content signal its own importance)
- "In conclusion" / "In summary" / "To summarize" (your conclusion should be obvious)
- "When it comes to" (just talk about the thing directly)
- "That said" / "That being said" (cut or use "but")

### Generic Conclusions

Filler disguised as conclusions. Cut or replace with something specific to the argument.

- "The future looks bright"
- "Only time will tell"
- "One thing is certain"
- "As we move forward"

### Chatbot Artifacts

Conversational tics from chat interfaces, not writing. Remove entirely.

- "I hope this helps!"
- "I hope this message finds you well"
- "Certainly!" / "Absolutely!"
- "Great question!" / "Excellent point!"
- "Feel free to reach out"
- "Please don't hesitate to reach out"
- "Let me know if you need anything else"
- "In this article, we will explore..."
- "Let's dive in!"

### Cutoff and Sourcing Disclaimers

Phrases that announce knowledge limits or an information cutoff. These are chatbot-internal notes, not prose the reader needs. Delete them.

- "based on available information"
- "as of my last update"
- "as of my knowledge cutoff"
- "details are limited in available sources"
- "information is limited in available sources"
- "I don't have access to"
- "according to my training data"
- "I cannot verify this"

If a source is genuinely missing, state it specifically ("I could not find a 2025 enrollment number for LUT") or cut the claim.

### Confidence Calibration Phrases

These tell the reader how to feel about a fact instead of letting the fact speak for itself.

- "Interestingly" / "Surprisingly" / "Importantly" / "Significantly" / "Notably"
- "Certainly" / "Undoubtedly" / "Without a doubt"
- "Here's what's interesting" / "Here's the interesting part"

One "notably" in a 2,000-word piece is fine. Three in 500 words is emphasis stacking.

---

## Tier 2: Catch in Clusters

These words are legitimate on their own. When two or more show up in the same paragraph,
the paragraph likely needs a rewrite.

| Replace | With |
|---|---|
| harness | use, take advantage of |
| navigate / navigating | work through, handle, deal with |
| foster | encourage, support, build |
| elevate | improve, raise, strengthen |
| unleash | release, enable, unlock |
| streamline | simplify, speed up |
| empower | enable, let, allow |
| bolster | support, strengthen, back up |
| spearhead | lead, drive, run |
| resonate / resonates with | connect with, appeal to, matter to |
| revolutionize | change, transform, reshape |
| facilitate / facilitates | enable, help, allow, run |
| underpin | support, form the basis of |
| nuanced | specific, subtle, detailed (or name the nuance) |
| multifaceted | (describe the facets, or cut) |
| ecosystem (metaphor) | system, community, network |
| myriad | many, numerous (or give a number) |
| plethora | many, a lot of (or give a number) |
| encompass | include, cover, span |
| catalyze | start, trigger, accelerate |
| reimagine | rethink, redesign, rebuild |
| galvanize | motivate, rally, push |
| augment | add to, expand, supplement |
| cultivate | build, develop, grow |
| illuminate | clarify, explain, show |
| elucidate | explain, clarify, spell out |
| juxtapose | compare, contrast, set side by side |
| paradigm-shifting | (describe what shifted) |
| transformative / transformation | (describe what changed and how) |
| cornerstone | foundation, basis, key part |
| paramount | most important, top priority |
| poised (to) | ready, set, about to |
| burgeoning | growing, emerging (or cite a number) |
| nascent | new, early-stage, emerging |
| quintessential | typical, classic, defining |
| overarching | main, central, broad |
| underpinning / underpinnings | basis, foundation, what supports |

**Note:** "crucial" and "vital" are promoted to Tier 1 (always replace) because they were
banned outright in message-coach and eer-paper-writing. Under the layered architecture,
stop-slop must enforce at least the strictest rule from any caller.

---

## Tier 3: Catch by Density

These are normal words. Only catch them when the text is saturated with them (roughly 3%+
of total words or 4+ instances per page).

| Word | What to do |
|---|---|
| significant / significantly | Replace some with specifics: numbers, comparisons, examples |
| innovative / innovation | Describe what is actually new |
| effective / effectively | Say how, or cite a metric |
| dynamic / dynamics | Name the actual forces or changes |
| scalable / scalability | Describe what scales and to what |
| compelling | Say why it compels |
| unprecedented | Name the precedent it breaks (or cut) |
| exceptional / exceptionally | Cite what makes it an exception |
| remarkable / remarkably | Say what is worth remarking on |
| sophisticated | Describe the sophistication |
| instrumental | Say what role it played |
| world-class / state-of-the-art / best-in-class | Cite a benchmark or comparison |

**Note:** The existing vocabulary cluster list (notably, particularly, significantly,
ultimately, essentially, fundamentally, comprehensive, robust, facilitate, utilize,
foster, enhance, underscore, pivotal, critical, transformative, innovative, streamline,
employing, spanning, bolster) is preserved. Words that appear in both that list and Tier 1
above (robust, comprehensive, pivotal, underscores, utilize, enhance) are promoted to Tier 1
(always replace). The rest remain in their respective tiers.
