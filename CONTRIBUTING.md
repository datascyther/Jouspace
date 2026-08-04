# Contributing to Jouspace

Thank you for your interest in contributing to Jouspace! We welcome contributions from developers, researchers, and designers.

---

## Workflow & Pull Requests

1. **Fork & Branch**: Create a feature or bugfix branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Local Setup**:
   ```bash
   npm ci
   cp .env.example .env  # Configure local variables as needed
   npm run dev
   ```
3. **Commit Standards**: Use conventional commits (`feat: ...`, `fix: ...`, `chore: ...`).
4. **Verification before PR**:
   Ensure all checks pass locally before opening a pull request:
   ```bash
   npm run build
   npm test
   git diff --check
   ```

---

## Architectural Guidelines

- **Presentational Screens**: Client UI screens (`app/`, `src/features/`) remain strictly presentational. Do not import repositories or call LLMs directly from screens.
- **Edge AI Runtime**: All AI orchestration logic belongs inside `api/ai/runtime/`.
- **Database & RLS**: All transactional user data access must be authenticated and enforce Supabase Row-Level Security (RLS).
- **Secrets Protection**: Never commit API keys or expose private environment variables to client-side code.
