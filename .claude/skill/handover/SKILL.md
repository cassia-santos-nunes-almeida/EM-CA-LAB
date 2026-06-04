---
name: handover
description: >
  Use when: "write me a handover", "end of session", "save session",
  "new chat handover", "context transfer", "I'm starting a new chat",
  "handover document", "session summary to Notion", "fetch my
  handover", "load session context", "continue from last session",
  "what was I working on", "pick up where we left off", "load my
  last handover", "what did we do on X".
  Always use this skill instead of writing ad-hoc summaries or
  searching Notion manually.
---

# Handover Skill

Saves and retrieves structured session handover documents from a Notion "Session Handovers" database. Maintains continuity across Claude chats for parallel long-running projects.

---

## MODE DETECTION

Read the user's trigger phrase and determine mode:

| Mode | Trigger signals |
|------|----------------|
| **SAVE** | "write me a handover", "end of session", "save session", "new chat handover", "context transfer", "I'm starting a new chat" |
| **FETCH** | "fetch my handover", "load session context", "continue from last session", "what was I working on", "pick up where we left off" |

If ambiguous, ask: *"Do you want to save a handover for this session, or fetch one from a previous session?"*

---

## FIRST-RUN: DATABASE SETUP

Before the first SAVE, check whether "Session Handovers" already exists:

```
Notion:notion-search  query="Session Handovers"  query_type="internal"
```

**If found:** note the page URL from results. Call `Notion:notion-fetch` on that URL to get the `data_source_id` from the `<data-source url="collection://...">` tag in the response. Store that ID — it's needed for every SAVE.

**If NOT found:** create the database using SQL DDL syntax. Read the
tags from `references/projects.md` (parse the `**Tag:**` line of each
`##` entry, excluding the `Other` free-text entry) and build the
`"Project"` SELECT options from that list, appending `'Other':default`
at the end. Before running the DDL, **show the full CREATE TABLE
statement to the user and ask them to confirm** — the shipped
`projects.md` belongs to the skill's maintainer, so the first
first-run is the user's chance to replace any tags they don't
recognise as theirs. Example shape:

```
Notion:notion-create-database
  title: "Session Handovers"
  schema: CREATE TABLE (
    "Title" TITLE,
    "Project" SELECT('Tag1':blue, 'Tag2':green, 'Tag3':orange, 'Other':default),
    "Date" DATE,
    "Status" SELECT('Active':green, 'Archived':gray)
  )
```

After the DDL runs, tell the user they can edit `references/projects.md`
to refine the project list later, and point them to Notion's UI to add
matching SELECT options to the database when they do.

Note: `parent` is omitted → database is created as a private workspace-level page. Tell the user: *"Created 'Session Handovers' in Notion as a private page. You may want to move it to the right place in your workspace."*

After creation, call `Notion:notion-fetch` on the returned database URL to get the `data_source_id`. Store it.

---

## SAVE MODE

### Step 1 — Identify the project

Read `references/projects.md` to load auto-detection signals for each project. Scan the full conversation for matching signals.

**If one project clearly matches:** confirm with the user — *"This looks like a [Project] session — saving under that project. Correct?"*

**If unclear or multiple projects touched:** ask —
> *"Which project should I tag this handover under? Options: [list the tags from references/projects.md], or 'Other' (type a name)."*

Do not proceed until project is confirmed.

### Step 2 — Draft the handover

If `SESSION.md` exists in the project, read it first to pre-populate:
- Section 1 (goal) from SESSION.md current milestone
- Section 4 (files touched) from SESSION.md completed tasks
- Section 6 (next steps) from SESSION.md immediate next steps
- Section 7 (open questions) from SESSION.md blockers

Then synthesize from the full conversation context. Produce this draft and show it to the user **before saving anything**:

```
# Handover — [Project] — [YYYY-MM-DD]

## 1. What we're building / working on
[1–3 sentences on the goal of this session]

## 2. Decisions locked in
[Bullet list — only firm decisions, not open options]

## 3. Critical context a new chat would miss
[Failed attempts, constraints discovered, implicit assumptions,
naming conventions, gotchas found — anything not obvious from output alone]

## 4. Repos / files / URLs touched this session
[File paths, GitHub branches, Vercel URLs, Notion pages, CSVs — anything
a new Claude session would need to locate to continue]

## 5. Dependencies / blockers on other projects
[e.g. "Upstream library bug must be fixed before this analysis is final"]

## 6. What comes next
[Ordered list of immediate next actions]

## 7. Open questions to pick up first
[Unresolved decisions or unknowns to address at the start of next session]

## 8. New patterns for PATTERNS.md
[Any failure, correction, or rule discovered this session that should
become a permanent entry in PATTERNS.md. Format each candidate as:
  Category: STACK / DIAG / MSG / ENV / EXEC
  Title: [short descriptive title]
  Pattern: what kept happening
  Rule: the concrete fix
Leave empty if none — do not write "N/A" or "Nothing to add".]
```

Tell the user: *"Here's the draft. Edit anything in the chat or tell me what to change — I'll update and save when you're happy."*

### Step 3 — Iterate until approved

Apply edits, re-show the updated draft. Repeat until user says "looks good", "save it", "go ahead", or equivalent.

**Do not save to Notion until the user explicitly approves.**

### Step 3b — Final quality pass (automatic, before showing any draft)

Run `stop-slop` silently on the handover draft before showing it to
the user and again before saving to Notion. Cluster: `professional-message`
(handover prose is a written note to a future-you, not an academic
paper — professional tone, no SEFI-style hedging, no academic register).

stop-slop handles banned-phrase detection, conversational-voice test,
and the pasta test. See `stop-slop/SKILL.md` for execution order.

**Hard constraint:** cosmetic only. Must never alter meaning, drop
sections, weaken a concrete fact, or change a named identifier
(commit hashes, file paths, user-supplied terminology). Handover
content is *specifically* where future-you needs the raw truth — do
not polish away specificity.

**Always surface a one-line signal** after running (per P-WRITE-01):
`[stop-slop: clean]`, `[stop-slop: N edits applied]`, or
`[stop-slop: N tells left intentionally — <reason>]`. Never run
silently with no signal.

### Step 4 — Save to Notion

Once approved:

1. If `data_source_id` is not yet known from FIRST-RUN, search + fetch "Session Handovers" now to get it.
2. Create the page:

```
Notion:notion-create-pages
  parent: { type: "data_source_id", data_source_id: <Session Handovers data_source_id> }
  pages: [{
    properties: {
      "Title": "Handover — [Project] — [YYYY-MM-DD]",
      "Project": "[confirmed project tag]",
      "Status": "Active",
      "date:Date:start": "[YYYY-MM-DD]",
      "date:Date:is_datetime": 0
    },
    content: "[full approved markdown]"
  }]
```

Confirm: *"Saved ✓ — 'Handover — [Project] — [Date]' is in your Session Handovers database."*

---

## FETCH MODE

### Step 1 — Identify the project

Read `references/projects.md`. Scan context for project signals. If unclear, ask:
> *"Which project? Options: [list the tags from references/projects.md], or 'Other'."*

### Step 2 — Find the database and search within it

First, locate the "Session Handovers" database:

```
Notion:notion-search  query="Session Handovers"  query_type="internal"
```

From results, identify the database entry (type: "database"). Call `Notion:notion-fetch` on its URL to get the `data_source_id` from the `<data-source url="collection://...">` tag.

Then search **within** the database (more reliable than global search, works for new pages):

```
Notion:notion-search
  query: "Handover [Project]"
  query_type: "internal"
  data_source_url: "collection://[data_source_id]"
```

**Important:** notion-search cannot filter by Status or sort by date. Handle this manually in Step 3.

### Step 3 — Select the right page

From the results:
- Filter to results whose title matches the pattern `Handover — [Project] — ...`
- If one result: proceed directly
- If multiple: identify the most recent by date in the title, then show the user a short list:

```
Found 3 handovers for [Project]:
1. Handover — [Project] — 2026-03-31  ← loading this one
2. Handover — [Project] — 2026-03-28
3. Handover — [Project] — 2026-03-24
Let me know if you want a different one.
```

- If no results: *"No saved handovers found for [Project]. Different project name, or start fresh?"*

### Step 4 — Fetch full content

Call `Notion:notion-fetch` with the page URL or ID from the search result to retrieve the full handover text. Do not rely on the search snippet — it's truncated.

```
Notion:notion-fetch  id: <page_url_from_search_result>
```

### Step 5 — Present and signal readiness

Display the full handover content. End with:
> *"Context loaded from [date]. Ready to continue — what's the first thing you want to tackle?"*

If section 8 (New patterns for PATTERNS.md) in the fetched handover
is non-empty: before asking what to tackle, say:
> *"The previous session logged [N] candidate PATTERNS.md entries.
> Want me to add them now before we start?"*
If yes: read PATTERNS.md, add the entries in the correct format
with the next available P-[CATEGORY]-NN numbers, commit.

---

## PROJECT LIST

Read `references/projects.md` for project descriptions and keyword signals.  
Always read this file during Steps 1 of both SAVE and FETCH modes.

If the user names a project not on the list, tag it as free text under "Other" and note: *"If you use this project regularly, add it to references/projects.md in the handover skill."*

**Repeated unnamed project detection:**
If the user names a project not in `references/projects.md` AND
it has appeared in this conversation more than once: after completing
Step 4 (saving to Notion), ask:
> *"I notice '[Project]' isn't in your project list. Want me to add
> it to references/projects.md with the keyword signals I detected
> this session? This will help auto-detect it in future sessions."*
If yes: read references/projects.md, add the new project entry
following the existing format, and commit the change.

---

## RULES

- **Never save without explicit user approval** of the draft.
- **Never guess the project silently** — always confirm if there's any ambiguity.
- **All 7 sections are required.** If context is thin, write "Not discussed this session" rather than omitting.
- Written **for a cold Claude** — assume zero prior context. Be explicit, not terse.
- No AI slop: no "In conclusion", no "It's worth noting", no "comprehensive overview". Write like a dev handing off to a colleague.
- `stop-slop` is run as Step 3b above on every draft and must emit a visible signal line (see P-WRITE-01 in shared-patterns.md). If the signal is missing, the quality pass did not fire — rerun it.
