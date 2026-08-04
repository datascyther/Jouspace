# Jouspace

A journal-first conversational AI interface exploring reflective journaling, mood tracking, and self-awareness using modern LLM runtime tools.

> **Important Boundary Disclaimer**
> Jouspace is an experimental software application focused on reflective journaling, behavioral awareness, and conversational interface design. **It is not a medical device, therapy app, or crisis intervention service.** It does not provide clinical diagnosis or professional medical care.

---

## Scope & Thesis (v0.1)

Most wellness interfaces track entries without conversation or provide stateless chat without memory. Jouspace explores a middle ground: combining structured journaling, session memory, and guided reflection to help users notice emotional and behavioral patterns over time.

### Core v0.1 Scope
- **Journal-First Reflection**: Daily entry creation, mood logging, and structured timeline review.
- **Conversational Memory**: Edge AI Runtime integrating session context and retrieval-augmented reflection.
- **Privacy & Security**: Supabase authentication with Row-Level Security (RLS) policies for user data protection.

---

## Architecture Overview

```text
Jouspace/
├── app/                  # App routing layer (Expo Router)
├── src/                  # Product UI, domain modules, state stores & repositories
├── api/                  # Server-side Edge AI Runtime endpoints & orchestration
├── supabase/             # Supabase database migrations, seed data, and RLS policies
├── assets/               # Application icons and static visual assets
├── scripts/              # Developer tooling and RAG ingestion scripts
├── docs/                 # System documentation
│   ├── architecture/     # System design & UI architecture
│   ├── decisions/        # Architecture Decision Records (ADRs)
│   └── development/      # User flows, design systems, and audit logs
├── README.md
├── CONTRIBUTING.md
├── SECURITY.md
└── CODE_OF_CONDUCT.md
```

---

## Quick Start

### Prerequisites
- **Node.js**: >= 20.0.0
- **npm**: >= 10.0.0

### Setup & Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/DataScyther/Jouspace.git
   cd Jouspace
   ```

2. **Install dependencies**:
   ```bash
   npm ci
   ```

3. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Populate .env with your Supabase and local development keys
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

5. **Run Tests & Verification**:
   ```bash
   npm run build
   npm test
   git diff --check
   ```

---

## Documentation & Contribution

- **Architecture**: See [docs/architecture/](docs/architecture/) for component structure and design principles.
- **Decisions**: See [docs/decisions/](docs/decisions/) for foundation rationale and emotion system specs.
- **Contributing**: Read [CONTRIBUTING.md](CONTRIBUTING.md) for pull request guidelines and development practices.
- **Security**: Read [SECURITY.md](SECURITY.md) for vulnerability reporting and security invariants.
