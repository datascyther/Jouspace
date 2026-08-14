import React, { useState, useId } from 'react';
import { Mail, Lock, User as UserIcon, ArrowLeft, Eye, EyeOff, CheckCircle2, Shield, Lock as LockIcon } from 'lucide-react';
import { TbSparkle } from 'react-icons/tb';
import { RiPencilAi2Line } from 'react-icons/ri';
import { PrimaryButton } from './PrimaryButton';
import { TextAction } from './TextAction';
import logoSrc from '../assets/Jouspace logo.png';
import {
  type AuthUser,
  signUp,
  signIn,
  requestVerificationCode,
  requestPasswordReset,
  signInWithOAuth,
} from '../lib/auth';

type View = 'welcome' | 'signin' | 'create' | 'forgot' | 'verify';

interface AuthScreenProps {
  /** Called with the authenticated user once sign-in / verification completes.
   *  Pass `null` to clear back to a local no-account session (e.g. sign-out). */
  onAuthed: (user: AuthUser | null) => void;
  /** Lets the user enter the app without a cloud account (local-first). */
  onContinueWithoutAccount: () => void;
}

/**
 * Revived auth entry point. Backend-free: every step is handled by the local
 * mock in `lib/localAuth.ts` so the transition can be tested in the running
 * app. When the real backend lands, only that module changes.
 */
export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthed, onContinueWithoutAccount }) => {
  const [view, setView] = useState<View>('welcome');
  const [pending, setPending] = useState<AuthUser | null>(null);
  const [pendingOrigin, setPendingOrigin] = useState<'create' | 'signin'>('create');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const resetForm = () => {
    setError(null);
    setName('');
    setEmail('');
    setPassword('');
    setResetSent(false);
  };

  const go = (next: View, _direction: 'fwd' | 'back' = 'fwd') => {
    setError(null);
    setView(next);
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await signUp(name, email, password);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Supabase confirms via email link. Route to the "check your email" view
      // (the link completes sign-in via onAuthStateChange → onAuthed).
      setSuccess(true);
      setPending(res.user);
      setPendingOrigin('create');
      setTimeout(() => {
        setSuccess(false);
        go('verify', 'fwd');
      }, 600);
    } catch {
      setError('Unable to create account. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await signIn(email, password);
      if (!res.ok) {
        // If the account exists but isn't confirmed yet, nudge to check email.
        if (/confirm|verify/i.test(res.error)) {
          setPending({ ...currentFallbackUser(), email });
          setPendingOrigin('signin');
          go('verify', 'fwd');
          return;
        }
        setError(res.error);
        return;
      }
      onAuthed(res.user);
    } catch {
      setError('Unable to sign in. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentFallbackUser = (): AuthUser => ({
    id: '',
    email,
    displayName: name || 'You',
    joinedDate: '',
    verified: false,
  });

  const handleResend = async () => {
    if (!pending) return;
    setLoading(true);
    setError(null);
    try {
      await requestVerificationCode(pending.email);
      setResetSent(true);
    } catch {
      setError('Unable to resend the link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google') => {
    setError(null);
    setLoading(true);
    try {
      const res = await signInWithOAuth(provider);
      if (!res.ok) {
        setError(res.error);
        // If a redirect was never initiated (e.g. provider not enabled in the
        // Supabase Dashboard, or the origin is not an approved redirect URL) we
        // must stop the spinner and tell the user instead of leaving it stuck.
        setLoading(false);
        return;
      }
      // On success the browser redirects to the provider; keep the spinner
      // running because navigation is imminent (clearing it here is harmless
      // since the page will unload).
    } catch {
      setError('Unable to start sign-in. Please try again.');
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await requestPasswordReset(email);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResetSent(true);
    } catch {
      setError('Unable to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex-1 flex flex-col min-h-0 bg-base overflow-hidden overscroll-contain">
      {/* Ambient depth orbs — two contained, low-opacity brand-purple hazes that
          give the auth canvas a sense of room (light theme only; hidden on dark).
          They drift slowly for a living, creative atmosphere. */}
      <div aria-hidden="true" className="auth-orb auth-orb--tr" />
      <div aria-hidden="true" className="auth-orb auth-orb--bl" />

      {/* Welcome watermark — a quiet, watermarked privacy promise pinned to the
          bottom of the screen (welcome only). */}
      {view === 'welcome' && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[5vh] z-10 flex justify-center px-6">
          <div className="flex items-center gap-1.5 text-[12px] text-muted opacity-50">
            <LockIcon className="h-3.5 w-3.5" />
            <span>Keep your thoughts private.</span>
          </div>
        </div>
      )}

      <div className={`relative z-10 flex flex-1 flex-col items-center ${view === 'welcome' ? 'justify-center px-6' : 'pt-20 pb-10 px-6'}`}>
        <div className="relative w-full max-w-[360px]">
          {/* Back affordance (forms only) — 48×48 touch target, top-left. */}
          {view !== 'welcome' && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                if (view === 'verify') {
                  // Back from verify returns to where we came from.
                  setPendingOrigin;
                  go(pending && pending.verified ? 'signin' : 'create', 'back');
                } else {
                  go('welcome', 'back');
                }
              }}
              className="absolute left-0 -top-14 flex h-12 w-12 items-center justify-center rounded-full text-secondary transition-colors hover:text-primary hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}

          {/* Brand lockup */}
          <div className="flex justify-center mb-10">
            <div className="relative grid place-items-center">
              {/* Outer ambient glow — wide, soft spread */}
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(108,77,202,0.22),rgba(108,77,202,0.08)_50%,transparent_72%)] blur-2xl"
              />
              {/* Mid-range glow ring */}
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(108,77,202,0.40),rgba(108,77,202,0.10)_60%,transparent_80%)] blur-xl"
              />
              {/* Inner tight glow — punchy core */}
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(108,77,202,0.60),rgba(108,77,202,0.15)_55%,transparent_75%)] blur-lg"
              />
              {/* Logo mark with layered purple glow depth */}
              <img
                src={logoSrc}
                alt=""
                className="relative h-20 w-20 rounded-full object-cover shadow-[0_0_32px_-2px_rgba(108,77,202,0.55),0_0_60px_-4px_rgba(108,77,202,0.3),inset_0_1px_2px_rgba(255,255,255,0.15)]"
              />
            </div>
          </div>

          <div key={view}>

          {view === 'welcome' && (
            <WelcomeView
              onGetStarted={() => { resetForm(); go('create'); }}
              onSignIn={() => { resetForm(); go('signin'); }}
              onContinueWithoutAccount={onContinueWithoutAccount}
            />
          )}

          {view === 'create' && (
            <FormShell
              eyebrow="Create your account"
              title="A quiet place to think"
              subtitle="Your journal stays on this device. Set up an account so your space is yours."
            >
              <LabeledField
                icon={<UserIcon className="w-5 h-5" />}
                type="text"
                label="Full Name"
                value={name}
                onChange={setName}
                autoComplete="name"
                hasError={!!error}
              />
              <LabeledField
                icon={<Mail className="w-5 h-5" />}
                type="email"
                label="Email"
                value={email}
                onChange={setEmail}
                autoComplete="email"
                hasError={!!error}
              />
              <LabeledPasswordField
                label="Password"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                hasError={!!error}
              />
              {error && <ErrorNote message={error} />}
              <PrimaryButton
                gradient={false}
                size="lg"
                className="mt-1 bg-accent! hover:bg-accentHover! active:bg-accentActive! shadow-[0_4px_14px_rgba(108,77,202,0.3)]! active:shadow-[0_2px_8px_rgba(108,77,202,0.45)]! active:scale-[0.98]! disabled:opacity-50! w-full tracking-[0.3px]"
                isLoading={loading}
                success={success}
                disabled={loading || !name.trim() || !email.trim() || !password}
                onClick={handleCreate}
              >
                Create account
              </PrimaryButton>
              <p className="mx-auto mt-3 max-w-[300px] text-center text-[13px] leading-[1.4] text-[#8E8E93]">
                <Shield className="mr-1.5 inline-block h-4 w-4 -translate-y-px text-accent" />
                Your journal lives on your device. No servers. No tracking. Just you and your thoughts.
              </p>
            </FormShell>
          )}

          {view === 'signin' && (
            <FormShell
              eyebrow="Welcome back"
              title="Sign in to Jouspace"
              subtitle="Pick up right where your journal left off."
            >
              <LabeledField
                icon={<Mail className="w-5 h-5" />}
                type="email"
                label="Email"
                value={email}
                onChange={setEmail}
                autoComplete="email"
                hasError={!!error}
              />
              <LabeledPasswordField
                label="Password"
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
                hasError={!!error}
              />
              {error && <ErrorNote message={error} />}
              <div className="flex justify-end -mt-2">
                <TextAction onClick={() => { resetForm(); go('forgot', 'fwd'); }} className="text-[14px] text-accent!">
                  Forgot password?
                </TextAction>
              </div>
              <PrimaryButton
                gradient={false}
                size="lg"
                className="bg-accent! hover:bg-accentHover! active:bg-accentActive! shadow-[0_4px_14px_rgba(108,77,202,0.3)]! active:shadow-[0_2px_8px_rgba(108,77,202,0.45)]! active:scale-[0.98]! disabled:opacity-50! w-full tracking-[0.3px]"
                isLoading={loading}
                disabled={loading || !email.trim() || !password}
                onClick={handleSignIn}
              >
                Sign in
              </PrimaryButton>

              <div className="flex items-center gap-3 py-1 text-[12.5px] text-muted">
                <span className="h-px flex-1 bg-borderSubtle" />
                or
                <span className="h-px flex-1 bg-borderSubtle" />
              </div>

              <PrimaryButton
                gradient={false}
                size="lg"
                className="gap-2.5 tracking-[0.3px] bg-surface! text-primary! border border-borderSubtle! hover:bg-baseTint! active:bg-elevated! shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]! hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)]! w-full"
                disabled={loading}
                onClick={() => handleOAuth('google')}
                icon={
                  <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                }
              >
                Continue with Google
              </PrimaryButton>
            </FormShell>
          )}

          {view === 'forgot' && (
            <FormShell
              eyebrow="Reset password"
              title="We'll send a reset link"
              subtitle="Enter the email tied to your account and we'll send instructions."
            >
              {resetSent ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <CheckCircle2 className="w-10 h-10 text-accent" />
                  <p className="text-[15px] text-secondary leading-relaxed">
                    If an account exists for <span className="font-medium text-primaryText">{email}</span>,
                    a reset link is on its way.
                  </p>
                </div>
              ) : (
                <>
                  <LabeledField
                    icon={<Mail className="w-5 h-5" />}
                    type="email"
                    label="Email"
                    value={email}
                    onChange={setEmail}
                    autoComplete="email"
                    hasError={!!error}
                  />
                  {error && <ErrorNote message={error} />}
                  <PrimaryButton
                    gradient={false}
                    size="lg"
                    className="bg-accent! hover:bg-accentHover! active:bg-accentActive! shadow-[0_4px_14px_rgba(108,77,202,0.3)]! active:shadow-[0_2px_8px_rgba(108,77,202,0.45)]! active:scale-[0.98]! disabled:opacity-50! w-full mt-2 tracking-[0.3px]"
                    isLoading={loading}
                    disabled={loading || !email.trim()}
                    onClick={handleReset}
                  >
                    Send reset link
                  </PrimaryButton>
                </>
              )}
            </FormShell>
          )}

          {view === 'verify' && pending && (
            <FormShell
              eyebrow="Check your email"
              title="One last step"
              subtitle={
                pendingOrigin === 'create'
                  ? `We sent a confirmation link to ${pending.email}. Open it to activate your account and continue.`
                  : `We sent a sign-in link to ${pending.email}. Open it to finish signing in.`
              }
            >
              <div className="flex flex-col items-center gap-4 py-2 text-center">
                <Mail className="h-10 w-10 text-accent" />
                <p className="text-[15px] text-secondary leading-relaxed">
                  Didn't get it? Check spam, or resend the link below. You can also close this and sign in
                  another way.
                </p>
              </div>
              {resetSent && (
                <p className="text-center text-[13px] text-accent">Link resent to {pending.email}.</p>
              )}
              <PrimaryButton
                gradient={false}
                size="lg"
                className="bg-accent! hover:bg-accentHover! active:bg-accentActive! shadow-[0_4px_14px_rgba(108,77,202,0.3)]! active:shadow-[0_2px_8px_rgba(108,77,202,0.45)]! active:scale-[0.98]! disabled:opacity-50! w-full mt-1 tracking-[0.3px]"
                isLoading={loading}
                disabled={loading}
                onClick={handleResend}
              >
                Resend link
              </PrimaryButton>
              <TextAction
                onClick={() => {
                  resetForm();
                  go('signin', 'back');
                }}
                className="text-[14px] text-accent! mx-auto"
              >
                Back to sign in
              </TextAction>
            </FormShell>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

/* ── Sub-views & primitives ─────────────────────────────────────────────── */

// Landing decorative flower removed per polish pass — the typography and CTA now breathe.

function WelcomeView({ onGetStarted, onSignIn, onContinueWithoutAccount }: { onGetStarted: () => void; onSignIn: () => void; onContinueWithoutAccount: () => void }) {
  return (
    <div className="text-center">
      <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-borderSubtle bg-surface/40 px-3 py-1.5 text-accent backdrop-blur-md">
        <TbSparkle className="h-4 w-4 -translate-y-px" aria-hidden="true" />
        <span className="text-[11px] font-semibold uppercase tracking-[1.2px]">Your private journal</span>
      </div>
      <h1 className="mx-auto mb-4 max-w-[340px] font-serif text-[32px] font-bold leading-[1.22] tracking-[-0.3px] text-primary">
        A calm space to write, reflect, and remember.
      </h1>
      <p className="mx-auto mb-10 max-w-[320px] text-[15px] font-normal leading-[1.6] text-secondary">
        Your thoughts deserve a space that remembers — not a server that stores.
      </p>

      <PrimaryButton
        gradient={false}
        size="lg"
        className="bg-accent! hover:bg-accentHover! active:bg-accentActive! shadow-[0_4px_14px_rgba(108,77,202,0.3)]! active:shadow-[0_2px_8px_rgba(108,77,202,0.45)]! active:scale-[0.98]! disabled:opacity-50! w-full tracking-[0.3px]"
        onClick={onGetStarted}
      >
        <span className="inline-flex items-center">
          Continue writing
          <span className="ml-2.5 inline-flex items-center -translate-y-px transition-transform duration-200 group-hover:scale-110">
            <RiPencilAi2Line className="h-[18px] w-[18px]" />
          </span>
        </span>
      </PrimaryButton>

      <div className="mt-7 flex items-center justify-center gap-0.5 text-[15px] font-medium text-secondary">
        <span>Already have an account?</span>
        <TextAction onClick={onSignIn} className="px-0 text-[15px] font-medium text-accent! link-underline-grow">
          Sign in
        </TextAction>
      </div>

      <button
        type="button"
        onClick={onContinueWithoutAccount}
        className="mt-4 w-full inline-flex items-center justify-center text-[14px] font-medium text-muted hover:text-secondary active:text-secondary transition-colors min-h-12"
      >
        Continue without an account
      </button>
    </div>
  );
}

function FormShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[1.2px] text-accent">{eyebrow}</div>
      <h1 className="mb-1.5 text-[26px] font-bold leading-[1.2] tracking-[-0.3px] text-primary">{title}</h1>
      <p className="mb-7 max-w-[320px] text-[15px] font-normal leading-normal text-secondary">{subtitle}</p>
      <div className="flex flex-col gap-5">{children}</div>
    </div>
  );
}

function LabeledField({
  icon,
  type,
  label,
  value,
  onChange,
  autoComplete,
  hasError = false,
}: {
  icon: React.ReactNode;
  type: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  hasError?: boolean;
}) {
  const inputId = useId();
  return (
    <div className={hasError ? 'animate-shake' : undefined}>
      <label htmlFor={inputId} className="mb-2 block text-[14px] font-medium text-primary">
        {label}
      </label>
      <div
        className={`relative flex h-14 items-center rounded-[14px] bg-surface border-[1.5px] px-4 transition-all duration-150 labeled-field ${hasError ? 'is-error' : ''}`}
      >
        <span className="mr-3 flex h-5 w-5 shrink-0 items-center justify-center text-muted">{icon}</span>
        <input
          id={inputId}
          type={type}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          placeholder={label}
          className="h-full w-full bg-transparent text-[16px] font-sans font-normal text-primary placeholder:text-[15px] placeholder:text-muted focus:outline-none"
        />
      </div>
    </div>
  );
}

function LabeledPasswordField({
  label,
  value,
  onChange,
  autoComplete,
  hasError = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  hasError?: boolean;
}) {
  const [show, setShow] = useState(false);
  const inputId = useId();
  return (
    <div className={hasError ? 'animate-shake' : undefined}>
      <label htmlFor={inputId} className="mb-2 block text-[14px] font-medium text-primary">
        {label}
      </label>
      <div
        className={`relative flex h-14 items-center rounded-[14px] bg-surface border-[1.5px] px-4 transition-all duration-150 labeled-field ${hasError ? 'is-error' : ''}`}
      >
        <span className="mr-3 flex h-5 w-5 shrink-0 items-center justify-center text-muted">
          <Lock className="h-5 w-5" />
        </span>
        <input
          id={inputId}
          type={show ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          placeholder={label}
          className="h-full w-full bg-transparent text-[16px] font-sans font-normal text-primary placeholder:text-[15px] placeholder:text-muted focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="ml-1 flex h-12 w-12 shrink-0 items-center justify-center text-muted transition-colors hover:text-accent active:text-accent focus:outline-none"
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p className="animate-slideDown text-[13px] leading-snug text-error">{message}</p>
  );
}
