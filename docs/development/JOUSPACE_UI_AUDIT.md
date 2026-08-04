# Jouspace UI Audit

> Analysis-only audit. No source files were modified, created, deleted, or formatted.
> Audit date: 2026-07-19. Inspect scope: entire `/Jouspace` repository (UI-relevant paths only).

---

## 1. Project Summary

| Attribute | Value |
|-----------|-------|
| App name | Jouspace (v1.0.0, package version 0.2.0) |
| Runtime | **Expo** (SDK ~54.0.36) |
| Framework | React Native **0.81.5**, React 19.1.0 |
| Platforms | iOS, Android, Web (dual runner) |
| Language | **TypeScript** (strict mode off) |
| Styling | **NativeWind v4.1** (Tailwind for RN) + custom theme tokens + inline `StyleSheet` |
| Package manager | **npm** (package-lock.json present) |
| Native entry | `index.js` → `expo-router/entry` |
| Web entry | `src/App.tsx` (loaded via Vite) |
| Routing | `expo-router` (file-based) for native; hash-based custom router in `src/App.tsx` for web |

**Important dual-runtime note:** Jouspace has **two parallel app shells**:
- Native: `app/` directory using `expo-router` (`app/_layout.tsx`, `app/(tabs)/...`).
- Web: `src/App.tsx` using Vite + a custom `window.location.hash` router and a hand-built sidebar.

Both render the same feature screens (`HomeScreen`, `ChatScreen`, `ProfileScreen`, etc.), but the navigation chrome is implemented separately. This must be reconciled in any redesign.

**Key config files:**
- `app.config.js` — Expo dynamic config (loads `.env`, Firebase/Supabase keys; splash `#0F0A1A`).
- `babel.config.js` — `babel-preset-expo` with `nativewind/babel` + `react-native-reanimated/plugin` (must be last).
- `metro.config.js` — `withNativeWind(config, { input: './src/global.css' })`; alias `@`/`@jouspace` → `src`.
- `tailwind.config.js` — Tailwind theme extension (colors, font sizes, radii, spacing).
- `postcss.config.js` — tailwindcss + autoprefixer.
- `tsconfig.json` — `paths` `@/*` → `./src/*`; types include `nativewind/types`.
- `vite.config.ts`, `vitest.config.ts` — web build & tests.

---

## 2. Relevant Project Structure

```
Jouspace/
├── app/                         # Native (expo-router) entry
│   ├── _layout.tsx              # Root Stack + providers + Toast + StatusBar
│   ├── index.tsx                # Launch/splash redirect
│   ├── onboarding.tsx           # Onboarding wrapper
│   ├── auth/
│   │   ├── welcome.tsx  login.tsx  signup.tsx
│   │   ├── forgot-password.tsx  email-verification.tsx
│   └── (tabs)/
│       ├── _layout.tsx          # Tabs + custom BottomNavigation
│       ├── index.tsx            # → HomeScreen
│       ├── chat.tsx             # → ChatScreen
│       ├── reflection.tsx       # Placeholder ReflectionScreen
│       └── profile/
│           ├── _layout.tsx  index.tsx (→ ProfileScreen)
│           ├── notifications.tsx  security.tsx  settings.tsx  subscription.tsx
├── src/
│   ├── App.tsx                  # Web shell (custom sidebar router)
│   ├── global.css               # Tailwind + CSS variables (light/dark)
│   ├── providers/ThemeProvider.tsx
│   ├── hooks/useTheme.ts
│   ├── theme/                   # PRIMARY theme source (light.ts/dark.ts)
│   │   ├── light.ts  dark.ts  colors.ts  cssVars.ts
│   │   ├── tokens.ts            # Secondary spacing/radius/typography tokens
│   │   ├── schedule.ts          # Sun-based auto theme
│   │   └── index.ts
│   ├── core/theme/              # SECONDARY theme (colors.ts + tokens.ts)
│   │   ├── colors.ts            # Purple/Cyan glass ramps (hardcoded hex)
│   │   ├── tokens.ts            # Typography/spacing/radius/shadow/gradient/motion
│   │   └── index.ts
│   ├── core/config/             # routes.ts, env.ts, features.ts
│   ├── core/store/              # zustand stores
│   ├── components/              # ThemeToggle, emotion/*
│   ├── constants/emotions.ts
│   ├── shared/
│   │   ├── assets/              # icon.png, splash.png, jouspace-logo.jpg, etc.
│   │   ├── components/          # Reusable UI primitives (see §8)
│   │   ├── components/navigation/  # BottomNavigation + items
│   │   ├── constants/index.ts   # LAYOUT, APP, MESSAGES
│   │   └── hooks/  types/
│   ├── features/
│   │   ├── auth/      (screens, components, validators)
│   │   ├── home/      (HomeScreen + 30+ components)
│   │   ├── chat/      (ChatScreen + bubbles, sheets, input)
│   │   ├── onboarding/ (OnboardingFlow)
│   │   └── profile/   (ProfileScreen + components)
│   ├── animations/emotionAnimations.ts
│   └── styles/                 # Unused-looking CSS: auth-luxury.css, chatbot-premium.css,
│                               # navigation-clean.css, password-strength.css
├── assets/                      # (root assets — minimal)
├── tailwind.config.js  babel.config.js  metro.config.js  postcss.config.js
└── index.js                    # Native entry
```

`src/styles/*.css` appear to be **legacy/unused** decorative stylesheets (auth-luxury, chatbot-premium, navigation-clean, password-strength). They are not referenced by the active NativeWind `src/global.css` pipeline.

---

## 3. Styling System

| Approach | Present? | Config location | Used in | Notes |
|----------|----------|-----------------|---------|-------|
| **NativeWind / Tailwind v4** | ✅ Primary | `tailwind.config.js`, `metro.config.js` (`withNativeWind`), `babel.config.js`, `src/global.css` | Most screens & primitives (`Button`, `Header`, `GlassCard`, `ScreenContainer`, `App.tsx`) | `darkMode: "class"`; utilities like `bg-brand-primary`, `text-text-secondary`. |
| **React Native `StyleSheet`** | ✅ Heavy | Inline `StyleSheet.create` | Navigation items, bubbles, many components | Mixed with Tailwind — see risks. |
| **Theme token JS objects** | ✅ | `src/theme/tokens.ts`, `src/core/theme/tokens.ts` | Components import `spacing`, `typography`, `borderRadius`, `shadows` | Two parallel token files. |
| **CSS variables (runtime)** | ✅ | `src/global.css`, `src/theme/cssVars.ts`, `ThemeProvider` | Drives Tailwind `var(--…)` classes | Injected at runtime via `ThemeProvider`. |
| **styled-components / Tamagui / Paper / Restyle / Unistyles / Dripsy / Gluestack** | ❌ Not found | — | — | Not used. |

**Consistency assessment:** Mixed. NativeWind utility classes are the dominant approach in newer files, but a large number of components still use raw `StyleSheet.create` and inline objects. There are **two theme token systems** (`src/theme/*` and `src/core/theme/*`) with overlapping but non-identical responsibilities, which is a significant risk (see §12).

**Hardcoded colors:** Yes — present. See §4 for full enumeration.

---

## 4. Current Color System

### 4.1 Sources of color

1. **`src/theme/light.ts` + `src/theme/dark.ts`** — Single source of truth (per its own header) for semantic theme tokens: `background`, `surface`, `text`, `border`, `glass`, `brand`, `overlay`, `success/warning/danger` + subtle/text variants. Mirrored as CSS variables in `src/global.css` and injected at runtime.
2. **`src/core/theme/colors.ts`** — Separate purple/cyan ramps + glass/surface/status hex (hardcoded). Brand ramp default differs from `light.ts`/`dark.ts`.
3. **`tailwind.config.js`** — Maps tokens to Tailwind names: `jouspace.purple/cyan/glass`, `background.*`, `surface.*`, `text.*`, `border.*`, `brand.*`, `success/warning/danger`, plus `app-dark #0B0B12` / `app-light #F8FAFF`.
4. **`src/core/theme/tokens.ts`** — `gradients` (`primary ['#7E60CD','#06B6D4']`, etc.) and `chat.blocks` accent colors.
5. **Inline `StyleSheet` / SVG `stopColor`** — many hardcoded hex/rgba values in components.
6. **`app.config.js`** — splash `#0F0A1A`, adaptive icon bg `#0F0A1A`.
7. **`src/shared/components/Toast.tsx`** — hardcoded status hex (`#34D399`, `#F87171`, `#FBBF24`, `#38BDF8`).

### 4.2 Color table

| Current Color Value | Current Name / Meaning | Files Used In | Suggested Semantic Purpose |
|---------------------|------------------------|---------------|----------------------------|
| `#0B0B12` | Dark bg primary / splash | `dark.ts`, `global.css`, `app.config.js` | App background (dark) |
| `#F7F8FC` | Light bg primary | `light.ts`, `global.css` | App background (light) |
| `#12121C` / `#181826` | Dark surface secondary/tertiary | `dark.ts`, `light.ts` mirror | Surface |
| `#16161F` / `#1E1E2E` / `#1C1C28` | Dark surface primary/card | `dark.ts` | Card/surface |
| `#FFFFFF` | Light surface primary / text on dark | `light.ts`, many components | Surface / inverse text |
| `#F8FAFC` | Light text primary / dark text primary | `light.ts`/`dark.ts` | Main text |
| `#0F172A` | Light text primary | `light.ts` | Main text (light) |
| `#475569` / `#64748B` | Light text secondary/tertiary | `light.ts` | Secondary text |
| `#C3C9D4` / `#9AA3B2` | Dark text secondary/tertiary | `dark.ts` | Secondary text (dark) |
| `#7E60CD` | Brand primary (dark) | `dark.ts`, `tokens.ts` gradient | Primary brand |
| `#634EB8` | Brand primary (light) | `light.ts` | Primary brand (light) |
| `#9F8BE6` / `#8063D6` | Brand secondary | `dark.ts`/`light.ts` | Brand accent |
| `#8B5CF6` | Purple-500 ramp / legacy brand | `core/theme/colors.ts`, `Toast`, `ProgressRing`, `LoadingSpinner`, SVG gradients | Brand / accent purple |
| `#6D28D9` / `#7C3AED` / `#A78BFA` | Purple ramp | `core/theme/colors.ts` | Brand ramp |
| `#06B6D4` / `#22D3EE` | Cyan ramp | `tokens.ts` gradient, `ProgressBar` | Secondary accent / cyan |
| `#34D399` | Success (dark) / `#16A34A` (light) | `dark.ts`, `light.ts`, `Toast` | Success |
| `#FBBF24` | Warning (dark) / `#D97706` (light) | `dark.ts`, `light.ts`, `Toast` | Warning |
| `#F87171` | Danger (dark) / `#DC2626` (light) | `dark.ts`, `light.ts`, `Toast` | Error |
| `#38BDF8` | Info (Toast only) | `Toast.tsx` | Info |
| `rgba(255,255,255,0.10)` etc. | Dark borders | `dark.ts`, nav, `GlassCard` | Border |
| `#E2E8F0` / `#CBD5E1` | Light borders | `light.ts` | Border (light) |
| `#6B7280` | Disabled/placeholder gray | `TextField`, `Avatar`, `CrashOverlay` | Disabled text |
| `#6C5CE7` | ErrorBoundary/CrashOverlay purple | `ErrorBoundary.tsx`, `CrashOverlay.tsx` | Off-theme accent (legacy) |
| `#1a0d0d` / `#ff6b6b` / `#ffd6d6` | Crash overlay reds | `CrashOverlay.tsx` | Error state (off-theme) |
| `#E9D5FF`→`#8B5CF6` | AI avatar gradient | `AIMessageBubble.tsx` | AI companion gradient |
| `#7DD3FC`, `#818CF8`, `#FBA7A0`, `#8B9CF8`, `#6366F1` | Mood illustration gradients | `emotion/illustrations/*`, `EmotionAvatar` | Mood/emotion accents |

### 4.3 Centralization & consistency findings

- **Palette is partially centralized.** Semantic theming is centralized in `src/theme/{light,dark}.ts` + CSS variables. However, **brand purple appears under at least three identities**: `#7E60CD` (dark brand), `#634EB8` (light brand), and `#8B5CF6` (purple-500 in `core/theme/colors.ts` and used in `ProgressRing`, `LoadingSpinner`, `Toast`).
- **Duplicated colors with different names:** `#8B5CF6` (purple.500) vs `#7E60CD` (dark brand) vs `#634EB8` (light brand) are all "the brand purple" but live in different files. `app-dark #0B0B12` in Tailwind duplicates `background.primary` dark.
- **Scattered hardcoded values:** `Toast`, `ErrorBoundary`, `CrashOverlay`, `Avatar`, `TextField`, `ProgressRing`, `LoadingSpinner`, and all emotion SVG illustrations embed raw hex/rgba not sourced from tokens.
- **Inconsistent status colors:** `Toast` uses `#38BDF8` for info while `core/theme/colors.ts` status.info is `#38BDF8` (matches) but `dark.ts` has no `info` token — only success/warning/danger. `tokens.ts` `chat.blocks` defines its own accent set (`#8B5CF6`, `#06B6D4`, `#34D399`, `#FBBF24`, `#A78BFA`, `#818CF8`) partially overlapping `core/theme/colors.ts` status.
- **Two theme token systems with drift:** `src/theme/tokens.ts` (spacing xs..xxl, radius sm..pill, typography text styles) vs `src/core/theme/tokens.ts` (richer: spacing xs..8xl, radius, shadows, gradients, motion, chat). Components import from both (`@/core/theme` and `@/theme`). This is the #1 maintainability risk.
- **Low-contrast / accessibility concerns:** `text-white/40` used for subtitles in `Header.tsx` on a dark surface is low-contrast (below AA for small text). `text-white/40` label in `Header` and `rgba(255,255,255,0.4)` placeholder text should be checked against backgrounds. Dark theme text was explicitly "tuned for ~4.5:1 AA" per `dark.ts` header, so core token text is likely OK; the risks are the inline `/40` and `/60` opacities used ad hoc.

---

## 5. Typography System

- **Fonts:** `Geomini` (custom brand font, intended for sans/display), `SF Pro Text`/`SF Pro Display` (iOS fallbacks), `JetBrains Mono` (mono). Loaded via `expo-font` (configured in `app.config.js` plugins) — actual `useFonts` call not found in inspected files (font likely registered through Expo asset config; verify `expo-font` usage). Fallback chain declared in `tailwind.config.js` fontFamily.
- **Font weights:** 400/500/600/700/800 (per tokens).
- **Font sizes / line heights:** Defined in `tailwind.config.js` (`hero 56`, `page-title 40`, `section-title 28`, `card-title 20`, `body-lg 18`, `body 16`, `body-sm 14`, `caption 13`, `label 12`) and mirrored in `src/core/theme/tokens.ts` `typography`.
- **Chat typography:** Dedicated scale in `tokens.ts` `chatTypography` (bodyAI 16/26, bodyUser 15/22, h1 20/28, etc.).
- **Standardized or hardcoded?** Mostly standardized via tokens, but `App.tsx` and `Header.tsx` use raw Tailwind sizing (`text-lg`, `text-xl`, `text-sm`) and `reflection.tsx` uses raw `fontSize: 28`/`16`. `IntelligentThinkingIndicator` hardcodes `'Menlo'/'monospace'`. `NavigationItem` hardcodes `fontSize: 10`.

### Typography table

| Usage | Font Family | Weight | Font Size | Line Height | Files / Components |
|------|-------------|--------|-----------|-------------|-------------------|
| Screen title (page) | Geomini/SF Pro Display | 700 | 40px | 1.15 | `tailwind.config.js` page-title |
| Section title | Geomini | 600 | 28px | 1.2 | `tokens.ts`, `Header` (card-title 20 used instead) |
| Card title | Geomini | 600 | 20px | 1.3 | `Header.tsx`, `tokens.ts` |
| Body text | Geomini/SF Pro Text | 400 | 16px | 1.7 | `tokens.ts` body, `Button` |
| Body large | Geomini | 400 | 18px | 1.7 | `tokens.ts` body-lg |
| Caption | Geomini | 400 | 13px | 1.5 | `tokens.ts` caption |
| Button label | Geomini | 600 | 16px | — | `Button.tsx`, `GradientButton` |
| Input text | Geomini | 400 | 16px | — | `TextField.tsx`, `ReflectionInput` |
| Chat AI message | Geomini | 400 | 16px | 26 | `AIMessageBubble`/`chatTypography` |
| Chat user message | Geomini | 400 | 15px | 22 | `UserMessageBubble` |
| Navigation label | (system) | 600 | 10px | — | `NavigationItem.tsx` (hardcoded) |
| Header subtitle | (system) | 500 | 12px | — | `Header.tsx` (text-label) |
| Mono / code | JetBrains Mono | 400 | 13px | 20 | `MarkdownRenderer`, `tokens.ts` code |
| Email/Password input (web) | Geomini | — | — | — | `App.tsx` shell |

---

## 6. Spacing, Radius, Borders, and Shadows

### Spacing scale
Two definitions exist:
- `src/theme/tokens.ts`: `xs4 sm8 md12 lg16 xl24 xxl32`
- `src/core/theme/tokens.ts`: `xs4 sm8 md12 lg16 xl20 2xl24 3xl32 4xl48 section40 ... 8xl120`

Tailwind also exposes `safe-*` env insets. Inconsistent scale between the two token files.

### Radius scale
- `tailwind.config.js`: `glass 16`, `glass-sm 12`, `glass-lg 24`.
- `src/theme/tokens.ts`: `sm4 md8 lg12 pill9999`.
- `src/core/theme/tokens.ts`: `xs4 sm8 md12 lg16 xl20 2xl24 full9999 glass16 glass-sm12 glass-lg24`.

### Shadow / elevation
Defined in `src/core/theme/tokens.ts` `shadows`: `sm`, `md`, `lg`, `glass` (shadowColor `#8B5CF6`). Used by `GlassCard` (imports `shadows.glass`). Many other components hardcode `shadowColor: '#000'` (ChatHistorySheet, ChatInput, MessageActionSheet, NavigationContainer) instead of using tokens.

### Repeated component patterns
| Pattern | Where | Tokenized? |
|--------|-------|-----------|
| Glass frosted card w/ SVG gradient border | `GlassCard` | Partially (uses `shadows.glass`) |
| Gradient pill button | `GradientButton` | Uses brand tokens |
| Primary/secondary/ghost/destructive button | `Button` | Uses Tailwind tokens |
| Bottom tab pill (floating) | `NavigationContainer` | Hardcoded rgba/shadow |
| Screen background + safe area | `ScreenContainer` | Uses theme tokens |
| Modal / BottomSheet | `Modal`, `BottomSheet` | Mixed |
| Avatar circle | `Avatar` | Hardcoded `#6B7280` fallback |
| Progress indicators | `ProgressBar`, `ProgressRing` | Hardcoded `#8B5CF6` |
| Mood illustration gradients | `emotion/illustrations/*` | Hardcoded per mood |

**Reusable tokens exist?** Yes for typography/spacing/radius/shadow at the token-file level, but **adoption is inconsistent** — many components bypass tokens and hardcode values.

---

## 7. Navigation and App Shell

- **Library:** `@react-navigation/bottom-tabs` + `expo-router` (native). Web uses a custom hash router in `src/App.tsx` with a fixed sidebar.
- **Native structure:**
  - Root `Stack` (`app/_layout.tsx`): `index` → `auth/*` → `onboarding` → `(tabs)`. Header hidden; per-screen `animation` (fade / slide_from_right / slide_from_bottom).
  - `(tabs)` Tabs (`app/(tabs)/_layout.tsx`): 4 tabs — Home, Chat, Reflection, Profile — header hidden, custom `tabBar` = `BottomNavigation`.
- **Bottom tab styling:** Custom floating pill (`NavigationContainer`: `bottom = max(TAB_BAR_MARGIN=16, insets.bottom)`, `height=72`, `zIndex=100`, glass background `rgba(18,18,27,0.74)` dark / `rgba(255,255,255,0.8)` light). Active color = `colors.brand.primary`; inactive = `colors.text.secondary`; disabled = `colors.text.disabled`. Icons are **custom inline SVGs** (`IconWrapper`): home, chat (RiChatAiFill), reflection (RiQuillPenAiFill), profile (FaUserLarge) — from react-icons path data rendered via `react-native-svg`.
- **Header styling:** Per-screen `Header.tsx` (title `text-white` card-title, subtitle `text-white/40` label). Chat uses `ChatHeader`. Reflection tab uses its own minimal `SafeAreaView` + `<Text>`.
- **Status bar:** `ThemeStatusBar` (light content on dark, dark on light) and also set inside `ScreenContainer`.
- **Safe area:** `SafeAreaView` (`react-native-safe-area-context`) in `ScreenContainer`, `HomeScreen`, `ChatScreen`, `ReflectionScreen`. `useSafeAreaInsets` used in chat for keyboard clearance.
- **Separate navigation theme?** No dedicated React Navigation `Theme`/`NavigationContainer` theme object. Colors come from `useTheme().colors` passed via `NavigationContext`.

### Route list

| Route / Screen | Nav Type | Main Purpose | Main UI Components |
|---------------|----------|--------------|--------------------|
| `index` | Stack | Splash/redirect to auth or tabs | — |
| `auth/welcome` | Stack | Welcome / entry choice | `WelcomeScreen` |
| `auth/login` | Stack | Login | `LoginScreen`, `TextField`, `Button`, `PasswordField` |
| `auth/signup` | Stack | Sign up | `SignupScreen` |
| `auth/forgot-password` | Stack | Reset password | `ForgotPasswordScreen` |
| `auth/email-verification` | Stack | Email verify | `EmailVerificationScreen` |
| `onboarding` | Stack | Multi-step onboarding | `OnboardingFlow` |
| `(tabs)/index` = Home | Tab | Dashboard/home | `HomeScreen` + home components |
| `(tabs)/chat` | Tab | AI chat | `ChatScreen` + chat components |
| `(tabs)/reflection` | Tab | Journaling (placeholder) | `ReflectionScreen` (minimal) |
| `(tabs)/profile` | Tab | Profile hub | `ProfileScreen` |
| `profile/notifications` | Stack | Notifications settings | (not inspected deeply) |
| `profile/security` | Stack | Security settings | — |
| `profile/settings` | Stack | Settings | — |
| `profile/subscription` | Stack | Paywall/subscription | — |

---

## 8. Reusable UI Components

Located in `src/shared/components/` (and `src/components/emotion/`):

| Component | File Path | Current Styling Pattern | Reusable? | Theme Impact During Redesign |
|-----------|-----------|-------------------------|-----------|------------------------------|
| Button | `shared/components/Button.tsx` | Tailwind + `useTheme` | ✅ Yes | Low — uses tokens; align variants |
| GradientButton | `shared/components/GradientButton.tsx` | SVG gradient + Reanimated | ✅ Yes | Med — gradient colors are brand |
| GlassCard | `shared/components/GlassCard.tsx` | Tailwind + SVG border + `shadows.glass` | ✅ Yes (signature) | High — iconic element; keep glass system |
| Header | `shared/components/Header.tsx` | Tailwind (`text-white/40`) | ✅ Yes | Med — hardcoded white opacities |
| ScreenContainer | `shared/components/ScreenContainer.tsx` | StyleSheet + theme tokens | ✅ Yes | Low |
| Modal | `shared/components/Modal.tsx` | Tailwind + lucide X | ✅ Yes | Low |
| BottomSheet | `shared/components/BottomSheet.tsx` | (inspect) Tailwind | ✅ Yes | Low |
| Avatar | `shared/components/Avatar.tsx` | Tailwind + hardcoded `#6B7280` | ✅ Yes | Med — hardcoded fallback color |
| Badge | `shared/components/Badge.tsx` | StyleSheet + hardcoded white | ✅ Yes | Low |
| Checkbox | `shared/components/Checkbox.tsx` | Tailwind + hardcoded `#FFFFFF` | ✅ Yes | Low |
| IconButton | `shared/components/IconButton.tsx` | Tailwind | ✅ Yes | Low |
| LoadingSpinner | `shared/components/LoadingSpinner.tsx` | hardcoded `#8B5CF6` | ✅ Yes | Med — brand color hardcoded |
| ProgressBar | `shared/components/ProgressBar.tsx` | hardcoded `#8B5CF6` + cyan stop | ✅ Yes | Med |
| ProgressRing | `shared/components/ProgressRing.tsx` | hardcoded `#8B5CF6` | ✅ Yes | Med |
| SearchField | `shared/components/SearchField.tsx` | Tailwind + lucide + rgba | ✅ Yes | Low |
| SectionHeader | `shared/components/SectionHeader.tsx` | Tailwind + `typography` | ✅ Yes | Low |
| SkeletonLoader | `shared/components/SkeletonLoader.tsx` | (shimmer) | ✅ Yes | Low |
| TextField | `shared/components/TextField.tsx` | Tailwind + theme + hardcoded placeholder | ✅ Yes | Low |
| PasswordField | `shared/components/PasswordField.tsx` | Tailwind + lucide eye | ✅ Yes | Low |
| Toast | `shared/components/Toast.tsx` | hardcoded status hex + lucide | ✅ Yes | Med — status colors hardcoded |
| ThemeStatusBar | `shared/components/ThemeStatusBar.tsx` | expo-status-bar | ✅ Yes | Low |
| ThemeToggle | `components/ThemeToggle.tsx` | (web) | ✅ Yes | Low |
| EmotionAvatar | `shared/components/EmotionAvatar.tsx` + `components/emotion/EmotionAvatar.tsx` | SVG illustrations | ✅ Yes | High — AI companion visual identity |
| EmotionBadge / EmotionCard / EmotionSelector | `components/emotion/*` | Tailwind + SVG | ✅ Yes | High — mood system identity |
| BottomNavigation | `shared/components/navigation/BottomNavigation.tsx` | Custom + `useTheme` | ✅ Yes | High — app shell |
| NavigationContainer / NavigationItem / IconWrapper / ActiveIndicator / Badge / NavigationContext | `shared/components/navigation/*` | Mixed StyleSheet/Tailwind | ✅ Yes | High — app shell |

**Chat-specific components** (`src/features/chat/components/`): `AIMessageBubble`, `UserMessageBubble`, `MessageBubble`, `BaseMessageBubble`, `ChatInput`, `ChatHeader`, `TypingIndicator`, `IntelligentThinkingIndicator`, `ReflectionCard`, `MessageActionSheet`, `ChatHistorySheet`, `DailyInsightCard`, `MarkdownRenderer`, `ConversationList`, `EmptyConversation`, `ConversationSkeleton`. These are feature-scoped but heavily theme-dependent (bubble colors, gradients).

---

## 9. Screen Inventory

| Screen | File Path | Dominant Current Colors | Layout | Key Components | Redesign Priority |
|--------|-----------|------------------------|--------|----------------|-------------------|
| Home / Dashboard | `features/home/screens/HomeScreen.tsx` | Dark bg `#0B0B12`, brand purple, glass cards | Scroll: header → HeroCard → QuickActions → Reflection → WeeklyHistory → SmartRec → Mood check-in | `HeroCard`, `QuickActionsBar`, `MoodSelector`, `GlassCard`, `GradientButton` | **Early** (primary surface) |
| AI Chat | `features/chat/screens/ChatScreen.tsx` | Dark bg, AI bubble `surface.secondary`, user bubble `brand.primary` | Header + MessageList + ChatInput (keyboard-aware) | `AIMessageBubble`, `UserMessageBubble`, `ChatInput`, `TypingIndicator` | **Early** (core feature) |
| Reflection (tab) | `app/(tabs)/reflection.tsx` | Dark bg, text primary/secondary | Centered placeholder text | raw `<Text>` | **Early** (currently empty — design from scratch) |
| Profile | `features/profile/screens/ProfileScreen.tsx` | Dark bg, glass, brand | Header + stats + menu list | `ProfileHeader`, `ProfileStatsRow`, `ProfileMenuList`, `EditProfileModal` | **Medium** |
| Onboarding | `features/onboarding/screens/OnboardingFlow.tsx` | (uses brand/gradient) | Multi-step flow | `OnboardingFlow`, lucide Sparkles | **Medium** |
| Login | `features/auth/screens/LoginScreen.tsx` | Dark, glass, brand | Form | `TextField`, `PasswordField`, `Button`, `GoogleSignInButton` | **Medium** |
| Signup | `features/auth/screens/SignupScreen.tsx` | Same as login | Form | same | **Medium** |
| Forgot Password | `features/auth/screens/ForgotPasswordScreen.tsx` | Same | Form | `Button`, lucide | **Later** |
| Email Verification | `features/auth/screens/EmailVerificationScreen.tsx` | Same | Status | lucide icons | **Later** |
| Welcome | `features/auth/screens/WelcomeScreen.tsx` | Same | Entry | lucide (User/Shield/Info) | **Medium** |
| Subscription / Paywall | `app/(tabs)/profile/subscription.tsx` | (not inspected) | Paywall | — | **Medium** (revenue) |
| Settings | `app/(tabs)/profile/settings.tsx` | (not inspected) | List | `ProfileMenuItem` | **Later** |
| Security | `app/(tabs)/profile/security.tsx` | (not inspected) | List | — | **Later** |
| Notifications | `app/(tabs)/profile/notifications.tsx` | (not inspected) | List | — | **Later** |
| Mood Timeline | `features/home/screens/MoodTimelineScreen.tsx` | Dark, mood colors | Timeline/calendar | `MoodTimeline`, `MoodTimelineVisual`, lucide | **Medium** |

**Special Jouspace screens to prioritize:** Home, AI Chat, Reflection (empty), Onboarding, Mood/Emotional check-in (`MoodSelector`, `CheckInPanel`), Profile, Subscription.

---

## 10. Icons, Assets, and Animation

- **Icon libraries:** `lucide-react-native` (primary, ~46 usages across features/shared), `react-icons`/`@react-icons/all-files` (path data only, rendered via `react-native-svg` — raw react-icons crash on native, so wrapped), `@expo/vector-icons` (installed, usage not confirmed in inspected files).
- **Custom SVG assets:** Tab bar icons in `IconWrapper.tsx` (hand-embedded react-icons path data: RiChatAiFill, GiHorizonRoad, ImHome, FaUserLarge, RiQuillPenAiFill). AI companion feather/avatar SVGs in `AIMessageBubble` and `EmotionAvatar`.
- **Image assets:** `src/shared/assets/`: `icon.png`, `splash.png`, `adaptive-icon.png`, `favicon.png`, `jouspace-logo.jpg`, `welcome_illustration.png`.
- **Lottie:** `lottie-react-native` **not in dependencies** (only a mock `src/utils/lottie-react-native-mock.tsx` exists). No Lottie usage found.
- **Reanimated:** `react-native-reanimated` **4.1.7** — heavily used (button springs, bubble animations, keyboard easing, shimmer, `FadeInDown`, `withSpring`).
- **Moti:** Not installed.
- **Gesture handler:** `react-native-gesture-handler` — loaded first in `index.js`; used by navigation/panels.
- **Animations / micro-interactions:** `src/animations/emotionAnimations.ts`; chat streaming cursor, typing dots, bubble appear, sheet slide-up (see `tokens.ts` `motion`); haptics via `expo-haptics` on tab press & buttons.
- **AI companion illustration/avatar:** `EmotionAvatar` + 5 mood illustrations (`Calm`, `Good`, `Great`, `NotGood`, `Overwhelmed`) in `components/emotion/illustrations/` — each a custom gradient SVG. This is the strongest branded visual asset.
- **Consistency:** Icon approach is consistent (lucide + svg-wrapped react-icons). Animation approach is consistent (Reanimated). No Lottie/Moti.

---

## 11. UI-Relevant Dependencies

| Dependency | Status | Notes |
|-----------|--------|-------|
| `nativewind` ~4.1 + `tailwindcss` | ✅ Used | Core styling system |
| `expo-router` / `@react-navigation/bottom-tabs` | ✅ Used | Navigation |
| `react-native-reanimated` 4.1.7 | ✅ Used | Animations |
| `react-native-gesture-handler` | ✅ Used | Gestures |
| `react-native-safe-area-context` | ✅ Used | Safe areas |
| `react-native-svg` 15.12.1 | ✅ Used | Icons, illustrations, gradients |
| `lucide-react-native` | ✅ Used | Primary icons |
| `react-icons` / `@react-icons/all-files` | ✅ Used (path data only) | Wrapped in SVG for native |
| `@expo/vector-icons` | ⚠️ Installed, usage not confirmed | Optional |
| `expo-linear-gradient` ~15.0.8 | ⚠️ Installed; SVG `LinearGradient` used instead in components | Components prefer `react-native-svg` gradients |
| `expo-blur` | ⚠️ Installed; glass effect uses SVG/opacity, not confirmed used | Verify |
| `expo-font` | ✅ Used (config) | Font loading |
| `expo-haptics` | ✅ Used | Feedback |
| `expo-status-bar` | ✅ Used | Status bar |
| `expo-speech` / `expo-speech-recognition` | ✅ Installed | Voice input (chat) |
| `class-variance-authority`, `clsx`, `tailwind-merge` | ✅ Installed | Class utilities (used by Avatar variants etc.) |
| `zustand` | ✅ Used | State (theme in store) |
| `react-native-paper` / `gluestack` / `tamagui` / `styled-components` / `restyle` / `unistyles` / `dripsy` | ❌ Not present | Not needed |
| `lottie-react-native` | ❌ Not present (mock only) | Add later if desired |
| `moti` | ❌ Not present | Not needed |
| `react-native-screens` | ✅ Used | Navigation perf |

---

## 12. Design-System Problems and Risks

**A. Current design-system maturity: PARTIAL.**
Semantic theming + tokens + Tailwind exist and are well-structured at the token level, but adoption is inconsistent and there are duplications.

**B. Main styling risks:**
1. **Two parallel theme systems.** `src/theme/*` (light.ts/dark.ts — semantic, runtime CSS-var driven) vs `src/core/theme/*` (colors.ts purple/cyan ramps + tokens.ts rich tokens). Components import from both. High drift risk (e.g. brand purple defined 3 ways).
2. **Hardcoded colors scattered.** `Toast`, `ProgressRing`, `LoadingSpinner`, `ProgressBar`, `Avatar`, `TextField`, `ErrorBoundary`, `CrashOverlay`, and all emotion SVGs embed raw hex/rgba not sourced from tokens.
3. **Mixed styling approaches.** NativeWind utilities + raw `StyleSheet.create` + inline objects coexist (e.g. `Button` uses Tailwind, `NavigationItem` uses StyleSheet, `GlassCard` mixes both).
4. **Two app shells.** Native `expo-router` tabs vs web `src/App.tsx` sidebar — navigation chrome diverges; a theme change may apply to one and not the other.
5. **Low-contrast ad-hoc opacities.** `text-white/40`, `rgba(255,255,255,0.4)` used for subtitles/placeholders — accessibility risk on dark surfaces.
6. **Legacy/unused files.** `src/styles/*.css` (auth-luxury, chatbot-premium, navigation-clean, password-strength) appear orphaned. `core/theme/colors.ts` purple ramp may be partially redundant with `light.ts`/`dark.ts` brand.
7. **Status color inconsistency.** `Toast`/`tokens` define `info #38BDF8` but `dark.ts`/`light.ts` lack an `info` token; `chat.blocks` accents partially duplicate `core/theme/colors.ts` status.

**C. Safe redesign strategy:**
- Unify to **one** theme source: keep `src/theme/{light,dark}.ts` + CSS variables as the single source; deprecate `src/core/theme/colors.ts` purple ramp in favor of `brand` tokens; merge the two `tokens.ts` files.
- Convert hardcoded hex in `Toast`, `Progress*`, `Avatar`, `LoadingSpinner`, emotion SVGs to token references.
- Promote `GlassCard`, `Button`, `GradientButton`, `ScreenContainer`, `BottomNavigation` to canonical theme primitives.
- Redesign **first**: Home, Chat, Reflection (empty — greenfield), Onboarding. **Medium**: Profile, Mood Timeline, Auth. **Later**: Settings/Security/Notifications sub-screens.
- Do **not** change: `GlassCard` SVG border technique, Reanimated keyboard-clearance logic in `ChatScreen` (edge-to-edge Android bug), `ThemeProvider` runtime CSS-var injection, tab bar floating layout, without careful testing.

**D. Exact files needed for a future redesign (share with AI assistant):**
- `tailwind.config.js`
- `src/global.css`
- `src/theme/light.ts`
- `src/theme/dark.ts`
- `src/theme/cssVars.ts`
- `src/theme/tokens.ts`
- `src/theme/index.ts`
- `src/core/theme/colors.ts` (to be consolidated)
- `src/core/theme/tokens.ts` (to be consolidated)
- `src/core/theme/index.ts`
- `src/providers/ThemeProvider.tsx`
- `src/hooks/useTheme.ts`
- `app/_layout.tsx`, `app/(tabs)/_layout.tsx`
- `src/App.tsx` (web shell)
- `src/shared/components/ScreenContainer.tsx`, `Button.tsx`, `GradientButton.tsx`, `GlassCard.tsx`, `Header.tsx`
- `src/shared/components/navigation/*` (BottomNavigation, NavigationContainer, NavigationItem, IconWrapper)
- `src/shared/constants/index.ts` (LAYOUT)
- Feature screens: `features/home/screens/HomeScreen.tsx`, `features/chat/screens/ChatScreen.tsx`, `app/(tabs)/reflection.tsx`, `features/profile/screens/ProfileScreen.tsx`, `features/onboarding/screens/OnboardingFlow.tsx`
- Emotion assets: `src/components/emotion/*`, `src/shared/components/EmotionAvatar.tsx`

---

## 13. Recommended Safe Redesign Order

1. **Consolidate theme source** — merge `src/core/theme/*` into `src/theme/*`; eliminate triple brand-purple definitions; keep `light.ts`/`dark.ts` + CSS vars as single source of truth. (No visual change.)
2. **Tokenize hardcoded colors** — `Toast`, `ProgressRing`, `LoadingSpinner`, `ProgressBar`, `Avatar`, `TextField`, emotion SVGs.
3. **Establish theme primitives** — finalize `GlassCard`, `Button`, `GradientButton`, `ScreenContainer`, `BottomSheet`, `Modal`, `NavigationItem` as the reusable kit.
4. **Redesign Home screen** (primary surface, highest traffic).
5. **Redesign AI Chat** (core feature; preserve keyboard/edge-to-edge logic).
6. **Build Reflection tab** from scratch (currently an empty placeholder).
7. **Redesign Onboarding + Auth** (first impression).
8. **Redesign Profile + Mood Timeline** (medium priority).
9. **Reconcile web shell** (`src/App.tsx`) to match native theme.
10. **Settings/Security/Notifications/Subscription** — last.

---

## 14. Files to Share for a Theme Redesign

(Path list — same as §12.D)

- `tailwind.config.js`
- `src/global.css`
- `src/theme/light.ts`
- `src/theme/dark.ts`
- `src/theme/cssVars.ts`
- `src/theme/tokens.ts`
- `src/theme/index.ts`
- `src/core/theme/colors.ts`
- `src/core/theme/tokens.ts`
- `src/core/theme/index.ts`
- `src/providers/ThemeProvider.tsx`
- `src/hooks/useTheme.ts`
- `app/_layout.tsx`
- `app/(tabs)/_layout.tsx`
- `src/App.tsx`
- `src/shared/components/ScreenContainer.tsx`
- `src/shared/components/Button.tsx`
- `src/shared/components/GradientButton.tsx`
- `src/shared/components/GlassCard.tsx`
- `src/shared/components/Header.tsx`
- `src/shared/components/navigation/BottomNavigation.tsx`
- `src/shared/components/navigation/NavigationContainer.tsx`
- `src/shared/components/navigation/NavigationItem.tsx`
- `src/shared/components/navigation/IconWrapper.tsx`
- `src/shared/constants/index.ts`
- `src/features/home/screens/HomeScreen.tsx`
- `src/features/chat/screens/ChatScreen.tsx`
- `app/(tabs)/reflection.tsx`
- `src/features/profile/screens/ProfileScreen.tsx`
- `src/features/onboarding/screens/OnboardingFlow.tsx`
- `src/components/emotion/EmotionAvatar.tsx`
- `src/components/emotion/illustrations/*`

---

## 15. Short Summary for an External UI Consultant

- **Runtime:** Expo SDK ~54, React Native 0.81.5, React 19, TypeScript. Dual runner: native (`expo-router` + `index.js`) and web (`Vite` + `src/App.tsx`).
- **Styling system:** NativeWind v4 (Tailwind for RN) + runtime CSS variables + JS token objects + some raw `StyleSheet`. `darkMode: "class"`.
- **Theme/color files:** `src/theme/light.ts`, `src/theme/dark.ts` (semantic source of truth), `src/global.css` (CSS vars), `src/theme/cssVars.ts` (runtime injection), `tailwind.config.js` (Tailwind names), plus a secondary `src/core/theme/colors.ts` + `src/core/theme/tokens.ts` that should be consolidated.
- **Main current colors:** Dark bg `#0B0B12`; brand purple `#7E60CD` (dark) / `#634EB8` (light) with legacy `#8B5CF6`; cyan accent `#06B6D4`; success `#34D399`, warning `#FBBF24`, danger `#F87171`. Signature element = frosted "GlassCard" with SVG gradient border.
- **Current font:** `Geomini` (custom) with SF Pro fallbacks; `JetBrains Mono` for code. Scale defined in `tailwind.config.js` (`hero`→`label`) and `tokens.ts`.
- **Navigation:** 4-tab bottom bar (Home, Chat, Reflection, Profile) — custom floating glass pill with embedded SVG tab icons; root Stack for auth/onboarding. Web uses a separate sidebar.
- **Main screens:** Home dashboard, AI Chat (custom bubbles), Reflection (empty placeholder), Profile, Onboarding, Auth (login/signup), Mood Timeline, Subscription.
- **Existing UI libraries:** NativeWind, react-native-reanimated, react-native-svg, lucide-react-native, react-icons (SVG-wrapped), expo-* (font, haptics, status-bar, blur, linear-gradient), zustand. No Lottie/Moti/Paper.
- **Recommended starting files:** `tailwind.config.js`, `src/global.css`, `src/theme/{light,dark}.ts`, `src/providers/ThemeProvider.tsx`, `src/shared/components/{GlassCard,Button,GradientButton,ScreenContainer}.tsx`, and the Home + Chat screens.

---

*End of audit. No code was modified.*
