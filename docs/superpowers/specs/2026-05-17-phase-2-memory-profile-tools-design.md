# SyberPet Phase 2.1 Design — Long-Term Memory Core with Derived Profile and Internal Tools

Date: 2026-05-17
Status: approved-in-chat, awaiting written-spec review

## Background

SyberPet currently has:

- short-term conversational memory
- a basic Agent Core and message queue
- foundational chat and configuration UI
- pet state and partial local persistence

But the following planned Phase 2 capabilities are not yet truly implemented:

1. long-term memory (SQLite + retrieval)
2. user profile derived from memory
3. a tool system that first serves internal context capabilities

This design models all three together, but treats the long-term memory loop as the only primary goal of the first delivery stage.

## Goal

Build a stable, low-noise, retrievable long-term memory system so SyberPet can:

- conservatively extract long-term useful information from conversation
- persist that information as structured memory entries
- retrieve and inject relevant memories into later conversations
- visibly demonstrate that it remembers long-term user facts, preferences, and rules

At the same time, this stage should establish clean boundaries for:

- a lightweight structured user profile
- a minimal internal tool layer

## Non-Goals

This stage does not include:

- a general external-action tool platform
- file, command, or desktop-control tools
- vector or embedding retrieval
- automatic expiry or complex lifecycle governance
- a full user profiling system
- a full event warehouse
- making profile or tools the primary delivery goal of the stage

## Success Criteria

This stage is successful when:

1. clearly expressed long-term user information can be written into long-term memory reliably
2. later related conversations can retrieve and inject those memories
3. the system does not write large amounts of noise or duplicate memories
4. conflicting information does not aggressively overwrite prior conclusions
5. the main chat flow remains usable even if long-term memory writing fails

In one sentence:

> SyberPet can conservatively extract long-term useful information from conversation, persist it reliably, and retrieve and inject those memories into later related conversations so the user can perceive real long-term memory behavior.

## Architecture Overview

The system is organized into three layers.

### Memory Layer

The long-term memory core is the source of truth.

Responsibilities:

- store long-term memory entries
- handle extraction, deduplication, conflict resolution, and retrieval
- serve as the data source for profile derivation and tools

Suggested modules:

- `MemoryRepository`
- `MemoryExtractor`
- `MemoryResolver`
- `MemoryRetriever`

### Profile Layer

A lightweight structured user view derived from long-term memory.

Responsibilities:

- aggregate name, address, style, and stable preferences
- provide a cacheable and rebuildable profile view

Principle:

- profile is not the source of truth
- memory entries remain the only source of truth

### Tool Layer

An internal capability tool layer.

Target tools for the first version:

- `search_memory`
- `get_profile`
- `get_config_status`
- `save_memory`

Principles:

- tools are an interface layer, not a fact-judgment layer
- all writing still passes through memory-layer rules

## Existing System Integration

### Conversation Flow Integration

The current primary chat chain lives in `agent/conversation/manager.ts`.

Integration approach:

#### Before generation

- receive user input
- retrieve relevant long-term memories
- inject matched memory entries into the prompt
- send them together with short-term conversational context to the LLM

#### After generation

- asynchronously extract candidate long-term memories from the finished turn
- run deduplication and conflict resolution
- persist the final result

### Short-Term Memory Relationship

- `ShortTermMemory` continues to own near-turn conversational context
- `LongTermMemory` owns cross-session stable information
- the two coexist and do not merge responsibilities

## Data Model

### Memory Entry

Each long-term memory is stored as an independent entry.

Suggested fields:

- `id`
- `type`: `fact | preference | rule`
- `subject`
- `content`
- `source`: `user | assistant_confirmed | tool`
- `confidence`
- `status`: `active | superseded | rejected`
- `createdAt`
- `updatedAt`
- `lastAccessedAt`
- `evidence`

Field meanings:

- `type` keeps first-version taxonomy intentionally small
- `subject` gives a stable grouping key for retrieval and conflict logic
- `content` stays human-readable and prompt-friendly
- `source` distinguishes user facts from assistant-confirmed rules and tool output
- `confidence` supports conservative ranking and conflict handling
- `status` avoids aggressive destructive overwrite
- timestamps support future ranking and lifecycle evolution
- `evidence` preserves traceability to the originating turn

### Profile

The derived profile should initially contain:

- `nameOrNickname`
- `preferredAddress`
- `conversationStyle`
- `stablePreferences`
- `derivedFrom`
- `updatedAt`

Profile is a derived view, not an independent fact store.

### Tool I/O

#### `search_memory`
Input:
- `query`
- `types?`
- `limit?`

Output:
- matched memory entries

#### `get_profile`
Output:
- structured profile
- source memory IDs

#### `get_config_status`
Output:
- config completeness
- current provider/model

#### `save_memory`
Input:
- `type`
- `subject`
- `content`
- `source`
- `confidence?`
- `evidence?`

Important:
- `save_memory` submits a candidate
- it does not bypass validation or write directly to the database

## Write Path Design

The write path uses two input channels with one rule center.

### Default async extraction pipeline

This is the primary path.

Trigger:
- after a conversation turn finishes

Inputs:
- current user message
- current assistant reply
- small supporting context if needed

Goal:
- extract only clear, stable, long-term useful information candidates

### Tool write path

This is a secondary path.

- `save_memory` may be callable by the model
- but it only submits a candidate
- final acceptance still goes through the same resolver logic

### Write rules

Allowed to write:

- explicit user facts
- explicit user preferences
- long-lived rules and commitments

Not allowed to write:

- short-term emotions
- one-off task details
- temporary context
- inferred preferences without clear evidence
- incidental facts with no long-term value

### Deduplication strategy

- obvious duplicates should not create new active entries
- lightly rephrased equivalents should usually reuse the existing active entry
- the first-version goal is a clean memory store, not maximum historical verbosity

### Conflict strategy

Default posture is conservative.

- `fact` and `preference` should not be overwritten aggressively
- `rule` can be superseded more readily when the user clearly updates the standing rule
- the system should prefer preserving stability over reacting to ambiguous change

### Status flow

- valid new memory → `active`
- clearly replaced memory → `superseded`
- invalid candidate → `rejected`

### Failure behavior

Long-term memory writing failure must not break the main chat response path.

## Retrieval Path Design

### Retrieval timing

Retrieve before the LLM call for the current user input.

### Retrieval target

Prioritize retrieval of:

- user identity facts
- stable preferences
- long-lived rules and commitments

### Retrieval strategy

First version uses:

- active-entry filtering
- subject/content keyword matching
- simple relevance sorting

Suggested ranking inputs:

- exactness
- confidence
- recency
- type priority

Default type priority recommendation:

1. `rule`
2. `preference`
3. `fact`

### Prompt injection

Inject original structured entries directly rather than a summary.

Example shape:

```text
Relevant long-term memories:
- [rule] When behavior or workflow changes, update README.md if needed.
- [preference] The user prefers discussing the plan before editing code.
- [preference] The user prefers Chinese responses.
- [fact] The user is working on the SyberPet project.
```

### Injection limit

- inject only top-N entries
- keep basic type balancing
- avoid prompt bloat

### No-hit behavior

- if nothing relevant is found, proceed with normal chat
- do not inject weakly related content as a fallback

## Profile Boundary

### Role

Profile is a derived view of long-term memory, not an independent source of truth.

### Update model

- profile may be cached
- it may refresh incrementally after memory changes
- it must always be rebuildable from memory entries

### First-version scope

Only include:

- nickname
- preferred address
- conversation style
- stable preferences

### Constraints

Do not make profile responsible for:

- long persona narratives
- personality inference
- unsupported habit summaries
- direct fact ownership

## Tool Boundary

### Role

The tool layer is a standardized interface to internal context capabilities.

### First-version scope

- `search_memory`
- `get_profile`
- `get_config_status`
- `save_memory`

### Constraints

- tools may not bypass resolver or repository rules
- tool writes are not direct database writes
- automatic retrieval and automatic writing remain the primary memory loop

### Relationship with the main flow

- automatic retrieval: default path
- tool retrieval: enhancement path
- automatic writing: default path
- tool writing: secondary path

## Risks

Primary risks:

1. noisy memory writing
2. incorrect or excessive retrieval
3. profile drift
4. tool-layer scope overtaking the memory goal
5. over-intrusive changes to the current chat chain

Primary mitigations:

- conservative extraction
- conservative deduplication
- one resolver for all write paths
- strict prompt-injection limits
- memory layer as the only fact-judgment layer

## Verification Plan

### Write verification

Verify that:

- explicit facts are written correctly
- short-term information is not written
- repeated preferences do not create duplicate active entries
- conflict handling is conservative
- tool-submitted candidates still pass through the same rules

### Retrieval verification

Verify that:

- relevant preferences are recalled
- important rules outrank generic facts when appropriate
- unrelated memories are not injected
- no-hit retrieval does not break the chat path

### End-to-end verification

Core loop to verify:

- round 1: user states long-term information
- later round: related prompt retrieves that information
- user can perceive that the system remembered it

### Profile and tool verification

Verify that:

- profile can be derived from memory entries
- profile can be rebuilt if cache drifts
- the minimal tool interface closes correctly
- tool-layer problems do not invalidate the core memory loop

## Delivery Plan

### Delivery 1: Memory Core

- SQLite persistence
- memory entry model
- retrieval and prompt injection
- async extraction
- deduplication, conflict handling, and status flow

### Delivery 2: Derived Profile

- lightweight structured profile
- derivation logic
- cache and rebuild strategy

### Delivery 3: Internal Tools

- `search_memory`
- `get_profile`
- `get_config_status`
- `save_memory`

## Recommendation

Recommended implementation order:

1. complete Memory Core first
2. then add the derived Profile layer
3. then add the minimal Internal Tool layer

This order best matches the actual goal of the stage:
- make long-term memory visibly real first
- keep profile dependent on stable memory
- keep tools serving the memory system instead of driving it
