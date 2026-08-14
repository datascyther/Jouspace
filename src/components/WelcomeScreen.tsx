import React from 'react';
import { TbSparkle } from 'react-icons/tb';
import { Mic, ShieldCheck, Lock, Leaf } from 'lucide-react';
import { PrimaryButton } from './PrimaryButton';
import logoSrc from '../assets/Jouspace logo.png';

interface WelcomeScreenProps {
  /** Called when the user taps "Get started" to leave the welcome screen. */
  onContinue: () => void;
}

/**
 * First-run welcome screen — the app's opening impression, shown once after the
 * splash and before account creation. Kept calm and brand-consistent with the
 * auth screen (depth orbs + logo lockup) so the hand-off into AuthScreen feels
 * like the same journey rather than a context switch. Device permissions are NOT
 * asked here — that happens later in the permission primer, after sign-in.
 */
export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onContinue }) => {
  return (
    <div className="relative flex-1 flex flex-col min-h-0 bg-base overflow-hidden overscroll-contain">
      {/* Ambient depth orbs — two contained, low-opacity brand-purple hazes that
          give the canvas a sense of room (light theme only; hidden on dark).
          Mirrors the auth screen's atmosphere. */}
      <div aria-hidden="true" className="auth-orb auth-orb--tr" />
      <div aria-hidden="true" className="auth-orb auth-orb--bl" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
        <div className="relative w-full max-w-[360px]">
          {/* Brand lockup — logo mark with layered purple glow depth. */}
          <div className="flex justify-center mb-10">
            <div className="relative grid place-items-center">
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(108,77,202,0.22),rgba(108,77,202,0.08)_50%,transparent_72%)] blur-2xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(108,77,202,0.40),rgba(108,77,202,0.10)_60%,transparent_80%)] blur-xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(108,77,202,0.60),rgba(108,77,202,0.15)_55%,transparent_75%)] blur-lg"
              />
              <img
                src={logoSrc}
                alt=""
                className="relative h-20 w-20 rounded-full object-cover shadow-[0_0_32px_-2px_rgba(108,77,202,0.55),0_0_60px_-4px_rgba(108,77,202,0.3),inset_0_1px_2px_rgba(255,255,255,0.15)]"
              />
            </div>
          </div>

          {/* Eyebrow */}
          <div className="mb-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-[1.2px] text-accent">
            <TbSparkle className="h-4 w-4 -translate-y-px" aria-hidden="true" />
            <span>Your private journal</span>
          </div>

          {/* Heading + subtitle */}
          <h1 className="mx-auto mb-4 max-w-[340px] text-center font-serif text-[32px] font-bold leading-[1.22] tracking-[-0.3px] text-primary">
            A calm space to write, reflect, and remember.
          </h1>
          <p className="mx-auto mb-8 max-w-[320px] text-center text-[15px] font-normal leading-[1.6] text-secondary">
            Your thoughts deserve a space that remembers — not a server that stores.
          </p>

          {/* Value points — quiet, scannable reassurance. */}
          <ul className="mx-auto mb-10 max-w-[320px] flex flex-col gap-3">
            {[
              { icon: <Lock className="h-5 w-5" />, label: 'Stays on your device. No account required to start.' },
              { icon: <Mic className="h-5 w-5" />, label: 'Voice or type — whichever helps you think.' },
              { icon: <Leaf className="h-5 w-5" />, label: 'Gently builds context from your writing over time.' },
            ].map((item) => (
              <li key={item.label} className="flex items-center gap-3 text-[14px] text-secondary">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-baseTint text-accent">
                  {item.icon}
                </span>
                <span className="leading-snug">{item.label}</span>
              </li>
            ))}
          </ul>

          {/* Primary CTA */}
          <PrimaryButton
            gradient
            size="lg"
            className="w-full tracking-[0.3px]"
            onClick={onContinue}
          >
            Get started
          </PrimaryButton>

          {/* Privacy watermark */}
          <div className="pointer-events-none mt-[5vh] flex items-center justify-center gap-1.5 text-[12px] text-muted opacity-50">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Keep your thoughts private.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
