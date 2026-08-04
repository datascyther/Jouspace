# Jouspace — Authentication Layer

Authentication is built **before any application data** and is **completely
isolated** from the UI. The boundary is strict and one-directional:

```
UI / Feature code
   │  NEVER imports @supabase/supabase-js or backend/client directly
   ▼
AuthService            (backend/services/AuthService.ts)
   │  NEVER imports @supabase/supabase-js directly
   ▼
AuthRepository         (backend/repositories/AuthRepository.ts)
   │  the ONLY module that touches the Supabase auth client
   ▼
Supabase Auth
```

## Deliverables (all implemented)

| Deliverable | Repository / Service method |
| --- | --- |
| Sign Up | `authService.signUp(email, password, meta?)` |
| Sign In (email+password) | `authService.signIn(email, password)` |
| Sign Out | `authService.signOut()` |
| Password Reset | `authService.resetPassword(email, redirectTo?)` |
| Email Verification | `authService.resendVerificationEmail(email, redirectTo?)` |
| Session Restore | `authService.init()` restores persisted session via `authRepository.getSession()` |
| Session Refresh | `authService.refreshSession()` (auto-refresh also on via client `autoRefreshToken`) |
| Protected Routes | `authService.isRouteProtected(route)` / `authService.requireAuth()` + `backend/services/authGuard.ts` |
| Google OAuth (MVP) | `authService.signInWithGoogle(redirectTo?)` |
| Anonymous Guest (MVP optional) | `authService.signInAnonymously()` |

Future providers (Apple, GitHub, Microsoft) are already typed in
`AuthRepository.OAuthProvider` and wired through `signInWithProvider(provider)`.

## How the UI integrates

```ts
import { authService } from 'backend/services';

// App start
await authService.init(); // restores session + subscribes to changes

// Subscribe a screen to auth state
const unsub = authService.subscribe((session) => { /* re-render */ });

// Sign in (email + password)
await authService.signIn(email, password);

// Google
const { url } = await authService.signInWithGoogle('jouspace://auth/callback');

// Guard a route
if (authService.isRouteProtected(route)) authService.requireAuth();
```

## Session persistence on device

`backend/client.ts` automatically uses `@react-native-async-storage/async-storage`
as the Supabase Auth store when running in React Native (detected via
`navigator.product === 'ReactNative'`), and `localStorage` in the browser. In
Node (tests) an in-memory store is used. No extra wiring required in the app —
session restore/refresh work out of the box once the env vars are set.

## Rules (enforced by code review, not just docs)

- UI components import **only** `authService` (and `authGuard`) — never Supabase.
- `AuthService` imports **only** `AuthRepository` — never Supabase directly.
- `AuthRepository` is the sole owner of the Supabase auth client.
- `profiles` rows are auto-created by the `handle_new_user()` DB trigger, so
  after sign-up call `ProfileRepository.getCurrent()` to load the profile.
- The `service_role` key is never used client-side; account deletion requires
  a server/edge function (`deleteAccount()` throws `admin_required` otherwise).
