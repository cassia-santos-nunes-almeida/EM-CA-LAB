# Refactor Skill

Safely refactor code files — remove dead code, improve efficiency, preserve all features.

## When to Use

User wants to refactor a file or directory. Triggered by `/refactor` command or when CLAUDE.md directs here.

## Workflow

1. **Parse arguments** — TARGET (file/directory), --fix (auto-apply), --scope deep|shallow, --focus dead-code|efficiency|readability|all
2. **Discovery** — Read target, map dependency graph, catalog all public behavior into a Feature Preservation Checklist
3. **Analysis** — Find dead code, efficiency gains, readability improvements. Assign certainty: HIGH/MEDIUM/LOW
4. **Impact assessment** — Cross-reference against checklist, identify callers, check test coverage, assess blast radius
5. **Proposals** — Present structured report grouped by certainty level
6. **Execution** (if --fix) — Apply only HIGH+SAFE changes, run tests, revert if tests fail

## Rules

- Feature preservation is non-negotiable
- Never remove exports without full codebase search confirming zero imports
- Never change exported function signatures without updating all callers
- Never remove error handling, input validation, or TODO/FIXME comments
- Test verification is mandatory before declaring --fix successful
- When in doubt, classify as LOW certainty and do not auto-apply

## Certainty Levels

- **HIGH** — Deterministically provable (unreachable code, unused symbols). Safe to auto-apply.
- **MEDIUM** — Likely safe but depends on runtime behavior. Requires human review.
- **LOW** — Changes observable behavior or API surface. Never auto-apply.

## Full Instructions

See `.claude/commands/refactor.md` for the complete 5-phase workflow with output format templates.

## Changelog

- v1.0 (2026-03-01): Initial version — 5-phase workflow with certainty levels and feature preservation checklist
