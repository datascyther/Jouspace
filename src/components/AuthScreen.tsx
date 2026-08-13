import React, { useState, useId } from 'react';
import { Mail, Lock, User as UserIcon, ArrowLeft, Eye, EyeOff, CheckCircle2, Shield, Lock as LockIcon, Globe, Apple } from 'lucide-react';
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
  signInWithMagicLink,
  signInWithOAuth,
} from '../lib/auth';

type View = 'welcome' | 'signin' | 'create' | 'forgot' | 'verify';

interface AuthScreenProps {
  /** Called with the authenticated user once sign-in / verification completes. */
  onAuthed: (user: AuthUser) => void;
}

/**
 * Revived auth entry point. Backend-free: every step is handled by the local
 * mock in `lib/localAuth.ts` so the transition can be tested in the running
 * app. When the real backend lands, only that module changes.
 */
export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthed }) => {
  const [view, setView] = useState<View>('welcome');
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd');
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

  const go = (next: View, direction: 'fwd' | 'back' = 'fwd') => {
    setError(null);
    setDir(direction);
    setView(next);
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    const res = await signUp(name, email, password);
    setLoading(false);
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
  };

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    const res = await signIn(email, password);
    setLoading(false);
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
    await requestVerificationCode(pending.email);
    setLoading(false);
    setResetSent(true);
  };

  const handleMagicLink = async () => {
    if (!email.trim()) {
      setError('Enter your email to receive a magic link.');
      return;
    }
    setLoading(true);
    setError(null);
    const res = await signInWithMagicLink(email);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setPending({ ...currentFallbackUser(), email });
    setPendingOrigin('signin');
    go('verify', 'fwd');
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setError(null);
    const res = await signInWithOAuth(provider);
    if (!res.ok) setError(res.error);
    // On success the browser redirects to the provider.
  };

  const handleReset = async () => {
    setLoading(true);
    setError(null);
    const res = await requestPasswordReset(email);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setResetSent(true);
  };

  return (
    <div className="relative flex-1 flex flex-col min-h-0 bg-base overflow-y-auto">
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
              {/* Layered brand glow — translucent, blends into the background,
                  matches the flower mark's accent purple. */}
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(108,77,202,0.55),rgba(108,77,202,0.12)_55%,transparent_75%)] blur-md"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(108,77,202,0.30),transparent_70%)] blur-xl"
              />
              {/* Logo mark floating in the glow — no hard border, just a faint
                  translucent rim and a soft accent halo. */}
              <img
                src={logoSrc}
                alt=""
                className="relative h-20 w-20 rounded-full object-cover shadow-[0_0_28px_-2px_rgba(108,77,202,0.6)] ring-1 ring-white/30"
              />
            </div>
          </div>

          <div key={view} className={dir === 'fwd' ? 'animate-slideInRight' : 'animate-slideInLeft'}>

          {view === 'welcome' && (
            <WelcomeView onGetStarted={() => { resetForm(); go('create'); }} onSignIn={() => { resetForm(); go('signin'); }} />
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
                <span className="h-px flex-1 bg-[#E0DDD6]" />
                or
                <span className="h-px flex-1 bg-[#E0DDD6]" />
              </div>

              <PrimaryButton
                gradient={false}
                size="lg"
                className="w-full tracking-[0.3px] !bg-white !text-primary border !border-[#D9D6CF] hover:!bg-[#F4F2EE] active:!bg-[#ECEAE4]"
                disabled={loading || !email.trim()}
                onClick={handleMagicLink}
                icon={<Mail className="h-[18px] w-[18px]" />}
              >
                Email me a magic link
              </PrimaryButton>

              <div className="flex gap-3">
                <PrimaryButton
                  gradient={false}
                  size="lg"
                  className="flex-1 tracking-[0.3px] !bg-white !text-primary border !border-[#D9D6CF] hover:!bg-[#F4F2EE] active:!bg-[#ECEAE4]"
                  disabled={loading}
                  onClick={() => handleOAuth('google')}
                  icon={<Globe className="h-[18px] w-[18px]" />}
                >
                  Google
                </PrimaryButton>
                <PrimaryButton
                  gradient={false}
                  size="lg"
                  className="flex-1 tracking-[0.3px] !bg-white !text-primary border !border-[#D9D6CF] hover:!bg-[#F4F2EE] active:!bg-[#ECEAE4]"
                  disabled={loading}
                  onClick={() => handleOAuth('apple')}
                  icon={<Apple className="h-[18px] w-[18px]" />}
                >
                  Apple
                </PrimaryButton>
              </div>
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

function WelcomeView({ onGetStarted, onSignIn }: { onGetStarted: () => void; onSignIn: () => void }) {
  return (
    <div className="text-center">
      <div className="rise-in rise-1 mb-5 inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/40 px-3 py-1.5 text-accent backdrop-blur-md">
        <TbSparkle className="h-4 w-4 -translate-y-px" aria-hidden="true" />
        <span className="text-[11px] font-semibold uppercase tracking-[1.2px]">Your private journal</span>
      </div>
      <h1 className="rise-in rise-2 mx-auto mb-4 max-w-[340px] font-serif text-[32px] font-bold leading-[1.22] tracking-[-0.3px] text-primary">
        A calm space to write, reflect, and remember.
      </h1>
      <p className="rise-in rise-3 mx-auto mb-10 max-w-[320px] text-[15px] font-normal leading-[1.6] text-secondary">
        Your thoughts deserve a space that remembers — not a server that stores.
      </p>

      <PrimaryButton
        gradient={false}
        size="lg"
        className="rise-in rise-4 bg-accent! hover:bg-accentHover! active:bg-accentActive! shadow-[0_4px_14px_rgba(108,77,202,0.3)]! active:shadow-[0_2px_8px_rgba(108,77,202,0.45)]! active:scale-[0.98]! disabled:opacity-50! w-full tracking-[0.3px]"
        onClick={onGetStarted}
      >
        <span className="inline-flex items-center">
          Continue writing
          <span className="ml-2.5 inline-flex items-center -translate-y-px transition-transform duration-200 group-hover:scale-110">
            <RiPencilAi2Line className="h-[18px] w-[18px]" />
          </span>
        </span>
      </PrimaryButton>

      <div className="rise-in rise-5 mt-7 flex items-center justify-center gap-0.5 text-[15px] font-medium text-secondary">
        <span>Already have an account?</span>
        <TextAction onClick={onSignIn} className="px-0 text-[15px] font-medium text-accent! link-underline-grow">
          Sign in
        </TextAction>
      </div>
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
      <p className="mb-7 max-w-[320px] text-[15px] font-normal leading-normal text-[#6b6b7b]">{subtitle}</p>
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
      <label htmlFor={inputId} className="mb-2 block text-[14px] font-medium text-[#1a1a2e]">
        {label}
      </label>
      <div
        className={`relative flex h-14 items-center rounded-[14px] bg-white border-[1.5px] px-4 transition-all duration-150 labeled-field ${hasError ? 'is-error' : ''}`}
      >
        <span className="mr-3 flex h-5 w-5 shrink-0 items-center justify-center text-[#9E9E9E]">{icon}</span>
        <input
          id={inputId}
          type={type}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          placeholder={label}
          className="h-full w-full bg-transparent text-[16px] font-sans font-normal text-[#1a1a2e] placeholder:text-[15px] placeholder:text-[#B0B0B0] focus:outline-none"
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
      <label htmlFor={inputId} className="mb-2 block text-[14px] font-medium text-[#1a1a2e]">
        {label}
      </label>
      <div
        className={`relative flex h-14 items-center rounded-[14px] bg-white border-[1.5px] px-4 transition-all duration-150 labeled-field ${hasError ? 'is-error' : ''}`}
      >
        <span className="mr-3 flex h-5 w-5 shrink-0 items-center justify-center text-[#9E9E9E]">
          <Lock className="h-5 w-5" />
        </span>
        <input
          id={inputId}
          type={show ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          placeholder={label}
          className="h-full w-full bg-transparent text-[16px] font-sans font-normal text-[#1a1a2e] placeholder:text-[15px] placeholder:text-[#B0B0B0] focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="ml-1 flex h-12 w-12 shrink-0 items-center justify-center text-[#9E9E9E] transition-colors hover:text-accent active:text-accent focus:outline-none"
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
