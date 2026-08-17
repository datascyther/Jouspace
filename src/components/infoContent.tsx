import { type ReactNode } from 'react';
import {
  Shield,
  LifeBuoy,
  MessageCircle,
  Mail,
  Pencil,
  BookOpen,
  Settings,
  User,
  Lock,
  Info as InfoIcon,
} from 'lucide-react';
import { TbSparkle } from 'react-icons/tb';
import { version as appVersion } from '../../package.json';

/** Support inbox — the only place feedback lands for now. */
const SUPPORT_EMAIL = 'contact.jouspace@proton.me';

/** A single tappable-style help topic row: icon chip + title + short body. */
function HelpRow({
  icon,
  title,
  desc,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-borderSubtle bg-surface px-4 py-2.5">
      <span className="w-8 h-8 shrink-0 rounded-full bg-accentSoft flex items-center justify-center text-accent">
        {icon}
      </span>
      <span className="flex flex-col gap-0.5 min-w-0">
        <span className="font-sans text-[13.5px] font-semibold text-primaryText">
          {title}
        </span>
        <span className="font-sans text-[12.5px] leading-[1.4] text-secondaryText">
          {desc}
        </span>
      </span>
    </div>
  );
}

export type InfoKind = 'privacy' | 'help' | 'feedback' | 'about';

export const infoContent: Record<
  InfoKind,
  { title: string; icon: ReactNode; body: ReactNode }
> = {
  privacy: {
    title: 'Privacy',
    icon: <Shield className="w-5 h-5 stroke-[1.8]" />,
    body: (
      <div className="flex flex-col gap-2">
        <p>
          Your journal starts on your device and works fully offline. If you use
          it without an account, everything stays in your browser's local
          storage — clearing site data or uninstalling removes it, and nothing
          is uploaded.
        </p>
        <p>
          If you sign in (Google or email), your entries are backed up and kept
          in sync across your devices through Firebase, stored under your
          account and readable only by you under the app's access rules. Your
          local copy remains on your device when you sign out.
        </p>
        <p>
          AI features run only when you enable them. When you configure an AI
          runtime URL, the entries you send are shared with that runtime to
          generate reflections; otherwise no AI provider sees your writing.
        </p>
      </div>
    ),
  },
  help: {
    title: 'Help Center',
    icon: <LifeBuoy className="w-5 h-5 stroke-[1.8]" />,
    body: (
      <div className="flex flex-col gap-3">
        <p>
          Quick help for getting the most out of Jouspace — everything lives on
          your device, so you're always in control.
        </p>

        <div className="flex flex-col gap-1.5">
          <h2 className="font-sans text-[11px] font-semibold uppercase tracking-wide text-muted">
            Getting started
          </h2>
          <HelpRow
            icon={<Pencil className="w-4 h-4 stroke-[1.8]" />}
            title="Write an entry"
            desc="Tap the write button or New Entry on Home — drafts autosave as you type."
          />
          <HelpRow
            icon={<BookOpen className="w-4 h-4 stroke-[1.8]" />}
            title="Explore Memory"
            desc="The Memory tab reveals the themes and patterns in your writing."
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <h2 className="font-sans text-[11px] font-semibold uppercase tracking-wide text-muted">
            AI features
          </h2>
          <HelpRow
            icon={<TbSparkle className="w-4 h-4 stroke-[1.8]" />}
            title="Reflect with AI"
            desc="Ask for a reflection in the AI tab, or on the Home insight card."
          />
          <HelpRow
            icon={<Settings className="w-4 h-4 stroke-[1.8]" />}
            title="Set your runtime"
            desc="Add a runtime URL in Profile — otherwise AI is gracefully skipped."
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <h2 className="font-sans text-[11px] font-semibold uppercase tracking-wide text-muted">
            Account &amp; data
          </h2>
          <HelpRow
            icon={<User className="w-4 h-4 stroke-[1.8]" />}
            title="Your profile"
            desc="Update your display name and preferences from the Profile screen."
          />
          <HelpRow
            icon={<Lock className="w-4 h-4 stroke-[1.8]" />}
            title="Privacy"
            desc="Keep your journal on-device, or sign in to back it up and sync across your devices."
          />
        </div>
      </div>
    ),
  },
  feedback: {
    title: 'Send Feedback',
    icon: <MessageCircle className="w-5 h-5 stroke-[1.8]" />,
    body: (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <p>
            We'd love to hear how Jouspace is working for you. Your thoughts help
            shape what comes next.
          </p>
          <p>
            Reach us directly below and we'll read every message.
          </p>
        </div>

        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="flex items-center justify-between gap-3 rounded-2xl border border-borderSubtle bg-surface px-5 py-4 transition-colors duration-150 hover:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <span className="flex flex-col gap-1">
            <span className="font-sans text-[12px] font-medium uppercase tracking-wide text-muted">
              Support email
            </span>
            <span className="font-sans text-[15px] font-medium text-accent">
              {SUPPORT_EMAIL}
            </span>
          </span>
          <Mail className="w-5 h-5 shrink-0 text-accent stroke-[1.8]" />
        </a>

        <p className="text-muted">
          Thanks for trying Jouspace.
        </p>
      </div>
    ),
  },
  about: {
    title: 'About Jouspace',
    icon: <InfoIcon className="w-5 h-5 stroke-[1.8]" />,
    body: (
      <div className="flex flex-col gap-2">
        <p>
          Jouspace is a quiet, local-first journal that gently builds context from
          your writing over time. Your entries live on your device, with optional
          account-backed sync and AI reflections when you enable them.
        </p>
        <p>Version {appVersion}.</p>
      </div>
    ),
  },
};
