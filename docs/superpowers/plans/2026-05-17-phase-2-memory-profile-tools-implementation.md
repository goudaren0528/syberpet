# Phase 2 Memory, Profile, and Tools Implementation Plan

**Goal:** Add a stable long-term memory loop to SyberPet, then layer on a derived profile view and minimal internal tools without destabilizing the current chat flow.

**Architecture:** Keep short-term memory as the near-turn context store, add a separate long-term memory subsystem in the agent layer, inject retrieved long-term memories before LLM generation, and write candidate memories asynchronously after each completed turn. Build profile as a derived view from memory entries and expose both memory/profile/config access through a minimal internal tool surface.

**Tech Stack:** TypeScript, Electron, existing agent core, SQLite persistence, current LLM client and conversation manager

---

## File Structure

### New files
- `agent/memory/types.ts` — shared long-term memory types, enums, profile types, tool payload types
- `agent/memory/repository.ts` — SQLite-backed persistence and query operations
- `agent/memory/extractor.ts` — turn-to-candidate extraction logic
- `agent/memory/resolver.ts` — validation, deduplication, conflict handling, status updates
- `agent/memory/retriever.ts` — keyword/subject retrieval and ranking
- `agent/memory/profile.ts` — profile derivation, cache refresh, rebuild helpers
- `agent/tools/index.ts` — minimal internal tool registry and dispatch

### Existing files to modify
- `package.json` — add SQLite dependency and any needed scripts
- `agent/conversation/manager.ts` — inject retrieval before LLM call, async write after turn, optional tool wiring
- `agent/llm/client.ts` — ensure tool payload passthrough is usable for the minimal internal tools
- `agent/llm/types.ts` — tighten tool-related types used by the tool layer
- `electron/main.ts` — expose any minimal IPC needed for config status if current path is not reusable
- `README.md` — update architecture/workflow docs if the repository gains or already has a README

---

## Delivery 1: Memory Core

### Task 1: Add long-term memory base types

**Files:**
- Create: `agent/memory/types.ts`

- [ ] Step 1: Define the memory enums and entry types

```ts
export type MemoryType = 'fact' | 'preference' | 'rule'
export type MemorySource = 'user' | 'assistant_confirmed' | 'tool'
export type MemoryStatus = 'active' | 'superseded' | 'rejected'

export interface MemoryEvidence {
  userText?: string
  assistantText?: string
  turnId?: string
}

export interface MemoryEntry {
  id: string
  type: MemoryType
  subject: string
  content: string
  source: MemorySource
  confidence: number
  status: MemoryStatus
  createdAt: number
  updatedAt: number
  lastAccessedAt: number | null
  evidence: MemoryEvidence
}

export interface MemoryCandidate {
  type: MemoryType
  subject: string
  content: string
  source: MemorySource
  confidence: number
  evidence: MemoryEvidence
}

export interface RetrievedMemory {
  entry: MemoryEntry
  exactness: number
  matchedTerms: string[]
}
```

- [ ] Step 2: Keep the first version profile types in the same file

```ts
export interface DerivedProfile {
  nameOrNickname: string | null
  preferredAddress: string | null
  conversationStyle: string[]
  stablePreferences: string[]
  derivedFrom: string[]
  updatedAt: number
}
```

- [ ] Step 3: Verify the new type file compiles conceptually with current imports

Run: review the file for naming consistency with `agent/conversation/manager.ts` and `agent/llm/types.ts`
Expected: names are stable and specific enough for later tasks

### Task 2: Add SQLite dependency and persistence entry point

**Files:**
- Modify: `package.json`
- Create: `agent/memory/repository.ts`

- [ ] Step 1: Add the SQLite dependency

Add one SQLite package to `package.json` dependencies. Prefer a synchronous local package suitable for Electron main/Node usage, for example:

```json
"better-sqlite3": "^11.0.0"
```

- [ ] Step 2: Create repository initialization and schema setup

```ts
import Database from 'better-sqlite3'
import path from 'path'
import os from 'os'
import { MemoryCandidate, MemoryEntry, MemoryStatus, MemoryType } from './types'

export class MemoryRepository {
  private db: Database.Database

  constructor(dbPath = path.join(process.cwd(), 'syberpet-memory.db')) {
    this.db = new Database(dbPath)
    this.migrate()
  }

  private migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memory_entries (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        subject TEXT NOT NULL,
        content TEXT NOT NULL,
        source TEXT NOT NULL,
        confidence REAL NOT NULL,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        last_accessed_at INTEGER,
        evidence_json TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_memory_active_subject
      ON memory_entries(status, subject);

      CREATE INDEX IF NOT EXISTS idx_memory_type_status
      ON memory_entries(type, status);
    `)
  }
}
```

- [ ] Step 3: Add basic repository methods needed by the rest of Delivery 1

```ts
getActiveBySubject(subject: string): MemoryEntry[] { /* ... */ }
insert(entry: MemoryEntry): void { /* ... */ }
updateStatus(id: string, status: MemoryStatus): void { /* ... */ }
listActive(): MemoryEntry[] { /* ... */ }
searchActive(): MemoryEntry[] { /* ... */ }
markAccessed(ids: string[], accessedAt: number): void { /* ... */ }
```

- [ ] Step 4: Verify dependency and file references are coherent

Run: inspect `package.json` and `agent/memory/repository.ts`
Expected: dependency name and import style match each other

### Task 3: Create conservative extraction logic

**Files:**
- Create: `agent/memory/extractor.ts`
- Read for context while implementing: `agent/conversation/manager.ts`

- [ ] Step 1: Define extractor input/output shape

```ts
import { MemoryCandidate } from './types'

export interface ExtractionTurn {
  userText: string
  assistantText: string
  turnId: string
}

export class MemoryExtractor {
  extract(turn: ExtractionTurn): MemoryCandidate[] {
    return []
  }
}
```

- [ ] Step 2: Implement first-version conservative rule-based extraction

Use explicit pattern logic, for example:

```ts
if (/叫我|你可以叫我/.test(userText)) {
  candidates.push({
    type: 'fact',
    subject: 'user_identity_name',
    content: userText.trim(),
    source: 'user',
    confidence: 0.95,
    evidence: { userText, assistantText, turnId }
  })
}
```

Also add simple rules for:
- Chinese reply preference
- concise reply preference
- plan-first workflow preference
- explicit long-term project rules/commitments

- [ ] Step 3: Keep the extractor intentionally narrow

Do not extract from:
- temporary emotion
- one-off tasks
- weak guesses
- vague statements

- [ ] Step 4: Verify the extractor reflects the spec

Run: review the implemented rule list against the spec’s allowed/not-allowed write rules
Expected: only explicit, stable, long-term information is extracted

### Task 4: Add deduplication and conflict resolution

**Files:**
- Create: `agent/memory/resolver.ts`
- Read for context: `agent/memory/types.ts`, `agent/memory/repository.ts`

- [ ] Step 1: Define resolver result types

```ts
import { MemoryCandidate, MemoryEntry } from './types'

export interface ResolveResult {
  inserted: MemoryEntry[]
  superseded: string[]
  rejected: MemoryCandidate[]
}
```

- [ ] Step 2: Implement validation and obvious-duplicate handling

```ts
if (!candidate.content.trim()) reject
if (candidate.confidence <= 0) reject
if (sameSubject && sameContent && existing.status === 'active') skip insert
```

- [ ] Step 3: Implement conservative conflict handling

Rules:
- `fact` / `preference`: do not aggressively replace existing entries
- `rule`: allow superseding when the new statement is clearly an updated standing rule

- [ ] Step 4: Materialize accepted candidates into `MemoryEntry`

```ts
const now = Date.now()
const entry: MemoryEntry = {
  id: crypto.randomUUID(),
  type: candidate.type,
  subject: candidate.subject,
  content: candidate.content,
  source: candidate.source,
  confidence: candidate.confidence,
  status: 'active',
  createdAt: now,
  updatedAt: now,
  lastAccessedAt: null,
  evidence: candidate.evidence
}
```

### Task 5: Add retrieval and ranking

**Files:**
- Create: `agent/memory/retriever.ts`
- Read for context: `agent/memory/repository.ts`

- [ ] Step 1: Define a simple retrieval API

```ts
import { MemoryEntry, RetrievedMemory } from './types'
import { MemoryRepository } from './repository'

export class MemoryRetriever {
  constructor(private repo: MemoryRepository) {}

  search(query: string, limit = 5): RetrievedMemory[] {
    return []
  }
}
```

- [ ] Step 2: Implement active-only retrieval with keyword/subject matching

Use a token-based strategy:

```ts
const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
const entries = this.repo.listActive()
```

Score by:
- exact term hits in `content`
- subject hint hits
- confidence
- recency
- type priority (`rule` > `preference` > `fact`)

- [ ] Step 3: Return top-N ranked results and update `lastAccessedAt`

Expected behavior:
- no results returns `[]`
- unrelated content is filtered out before ranking if possible

### Task 6: Integrate retrieval into the chat prompt

**Files:**
- Modify: `agent/conversation/manager.ts`

- [ ] Step 1: Inject repository/retriever/extractor/resolver dependencies

```ts
private memory = new ShortTermMemory()
private longTermRepo = new MemoryRepository()
private longTermRetriever = new MemoryRetriever(this.longTermRepo)
private longTermExtractor = new MemoryExtractor()
private longTermResolver = new MemoryResolver(this.longTermRepo)
```

- [ ] Step 2: Retrieve memories before LLM generation

```ts
const relevantMemories = this.longTermRetriever.search(userInput, 5)
const longTermBlock = relevantMemories.length
  ? [{
      role: 'system' as const,
      content: `Relevant long-term memories:\n${relevantMemories.map(m => `- [${m.entry.type}] ${m.entry.content}`).join('\n')}`
    }]
  : []
```

- [ ] Step 3: Build messages with system prompt + long-term block + short-term context

```ts
const messages: LLMMessage[] = [
  { role: 'system', content: SYSTEM_PROMPT },
  ...longTermBlock,
  ...this.memory.getContext().map(/* existing mapping */)
]
```

### Task 7: Integrate asynchronous post-turn writing

**Files:**
- Modify: `agent/conversation/manager.ts`

- [ ] Step 1: After assistant reply completes, trigger extraction asynchronously

```ts
queueMicrotask(() => {
  void this.persistTurnMemory({ userText: userInput, assistantText: fullContent, turnId: userMsg.id })
})
```

- [ ] Step 2: Add a helper method that isolates failures from the chat flow

```ts
private async persistTurnMemory(turn: ExtractionTurn) {
  try {
    const candidates = this.longTermExtractor.extract(turn)
    this.longTermResolver.resolve(candidates)
  } catch (error) {
    console.error('[ConversationManager] persistTurnMemory failed:', error)
  }
}
```

- [ ] Step 3: Verify failure isolation manually in code

Expected: if memory extraction/resolution throws, `chat()` still returns the assistant response normally

---

## Delivery 2: Derived Profile

### Task 8: Add derived profile builder

**Files:**
- Create: `agent/memory/profile.ts`
- Read for context: `agent/memory/types.ts`, `agent/memory/repository.ts`

- [ ] Step 1: Define a profile service that derives from active memory entries

```ts
import { DerivedProfile, MemoryEntry } from './types'
import { MemoryRepository } from './repository'

export class ProfileService {
  constructor(private repo: MemoryRepository) {}

  buildProfile(): DerivedProfile {
    return {
      nameOrNickname: null,
      preferredAddress: null,
      conversationStyle: [],
      stablePreferences: [],
      derivedFrom: [],
      updatedAt: Date.now()
    }
  }
}
```

- [ ] Step 2: Implement simple field derivation rules

Examples:
- `user_identity_name` → `nameOrNickname`
- explicit address preference subject → `preferredAddress`
- Chinese / concise / plan-first preference subjects → `conversationStyle`
- other active preferences → `stablePreferences`

- [ ] Step 3: Keep derivation rebuildable and deterministic

Expected: same active memory set produces the same profile output

### Task 9: Add optional profile caching without changing source of truth

**Files:**
- Modify: `agent/memory/repository.ts`
- Modify: `agent/memory/profile.ts`

- [ ] Step 1: Add a lightweight profile snapshot store if needed

Possible schema:

```sql
CREATE TABLE IF NOT EXISTS derived_profile (
  id TEXT PRIMARY KEY,
  profile_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
```

- [ ] Step 2: Keep rebuild available even if cache exists

Expected: profile cache can be regenerated entirely from active memory entries

---

## Delivery 3: Internal Tools

### Task 10: Tighten tool-related LLM and domain types

**Files:**
- Modify: `agent/llm/types.ts`
- Read for context: `agent/llm/client.ts`

- [ ] Step 1: Replace loose tool placeholders with minimal explicit shapes

```ts
export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}
```

- [ ] Step 2: Ensure tool call result typing is sufficient for internal tools

Expected: `search_memory`, `get_profile`, `get_config_status`, and `save_memory` can be represented without `any`

### Task 11: Add minimal tool registry and dispatch

**Files:**
- Create: `agent/tools/index.ts`
- Modify: `agent/conversation/manager.ts`

- [ ] Step 1: Define tool registry surface

```ts
export interface ToolCallContext {
  repo: MemoryRepository
  profile: ProfileService
}

export function createInternalTools(ctx: ToolCallContext) {
  return [/* tool definitions */]
}
```

- [ ] Step 2: Implement read tools first

Add handlers for:
- `search_memory`
- `get_profile`
- `get_config_status`

- [ ] Step 3: Add `save_memory` as candidate submission, not direct write

```ts
async function saveMemory(input: MemoryCandidate) {
  return resolver.resolve([input])
}
```

- [ ] Step 4: Keep tool writes under the same validation/resolution path used by automatic extraction

Expected: one rule center for all writes

### Task 12: Wire minimal tool usage into conversation flow only if current LLM path supports it cleanly

**Files:**
- Modify: `agent/conversation/manager.ts`
- Modify: `agent/llm/client.ts` if required

- [ ] Step 1: Pass internal tool definitions into the chat call

```ts
const tools = createInternalTools({ repo: this.longTermRepo, profile: this.profileService })
for await (const chunk of this.llm.chat(messages, tools)) {
  // existing stream handling
}
```

- [ ] Step 2: If tool-call execution is not yet fully supported by the current LLM client, keep the tool registry in place and stop short of automatic execution

Expected: do not destabilize the main chat flow just to force tool execution into Delivery 1

---

## Verification Checklist

### Memory Core
- [ ] Explicit long-term user facts can be written
- [ ] Explicit long-term user preferences can be written
- [ ] Explicit long-term rules can be written
- [ ] Short-term emotions and one-off tasks are not written
- [ ] Duplicate active entries are not repeatedly created
- [ ] Relevant memories are injected before chat generation
- [ ] No-hit retrieval still produces normal chat
- [ ] Write failures do not break the main response path

### Derived Profile
- [ ] Profile can be built from active memories
- [ ] Profile fields match the intended minimal shape
- [ ] Profile can be rebuilt from memory entries

### Internal Tools
- [ ] `search_memory` returns matched entries
- [ ] `get_profile` returns a structured profile
- [ ] `get_config_status` returns current config state
- [ ] `save_memory` goes through the same resolver path as automatic extraction

---

## Suggested Commit Sequence

1. `feat: add long-term memory types and repository`
2. `feat: add memory extraction and resolution pipeline`
3. `feat: inject long-term memory into conversation flow`
4. `feat: derive lightweight user profile from memory`
5. `feat: add minimal internal memory and profile tools`

---

## Notes

- Keep Delivery 1 as the true success bar.
- Do not delay Memory Core stability to fully complete tool calling.
- If tool execution support in the current LLM client turns out to be incomplete, keep the tool interface and handlers in place and defer automatic model-driven tool execution until the memory loop is stable.
- Update `README.md` if this repository gains one or if existing project documentation needs an architecture update to reflect the new memory system.
