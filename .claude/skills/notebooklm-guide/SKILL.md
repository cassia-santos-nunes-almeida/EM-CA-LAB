---
name: notebooklm-guide
description: >
  Orchestration guide for the notebooklm-mcp server. Routes natural language requests
  to the correct MCP tool chains, handles auth recovery, manages a notebook alias registry,
  and surfaces underused capabilities like content generation, research pipelines, and
  source management. Use this skill whenever the user mentions NotebookLM, asks to query
  notebooks or documentation, wants to generate study materials (flashcards, quizzes,
  reports, audio/video overviews, mind maps, infographics, slide decks), needs to fix
  NotebookLM authentication, shares a notebooklm.google.com URL, asks to add or sync
  sources, wants to research a topic and build a notebook, or references any notebooklm-mcp
  tool by name. Also trigger when the user says things like "ask my docs," "check my
  notebook," "what does my textbook say about X," "generate flashcards," "create an
  audio overview," "sync my sources," or "NotebookLM is broken."
---

# NotebookLM MCP Orchestration Guide

This skill tells you how to use the 32 tools in the `notebooklm-mcp` server effectively.
It is not a replacement for the MCP. It is a routing layer that translates user intent
into the right tool chains, with correct sequencing, confirmation rules, and error handling.

For detailed tool parameters and options, consult the notebooklm-mcp server's own documentation or the tool schemas surfaced by your MCP client.

## Auth Recovery

Authentication failures are the most common problem. When any notebooklm-mcp call returns
an auth error ("Authentication expired", RPC Error 16, or similar), follow this escalation
ladder. Do not skip steps.

**Step 1: Reload tokens and verify.**
Call `refresh_auth`. Regardless of its return status (it may report success even with
expired tokens), always verify by calling `notebook_list`. If notebook_list succeeds,
retry the user's original operation. If notebook_list still fails with an auth error,
proceed to Step 2.

**Step 2: Re-authenticate via CLI (terminal environments only).**
If the user has terminal access (Claude Code, local shell):
tell them to run `notebooklm-mcp-auth` in their terminal, then wait for confirmation.
After they confirm, call `refresh_auth`, then verify with `notebook_list`.

**Step 3: Manual cookie extraction (last resort, any environment).**
If the CLI is unavailable (e.g., claude.ai) or Step 2 failed:
1. Tell the user to open https://notebooklm.google.com in Chrome
2. Open DevTools (F12) > Network tab
3. Reload the page
4. Click any request to notebooklm.google.com
5. In the Headers tab, find the "Cookie" request header
6. Copy the entire Cookie value and paste it in the chat
7. Call `save_auth_tokens` with that cookies string
8. Verify with `notebook_list`

After any successful recovery, always verify with `notebook_list` before proceeding.

**Proactive auth check for long sessions.** NotebookLM auth tokens can expire mid-session and fail silently. Before retrying any content operation that returned an error, check for auth errors first and re-authenticate proactively if the session has been running long. Do not assume a mid-session failure is a content-pipeline bug until auth has been re-verified via `notebook_list`.

## Error Handling

Not all failures are auth errors. Distinguish these cases:

**Auth expired** ("Authentication expired", "RPC Error 16"): Follow the auth recovery
ladder above.

**MCP server unreachable** (connection refused, timeout, "server not found"): The
notebooklm-mcp server itself is down or disconnected. Tell the user to check their
MCP server status. In claude.ai, check Settings > Connected Apps. In Claude Code,
check `claude mcp list` and restart the server if needed.

**Tool execution errors** (timeouts, unexpected responses): Retry once. If it fails
again, tell the user what happened and suggest trying later. NotebookLM has rate limits
(~50 queries/day on free tier) and generation quotas for content creation.

**Rate limits**: If multiple queries fail in succession after auth is confirmed working,
the user may have hit NotebookLM's daily limit. Suggest waiting or switching to a
different Google account.

## Notebook Resolution

Every workflow that needs a notebook_id resolves it in this order. Stop at the first match.

**1. Check the alias registry.**
Check both storage locations for aliases:
- `registry.json` in this skill's directory (Claude Code, writable filesystem)
- Claude's memory (claude.ai, where the skill directory is read-only)

If the user mentioned a known alias (e.g., a short label previously saved
such as "textbook" or "project-notes"), use the mapped UUID directly.
No confirmation needed.

**2. Extract from URL.**
If the user pasted a notebooklm.google.com URL, extract the notebook ID from the path.
Pattern: `https://notebooklm.google.com/notebook/<NOTEBOOK_ID>`

**3. Topic-based matching.**
If the registry has entries with topic tags, and the user's query clearly matches a topic
(e.g., a question about a domain concept matches a notebook tagged with that domain),
use that notebook. If multiple notebooks match, present the candidates and ask.
Note: topic matching is best-effort. If unsure, fall through to dynamic listing.

**4. Dynamic listing.**
Call `notebook_list`, present results as a numbered list with titles, ask the user to pick.
If only one notebook exists, confirm and use it. After selection, suggest the user register
an alias if they'll use this notebook often.

**5. Create new.**
If the user's intent is to build a new notebook (e.g., "research X and make a notebook"),
call `notebook_create` with a descriptive title.

### Registry Management

The registry stores notebook aliases with metadata for topic routing. It has two storage
backends depending on the environment:

**Claude Code (writable filesystem):** Use `registry.json` in this skill's directory.
Read and write it directly.

**claude.ai (read-only skill directory):** Use the `memory_user_edits` tool to persist
aliases in Claude's memory system. Store each alias as a memory edit with this format:
`NotebookLM alias: [alias] -> [UUID] ([description], topics: [topic1, topic2, ...])`

**To detect which to use:** Try writing to `registry.json`. If the write fails (read-only
filesystem), fall back to memory_user_edits. When reading, check both sources.

When the user says "save this as [alias]", "register this notebook", or "remember this
notebook as [name]":
1. If you don't have the notebook_id yet, call `notebook_list` and ask which one
2. Call `notebook_describe` to get an AI summary and suggested topics
3. Save to the appropriate backend (registry.json or memory_user_edits)

When the user says "show my registered notebooks" or "what's in my registry":
Check both registry.json and Claude's memory, present all aliases found.

Registry JSON format (for registry.json backend):
```json
{
  "alias-name": {
    "id": "notebook-uuid",
    "description": "Human-readable description",
    "topics": ["topic1", "topic2"]
  }
}
```

## Confirmation Rules

Three tiers. Apply consistently across all workflows.

**Auto-execute (no confirmation needed):**
Read-only operations that never modify data or consume generation quotas.
Tools: notebook_list, notebook_get, notebook_describe, notebook_query,
source_list_drive, source_describe, source_get_content, studio_status,
research_status, refresh_auth.

Note: notebook_query calls Gemini but does not modify user data. It counts against
the daily rate limit (~50/day free tier), but confirming each query would make the
tool unusable. Auto-execute to keep the workflow natural.

**Confirm once, then execute:**
Write operations and content generation. For multi-step workflows that chain several
generative tools (e.g., "make flashcards AND a quiz"), confirm the whole batch upfront,
then execute sequentially without re-asking.
Tools: notebook_create, notebook_rename, notebook_add_url, notebook_add_text,
notebook_add_drive, chat_configure, research_start, research_import,
source_sync_drive, save_auth_tokens, report_create, flashcards_create, quiz_create,
mind_map_create, data_table_create, infographic_create, slide_deck_create,
audio_overview_create, video_overview_create.

**Explicit confirmation with warning:**
Destructive, irreversible operations. State exactly what will be permanently deleted.
Wait for an unambiguous "yes" before proceeding.
Tools: notebook_delete, source_delete, studio_delete.

## Workflows

### W1: Quick Query

User says: "ask my notebook about X", "what does [textbook] say about Y"

1. Resolve notebook (see Notebook Resolution)
2. Call `notebook_query` with the user's question
3. Present the answer
4. If the user asks follow-up questions on the same topic, reuse the `conversation_id`
   from the previous response to maintain context within NotebookLM's chat

If notebook_query times out (default 120s), retry once. If it fails again, tell the
user and suggest simplifying the question or trying later.

### W2: Scoped Query

User says: "ask only the chapter 5 source about X"

1. Resolve notebook
2. Call `source_list_drive` or `notebook_get` to show available sources
3. Let the user pick which source(s) to query
4. Call `notebook_query` with `source_ids` set to the selected sources

### W3: Cross-Notebook Query

User says: "compare what [notebook A] and [notebook B] say about [topic]"

1. Resolve notebook A and notebook B
2. Call `notebook_query` on notebook A
3. Call `notebook_query` on notebook B
4. Synthesize both answers into a comparative response

If one query fails (timeout, error) but the other succeeds, present the successful
answer and tell the user which notebook failed, offering to retry.

### W4: Research Pipeline

User says: "research X", "find sources about Y", "deep dive on Z"

1. Determine search parameters:
   - source: "web" (default) or "drive" (if user says "search my Drive")
   - mode: "fast" (~30s, ~10 sources) or "deep" (~5min, ~40 sources, web only)
2. Resolve or create notebook (research_start can create one automatically)
3. Call `research_start` with the query
4. Poll with `research_status` until completed (use compact=true to save tokens)
5. Present discovered sources to the user
6. Call `research_import` with user-selected source indices (or all)

### W5: Content Generation

User says: "make flashcards", "generate a study guide", "create an audio overview"

1. Resolve notebook
2. Identify what to generate. Map user language to tool + parameters:
   - "flashcards" -> flashcards_create (difficulty: easy|medium|hard)
   - "quiz" / "test" -> quiz_create (question_count, difficulty)
   - "study guide" -> report_create (report_format: "Study Guide")
   - "briefing" / "summary" -> report_create (report_format: "Briefing Doc")
   - "blog post" -> report_create (report_format: "Blog Post")
   - "custom report" -> report_create (report_format: "Create Your Own", needs custom_prompt)
   - "mind map" -> mind_map_create
   - "data table" / "comparison table" -> data_table_create (needs description)
   - "infographic" -> infographic_create (orientation, detail_level)
   - "slides" / "deck" -> slide_deck_create (format: detailed_deck|presenter_slides)
   - "audio" / "podcast" -> audio_overview_create (format: deep_dive|brief|critique|debate)
   - "video" -> video_overview_create (format: explainer|brief, visual_style options)
3. Confirm the batch (what will be generated, from which notebook)
4. Execute with confirm=True
5. For audio/video: poll `studio_status` for the generation URL once complete

### W6: Source Management

User says: "add this URL to my notebook", "sync my sources", "what sources do I have"

**Add source:**
1. Resolve notebook
2. Determine source type from what the user provides:
   - URL (website/YouTube) -> notebook_add_url
   - Google Drive doc -> notebook_add_drive (extract document_id from Drive URL)
   - Raw text -> notebook_add_text
3. Confirm and execute

**List/inspect sources:**
1. Resolve notebook
2. Call `source_list_drive` or `notebook_get`
3. To see details on a specific source: `source_describe` for AI summary,
   or `source_get_content` for raw text

**Sync stale Drive sources:**
1. Resolve notebook
2. Call `source_list_drive` to identify stale sources
3. Present stale sources to user
4. Confirm, then call `source_sync_drive` with the stale source IDs

**Delete source:**
1. Resolve notebook, list sources, let user pick
2. Warn explicitly: "This will permanently delete [source name]. Cannot be undone."
3. Call `source_delete` with confirm=True only after clear approval

### W7: Notebook Housekeeping

User says: "what notebooks do I have", "rename my notebook", "describe my notebook"

- List: call `notebook_list`
- Describe: resolve notebook, call `notebook_describe` for AI summary + suggested topics
- Rename: resolve notebook, confirm new title, call `notebook_rename`
- Delete: resolve notebook, explicit warning, call `notebook_delete` with confirm=True

### W8: Smart Notebook Setup

User says: "set up a new notebook for X", "register my notebook", "add this notebook
to my registry"

**New notebook from scratch:**
1. Call `notebook_create` with a title
2. Add sources (URLs, Drive docs, text) per user instructions
3. Call `notebook_describe` to get AI summary and topics
4. Ask user for an alias
5. Save to registry (see Registry Management for environment-appropriate backend)

**Register existing notebook:**
1. If user provides a URL or UUID, use it; otherwise call `notebook_list` and let them pick
2. Call `notebook_describe` to auto-discover content summary and topics
3. Ask user for an alias (suggest one based on the notebook title)
4. Save to registry

### W9: Chat Configuration

User says: "configure my notebook chat", "set this notebook as a learning guide",
"use a custom prompt for this notebook"

1. Resolve notebook
2. Determine settings:
   - goal: "default" | "learning_guide" | "custom"
   - response_length: "default" | "longer" | "shorter"
   - custom_prompt: required when goal="custom" (up to 10,000 chars)
3. Confirm settings
4. Call `chat_configure`

This is useful for teaching contexts: you can set a notebook to "learning_guide" mode
so Gemini acts as a tutor, or use a custom prompt to get exam-style responses.

### W10: Auth Recovery

User says: "NotebookLM is broken", "auth error", "fix my NotebookLM"

Follow the Auth Recovery escalation ladder at the top of this document.

## Environment Notes

- **claude.ai:** All notebooklm-mcp tools work via the MCP connection. Auth recovery is
  limited to refresh_auth + manual cookie fallback (no CLI). Notebook aliases are stored
  via memory_user_edits since the skill directory is read-only.
- **Claude Code (local terminal):** Full access. Auth recovery can use the CLI directly.
  Notebook aliases stored in registry.json in the skill directory.
- **Both:** The workflows are identical. Only auth recovery and registry storage differ.

## Tool Reference

For detailed parameters, defaults, and option values for all 32 notebooklm-mcp tools,
consult the tool schemas surfaced by your MCP client, or the notebooklm-mcp server's
README. The MCP client exposes full parameter names, valid enum values, and default
behavior for every tool at call time.
