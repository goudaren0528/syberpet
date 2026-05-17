# Project Working Rules

## Project Goal

This file defines the working rules for making safe, focused, and well-documented changes in this project.

## High-Priority Rules

1. Before the first meaningful action in a session, read the project's main guidance files and historical records if they exist.
2. Search first, edit second for related work.
3. Before modifying existing behavior or adding related new behavior, search the codebase and project records for relevant context first.
4. Use targeted search tools and direct file reads before making assumptions about linked features.
5. If current work may touch an existing interaction, contract, lifecycle, persisted state, or previously shipped behavior, inspect related files before editing.
6. Do not do unrelated refactors.
7. Do not expand scope without user approval.
8. Do not claim something is fixed, complete, or verified unless you actually verified it.
9. Prefer small, local, reversible changes.
10. Follow existing project patterns before introducing new ones.
11. After meaningful work, create or update the appropriate project record if the project uses a memory or record system.
12. If behavior, setup, usage, architecture, or workflow changes, update `README.md` in the same change set when needed.

## Architecture Boundaries

- Respect the existing module and process boundaries of the project.
- Keep interfaces explicit and consistent across boundaries.
- If a contract changes, update all related definitions, types, and call sites together.
- Avoid duplicate event wiring, hidden coupling, or lifecycle behavior without cleanup.
- Before changing behavior that crosses boundaries, review the full related path first.

## Code Quality Rules

- Keep changes focused on the requested outcome.
- Fix root causes when possible; avoid patch stacking and behavioral hacks.
- Prefer clear local logic over premature abstraction.
- Do not create one-off helpers for single-use logic.
- Avoid `any` or untyped escape hatches when a local type or existing type can be used.
- Only validate at real boundaries: user input, external APIs, persisted data, and cross-system contracts.
- Do not add comments, abstractions, or fallback logic unless they are necessary for the requested change.
- Preserve working behavior unless the task explicitly changes it.
- Prioritize stability over cosmetic expansion.

## Search and Context Rules

Before changing code related to existing features, or adding features that connect to older ones, first inspect:
- related implementation files
- related type or interface definitions
- related project records, bug logs, requirement notes, or decision documents
- related design docs, plans, or architecture notes
- related `README.md` sections if setup, usage, or behavior is documented there

Minimum expectation:
- search for related keywords with appropriate search tools
- read the affected files, not just search results
- check whether prior bugs, requirements, or decisions already constrain the change
- update `README.md` if user-facing behavior, developer workflow, setup, or architecture guidance changed

If historical context changes the implementation choice, mention it before editing.

## Verification and Completion

Match verification to the change:
- build or type-sensitive changes: run the relevant build or type check if available
- runtime or interaction changes: run the app, test flow, or equivalent manual verification if available
- bug fixes: verify the bug path and confirm no obvious regression in related behavior
- docs or README changes: verify the instructions still match the current project state

Before declaring success:
- state what you verified
- state any verification gaps if full verification was not possible

## Commit Rules

- Use Conventional Commits.
- Keep one commit focused on one main purpose.
- Do not mix feature work, bug fixes, and unrelated refactors in one commit unless truly inseparable.
- Run minimum relevant verification before committing.
- Commit messages should explain the change clearly and prefer the why, not only the what.
- If the change introduces an important requirement, bug resolution, or decision, add the matching project record as part of the same workflow.

Examples:
- `feat: add user profile actions`
- `fix: clean up event subscription lifecycle`
- `refactor: simplify settings state flow`
- `docs: update setup and architecture notes`

## Project Record Rules

Core rule:
- After meaningful work, create or update a project record unless the change is clearly too trivial to record.

If the project has a memory or record system, use it consistently for:
- implemented feature or behavior changes
- resolved bug fixes
- confirmed requirements or scoped discussions
- architecture or technical decisions

Important:
- Automatic change logs do not replace requirement, bug, or decision records when those are needed.
- When answering architecture or history questions, search the project's records before answering.
- Important decisions made in chat should be recorded, not left only in conversation history.

No record needed for:
- formatting-only edits
- comment-only edits
- trivial wording changes
- config tweaks with no functional impact

## Documentation Rules

- Keep `README.md` aligned with the current project state.
- Update `README.md` when changing setup steps, run commands, user-visible behavior, architecture summaries, or important workflow rules.
- Do not leave new behavior undocumented if a developer or user would reasonably look for it in `README.md`.
- Prefer small, accurate README updates over large speculative documentation rewrites.

## Prohibited Moves

- Do not silently change public or cross-module contracts.
- Do not ignore related historical context when changing old behavior.
- Do not present unverified work as done.
- Do not store secrets in code, docs, commits, README, or project records.
