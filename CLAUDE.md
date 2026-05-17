# SyberPet Working Rules

## Project Goal

SyberPet is an Electron desktop AI pet project focused on pet interaction, chat experience, IPC stability, and stable desktop window behavior.

Primary stack:
- Electron 28
- React 18
- TypeScript 5
- Vite 5
- PixiJS 8
- Zustand 4

UI styling rules:
- Renderer uses inline React styles
- Do not reintroduce Tailwind or mix styling systems unless explicitly requested

## High-Priority Rules

1. Before the first meaningful action in a session, read `.sybermem/INDEX.md` Key Conclusions.
2. Search first, edit second for related work.
3. Before modifying existing behavior or adding related new behavior, search the codebase and `.sybermem/` for relevant context first.
4. Use targeted search tools (`Grep`, file reads, related specs/records) before making assumptions about linked features.
5. If current work may touch an existing interaction, IPC contract, renderer lifecycle, persisted state, or previously shipped behavior, inspect related files before editing.
6. Do not do unrelated refactors.
7. Do not expand scope without user approval.
8. Do not claim something is fixed, complete, or verified unless you actually verified it.
9. Prefer small, local, reversible changes.
10. Follow existing project patterns before introducing new ones.
11. After meaningful work, create or update the appropriate SyberMem record.
12. If behavior, setup, usage, architecture, or workflow changes, update `README.md` in the same change set when needed.

## Architecture Boundaries

- `electron/` owns window lifecycle, tray, and main-process IPC handling.
- `electron/preload.ts` is the only renderer bridge boundary and should expose the minimum safe API.
- `renderer/` owns React UI, pet rendering, and renderer-side interaction logic.
- `renderer/store/` should stay lightweight and should not hide IPC or lifecycle problems.
- IPC contract changes must update preload, renderer typings, and all affected call sites together.
- Avoid drifting bridge contracts, duplicate event wiring, or renderer subscriptions without cleanup.
- Changes involving chat, stream events, drag behavior, window behavior, or persisted pet data must review existing related implementations first.

## Code Quality Rules

- Keep changes focused on the requested outcome.
- Fix root causes when possible; avoid patch stacking and behavioral hacks.
- Prefer clear local logic over premature abstraction.
- Do not create one-off helpers for single-use logic.
- Avoid `any` when a local type or existing type can be used.
- Only validate at real boundaries: user input, IPC payloads, external APIs, persisted data.
- Do not add comments, abstractions, or fallback logic unless they are necessary for the requested change.
- Preserve working behavior unless the task explicitly changes it.
- For UI work, prioritize interaction stability over cosmetic expansion.

## Search and Context Rules

Before changing code related to existing features, or adding features that connect to older ones, first inspect:
- related implementation files
- related IPC and type definitions
- related `.sybermem/changes/`, `.sybermem/bugs/`, `.sybermem/requirements/`, `.sybermem/decisions/`
- related docs under `docs/superpowers/`
- related `README.md` sections if setup, usage, or behavior is documented there

Minimum expectation:
- search for related keywords with `Grep`
- read the affected files, not just search results
- check whether prior bugs, requirements, or decisions already constrain the change
- update `README.md` if user-facing behavior, developer workflow, setup, or architecture guidance changed

If historical context changes the implementation choice, mention it before editing.

## Verification and Completion

Match verification to the change:
- build/type-sensitive changes: run the relevant build or type check if available
- runtime or interaction changes: run app startup or equivalent manual verification if available
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
- If the change introduces an important requirement, bug resolution, or decision, add the matching SyberMem record as part of the same workflow.

Examples:
- `feat: add lightweight pet reply bubble`
- `fix: clean up renderer stream subscriptions`
- `refactor: simplify chat panel input flow`
- `docs: update setup and architecture notes`

## SyberMem Rules

Core rule:
- After meaningful work, run `/sybermem-record` unless the change is clearly too trivial to record.

Use `.sybermem/` as the canonical project memory:
- `.sybermem/changes/` for implemented feature or behavior changes
- `.sybermem/bugs/` for resolved bug fixes
- `.sybermem/requirements/` for confirmed requirements or scoped discussions
- `.sybermem/decisions/` for architecture or technical decisions

Important:
- Automatic change records do not replace requirement, bug, or decision records when those are needed.
- When answering architecture or history questions, search `.sybermem/` before answering.
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

- Do not reintroduce Tailwind or a second styling system without explicit approval.
- Do not bypass preload or blur process boundaries.
- Do not silently change IPC contracts.
- Do not ignore related historical context when changing old behavior.
- Do not present unverified work as done.
- Do not store secrets in code, docs, commits, README, or SyberMem records.
