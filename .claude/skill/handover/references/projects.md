# Project Reference — Session Handovers

Used by the handover skill to auto-detect project from conversation
context. If signals are ambiguous, always ask — never guess silently.

## How to customise

This file is meant to be edited. The entries below are the maintainer's
live list — treat them as examples of the expected structure and
replace them with your own. Each entry needs:

- **Tag** — the short label shown in Notion's `Project` SELECT field.
  Keep it under 20 characters. The same tag must exist as a Notion
  SELECT option (add new options in Notion's UI).
- **Signals** — comma-separated keywords, repo names, URLs, acronyms,
  or any other strings that reliably appear when you work on this
  project. The skill scans recent conversation for these to auto-detect.
- **Description** — one sentence for human readers. Can name the
  current state, active issues, collaborators, or any context that
  future-you would want when resuming.

Keep 3–7 projects. Fewer than 3 and auto-detection rarely helps; more
than 7 and the list is unreadable in the "which project?" prompt.

---

## SEFI
**Tag:** `SEFI`
**Signals:** SEFI 2026, paper, submission, abstract, LLM grading, ASAG, rubric, Gemma, Qwen, inter-rater, Vilppu, tri-trait, automated grading, Cohen's kappa, pilot study, EER, SoTL
**Description:** Engineering education research paper for SEFI 2026 conference. Comparing open-weight LLMs (Gemma 3 27B, Qwen3) for automated short-answer grading against human rater baseline.

---

## MCP server
**Tag:** `MCP server`
**Signals:** academic-research-mcp, Vercel, prj_4QB0VZvkkIyphKEVAWe0Pws3NXoF, Scopus, WoS, ScienceDirect, IEEE API, arXiv, ERIC, ACL, ASEE PEER, OpenAlex, Crossref, tool endpoint, insttoken, MCP deploy
**Description:** Custom Vercel MCP server with 14 academic database tools. Active issues: WoS sort-field bug, ScienceDirect insttoken pending, IEEE not yet active.

---

## EM&AC course
**Tag:** `EM&AC course`
**Signals:** BL30A0350, Electromagnetism, Circuit Analysis, STACK, Moodle, EM-AC-STACK-Assessments, EM-CA-Course, STACK_XML_Generator, Ulaby, Nilsson, Riedel, lab module, em-ac-lab
**Description:** LUT course teaching Electromagnetism and Circuit Analysis. Includes STACK question development, lab modules, and assessment tooling.

---

## EP course
**Tag:** `EP course`
**Signals:** LES10A020, Engineering Physics, co-teach, EP lab, physics problems
**Description:** LUT Engineering Physics course, co-taught. Occasional STACK and assessment work.

---

## Personal/Tools
**Tag:** `Personal/Tools`
**Signals:** Finnish app, Suomi päivässä, React app, personal project, skill update, stop-slop, circuitikz, message-coach, CLAUDE.md, PATTERNS.md, SESSION.md, skills ecosystem
**Description:** Personal productivity tools, Finnish language learning app, Claude skills ecosystem maintenance, course infrastructure not tied to a specific course.

---

## Other
**Tag:** `Other` (free text)
Use when none of the above match. Record the user-supplied name as the tag.
Note to user: *"I've tagged this as '[name]' under Other — if you use this project regularly, consider adding it to references/projects.md in the handover skill."*
