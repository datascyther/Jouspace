# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability in **Jouspace**, please report it responsibly. Do **not** create public GitHub issues for security vulnerabilities.

Instead, please email security details to:
`security@jouspace.app` (or contact the repository maintainers directly).

Please include:
- A description of the vulnerability and potential impact.
- Steps to reproduce or proof-of-concept code.
- Any suggested mitigations.

Maintainers will acknowledge receipt of your report within 48 hours and provide regular updates on remediation.

---

## Security Architecture & Invariants

Jouspace adheres to strict security constraints across all layers:

1. **Secrets Invariant**: Secrets, API keys, and service role keys must **NEVER** enter client-side code (`src/`, `app/`) or be exposed through `VITE_*` environment variables.
2. **Server-Side AI Runtime**: AI providers and API calls are routed exclusively through the Edge AI Runtime server layer (`api/`).
3. **Database Security**: Supabase transactional data is protected via Row Level Security (RLS) policies ensuring users can only access their own data.
4. **Vector Data Separation**: Vector embeddings (Pinecone) do not store raw transactional PII.
