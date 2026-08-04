# ============================================================================
# ARCHITECTURE INVARIANTS (DO NOT VIOLATE)
# ============================================================================

These rules define the permanent architecture of Jouspace. Any change requires
an Architecture Review before implementation.

## AI Runtime

- AIOrchestrator is the ONLY entry point for every AI request.
- PromptAssembler is the ONLY component allowed to construct prompts.
- Providers NEVER construct prompts.
- ContextBuilder is the ONLY component allowed to merge Memory, RAG, Live
  Search, and Conversation History.
- ModelGateway is the ONLY component allowed to communicate with the LLM.
- Client screens NEVER call LLM providers directly.

## Tool System

- ToolRouter routes by CAPABILITY, never by provider.
- Providers are interchangeable implementations.
- Register new providers through ToolRegistry.
- Never hardcode provider names inside ToolRouter.

## RAG

- Runtime depends ONLY on RetrievalTool.
- RetrievalTool abstracts the vector database.
- Pinecone implementation is replaceable.
- AI Runtime must never know which vector database is being used.

## Memory

- Memory retrieval always goes through MemoryService.
- Memory extraction is separated from retrieval.
- Reflection engine never writes directly into runtime context.
- Long-term memory is independent of RAG.

## Client

- Screens remain 100% presentational.
- Screens never import repositories.
- Screens never contain business logic.
- Business logic belongs inside hooks/services/workflows.

## Backend

- Supabase stores transactional data only.
- Pinecone stores vector data only.
- Never store embeddings inside Supabase.

## Security

- Secrets NEVER enter src/.
- Never expose API keys through VITE_* variables.
- AI providers remain server-side only.


# ============================================================================
# ENGINEERING PHILOSOPHY
# ============================================================================

The project follows several permanent engineering principles.

1. Build the smallest working vertical slice.
2. Validate before expanding.
3. Interfaces before implementations.
4. Prefer composition over inheritance.
5. One Sprint → One Objective.
6. One Objective → One Verification.
7. One Verification → One Commit.
8. Never redesign stable architecture without review.
9. Runtime orchestration owns intelligence.
10. Optimize after correctness.



# ============================================================================
# AI REQUEST LIFECYCLE
# ============================================================================

Every AI request MUST follow this execution pipeline.

User
    │
    ▼
Edge Runtime
    │
    ▼
AIOrchestrator
    │
    ▼
IntentClassifier
    │
    ▼
ToolRouter
    │
    ▼
Capabilities
    │
    ├──────────────┐
    ▼              ▼
Memory        Live Search
    │              │
    └──────┬───────┘
           ▼
      RetrievalTool
           │
           ▼
      Pinecone RAG
           │
           ▼
     ContextBuilder
           │
           ▼
    PromptAssembler
           │
           ▼
     ModelGateway
           │
           ▼
 Streaming Response

Nothing may bypass this pipeline.




# ============================================================================
# CAPABILITY REGISTRY
# ============================================================================

The runtime routes by capability, not provider.

Current capabilities:

- GENERAL
- MEMORY
- KNOWLEDGE
- NEWS
- WEATHER
- MEDICAL
- PROFILE
- JOURNEY
- RAG

Provider selection is delegated to ToolRegistry.

Example:

KNOWLEDGE

↓

Exa
Wikipedia

NEWS

↓

Google News
Exa News

WEATHER

↓

Open-Meteo

Never reference providers directly outside ToolRegistry.

# ============================================================================
# NON-GOALS
# ============================================================================

The following architectural decisions are intentionally avoided.

- Client-side AI orchestration.
- Direct provider calls from UI.
- Prompt construction inside providers.
- Business logic inside screens.
- Pinecone access from React Native.
- Supabase vector storage.
- Runtime components directly depending on Pinecone SDK.
- Feature-specific implementations leaking into AI Runtime.


# ============================================================================
# EXTENDING THE AI RUNTIME
# ============================================================================

Adding a new provider:

1. Implement Provider.
2. Register Provider inside ToolRegistry.
3. Map capability.
4. Add unit tests.
5. Add integration tests.
6. Add feature flag.
7. Verify runtime trace.
8. Verify citations.

Adding a new capability:

1. Define capability enum.
2. Implement Tool.
3. Register Tool.
4. Update IntentClassifier.
5. Add PromptAssembler support.
6. Add ContextBuilder support.
7. Add tests.
8. Verify runtime.

Never modify AIOrchestrator unless introducing a new pipeline stage.

# ============================================================================
# MAJOR ARCHITECTURE DECISIONS
# ============================================================================

The following decisions are considered permanent unless superseded by an
Architecture Review.

✓ Firebase removed → Supabase adopted.

✓ Client-side AI removed → Edge AI Runtime adopted.

✓ Provider routing removed → Capability routing adopted.

✓ Direct LLM calls removed → AIOrchestrator introduced.

✓ pgvector replaced → Pinecone adopted as canonical vector database.

✓ Runtime depends on RetrievalTool abstraction.

✓ Memory separated from RAG.

✓ Screens remain presentational.

✓ Runtime architecture is considered stable (AI Platform v1.0).


# ============================================================================
# AI PLATFORM STATUS
# ============================================================================

Jouspace AI Platform

Status:
Production Ready

Architecture:
Frozen (v1.0)

Future changes should focus on:

- Bug fixes
- Performance improvements
- Better prompts
- Better retrieval quality
- Additional providers
- Better wellness content

Avoid large architectural redesigns without an explicit Architecture Review.
