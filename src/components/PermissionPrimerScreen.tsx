import React, { useState } from 'react';
import { Mic, Bell, ShieldCheck, ArrowRight } from 'lucide-react';
import { TbSparkle } from 'react-icons/tb';
import { PrimaryButton } from './PrimaryButton';
import { usePermissions } from '../permissions/usePermissions';
import { ReminderService } from '../notifications';
import { PERMISSIONS, PERMISSION_ORDER } from '../permissions/registry';
import type { PermissionKey, PermissionResult } from '../permissions/types';

const ICONS: Record<PermissionKey, React.ReactNode> = {
  microphone: <Mic className="w-6 h-6" />,
  notifications: <Bell className="w-6 h-6" />,
};

// Concise purpose phrases for accessible switch labels, e.g.
// "Enable Microphone for voice journaling".
const PURPOSE: Record<PermissionKey, string> = {
  microphone: 'voice journaling',
  notifications: 'reflection reminders',
};

/**
 * iOS-style switch that replaces the old "Enable" text link. The toggle IS the
 * action: flipping it on requests the permission, flipping it off opts out.
 * Spring physics via an overshoot cubic-bezier; transform + opacity only so it
 * stays on the compositor. Overshoot is intentional (the design system's
 * "panels/sheets" 300ms timing) and is neutralised under reduced-motion.
 */
function Toggle({
  checked,
  onChange,
  disabled,
  ariaLabel,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onChange}
      className="relative inline-flex shrink-0 items-center justify-center rounded-pill min-w-[52px] h-8 min-h-11
                 transition-colors duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2
                 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <span
        className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-8 rounded-pill transition-colors duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                    ${checked ? 'bg-accent' : 'bg-baseTint'}`}
      />
      <span
        className={`absolute top-1/2 left-1 -translate-y-1/2 w-7 h-7 rounded-full bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.2)]
                    transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                    ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
      </button>
  );
}

/**
 * Post-auth permission primer. Shown after successful email/Google
 * authentication; required step (each permission individually optional via its
 * toggle). The "Continue" button enters the app; there is no "Skip for now".
 */
export const PermissionPrimerScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { states, ensure, openSettings, refresh } = usePermissions();
  const [busy, setBusy] = useState<PermissionKey | null>(null);
  // Local opt-out so a granted permission can be switched back off without
  // revoking it at the OS level (the app just stops using it).
  const [optedOut, setOptedOut] = useState<Record<PermissionKey, boolean>>({
    microphone: false,
    notifications: false,
  });

  const isOn = (key: PermissionKey) => states[key] === 'granted' && !optedOut[key];
  const isBlocked = (key: PermissionKey) =>
    states[key] === 'deniedPermanently' || states[key] === 'restricted';

  const handleToggle = async (key: PermissionKey) => {
    if (busy) return;

    // Track the intended on/off so we can sync the reminder feature for
    // notifications (null = no change, e.g. blocked → Settings).
    let nextOn: boolean | null = null;

    // On → opt out (soft). No OS revoke; we simply stop using the feature.
    if (isOn(key)) {
      setOptedOut((m) => ({ ...m, [key]: true }));
      nextOn = false;
    }
    // Already granted but previously opted out → just opt back in.
    else if (states[key] === 'granted') {
      setOptedOut((m) => ({ ...m, [key]: false }));
      nextOn = true;
    }
    // Blocked at the OS level → the only path forward is Settings.
    else if (isBlocked(key)) {
      await openSettings(key);
    }
    // Off → request it. A hard timeout guarantees the toggle can never get
    // stuck on a slow/unresolved native permission promise, and we always
    // reconcile with the live OS status so a granted permission (even one the
    // native call didn't report back) is reflected on the toggle.
    else {
      setBusy(key);
      try {
        const result = await Promise.race<PermissionResult | null>([
          ensure(key),
          new Promise<PermissionResult | null>((resolve) =>
            setTimeout(() => resolve(null), 5000),
          ),
        ]);
        if (result) {
          // Definitive answer — `ensure` already updated `states`, so trust it.
          if (result.ok) nextOn = true;
          else if (
            result.state === 'deniedPermanently' ||
            result.state === 'restricted'
          ) {
            await openSettings(key);
          }
        } else {
          // Timed out — reconcile with the live OS status (a grant may have
          // landed after the native promise went quiet).
          const freshState = await refresh(key);
          nextOn = freshState === 'granted' ? true : null;
        }
      } finally {
        setBusy(null);
      }
    }

    // Notifications drive the journal-reminder feature: enabling arms the gentle
    // evening reminder (+ draft nudge), opting out stops them entirely.
    if (key === 'notifications' && nextOn !== null) {
      ReminderService.setRemindersEnabled(nextOn);
    }
  };

  return (
      <div className="relative flex-1 flex flex-col min-h-0 w-full bg-base overflow-y-auto overflow-x-hidden overscroll-contain">
      {/* Localised depth orb — light theme only, hidden on dark (see index.css). */}
      <div aria-hidden="true" className="onboarding-orb" />

      {/* Content biased slightly above centre (~45% from top, golden-ratio feel). */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-[4vh] pb-[8vh]">
        <div className="w-full max-w-md">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 text-accent mb-2">
            <TbSparkle className="w-5 h-5 animate-sparkleIn gpu-layer" />
            <span className="text-xs font-semibold uppercase tracking-[0.5px]">
              Welcome to Jouspace
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-[28px] font-bold text-primary tracking-[-0.3px] leading-[1.2] mb-4">
            A few taps to make it yours
          </h1>

          {/* Subtitle */}
          <p className="text-[16px] font-normal text-secondary leading-normal">
            Jouspace works fully by typing — but enabling these makes it feel
            personal. You can change any of them later in Settings.
          </p>

          {/* Permission cards */}
          <div className="mt-8 space-y-4">
            {PERMISSION_ORDER.map((key, i) => {
              const meta = PERMISSIONS[key];
              const on = isOn(key);
              return (
                <div
                  key={key}
                  style={{ animationDelay: `${i * 100}ms` }}
                  className="bg-surface rounded-card border border-borderSubtle shadow-[0_2px_8px_rgba(0,0,0,0.04)]
                             active:shadow-[0_4px_16px_rgba(0,0,0,0.08)] p-4 flex items-start gap-3
                             animate-cardIn gpu-layer"
                >
                  <div
                    className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-300 ${
                      on ? 'bg-accentSoft text-accent' : 'bg-baseTint text-secondary'
                    }`}
                  >
                    {ICONS[key]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-[17px] font-semibold text-primary tracking-[-0.2px] leading-tight">
                        {meta.title}
                      </h3>
                      <Toggle
                        checked={on}
                        onChange={() => void handleToggle(key)}
                        disabled={busy !== null}
                        ariaLabel={`Enable ${meta.title} for ${PURPOSE[key]}`}
                      />
                    </div>
                    <p className="text-sm font-normal text-secondary mt-0.5 leading-snug">
                      {meta.benefit}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer zone: privacy reassurance + CTAs (48px below the last card). */}
          <div className="mt-12">
            <div className="flex items-start gap-2 text-[13px] text-muted leading-snug">
              <ShieldCheck className="w-4 h-4 text-muted shrink-0 mt-0.5" />
              <span>
                Your data stays private. We only ask for what personalizes your journal.
              </span>
            </div>

            <div className="mt-6">
              <PrimaryButton
                onClick={onComplete}
                gradient
                size="lg"
                disabled={busy !== null}
                icon={<ArrowRight className="w-[18px] h-[18px] mr-2.5 stroke-[1.8]" />}
                className="w-full"
              >
                Continue
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
