import React from 'react';
import { ArrowLeft, Bell, BookOpen } from 'lucide-react';
import { TbSparkle } from 'react-icons/tb';
import { VscCommentDiscussionSparkle } from 'react-icons/vsc';

interface NotificationScreenProps {
  onBack?: () => void;
  className?: string;
}

type NotificationType = 'memory' | 'reflection' | 'reminder' | 'thread';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

const NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'memory',
    title: 'New memory generated',
    message: 'A new memory was created from your recent entries about creativity.',
    time: '2 hours ago',
    isRead: false,
  },
  {
    id: '2',
    type: 'reflection',
    title: 'Reflection available',
    message: 'Jouspace noticed a pattern in your writing. Tap to explore.',
    time: '5 hours ago',
    isRead: false,
  },
  {
    id: '3',
    type: 'thread',
    title: 'Memory thread updated',
    message: 'Your "Morning Reflections" thread has a new connected entry.',
    time: 'Yesterday',
    isRead: true,
  },
  {
    id: '4',
    type: 'reminder',
    title: 'Journal reminder',
    message: 'You haven\'t written today. Take a moment to reflect.',
    time: 'Yesterday',
    isRead: true,
  },
];

const ICON_MAP: Record<NotificationType, React.ReactNode> = {
  memory: <VscCommentDiscussionSparkle className="w-[18px] h-[18px]" />,
  reflection: <TbSparkle className="w-[18px] h-[18px]" />,
  thread: <BookOpen className="w-[18px] h-[18px] stroke-[1.8]" />,
  reminder: <Bell className="w-[18px] h-[18px] stroke-[1.8]" />,
};

export const NotificationScreen: React.FC<NotificationScreenProps> = ({
  onBack,
  className = '',
}) => {
  const unreadCount = NOTIFICATIONS.filter((n) => !n.isRead).length;

  return (
    <div className={`flex flex-col w-full flex-1 min-h-0 ${className}`}>
      {/* ── Header ── */}
      <div className="shrink-0 px-5 pt-3 pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="w-9 h-9 rounded-full bg-surface border border-borderSubtle flex items-center justify-center text-secondaryText hover:bg-borderSubtle hover:text-primaryText transition-all duration-150 active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-[18px] h-[18px] stroke-[1.8]" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="font-serif font-medium text-[20px] text-primaryText tracking-tight">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent font-sans text-[11px] font-medium">
                {unreadCount} new
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      {NOTIFICATIONS.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-accentSoft/50 flex items-center justify-center mb-4">
            <Bell className="w-7 h-7 text-accent/60 stroke-[1.5]" />
          </div>
          <p className="font-sans text-[15px] font-medium text-primaryText mb-1">
            All caught up
          </p>
          <p className="font-sans text-[13px] text-muted text-center leading-relaxed">
            No notifications yet. They'll appear here as Jouspace learns from your writing.
          </p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-5 pb-6">
          {/* ── Earlier today ── */}
          <SectionLabel>Earlier today</SectionLabel>
          <div className="flex flex-col gap-2.5">
            {NOTIFICATIONS.slice(0, 2).map((notification) => (
              <NotificationCard key={notification.id} notification={notification} />
            ))}
          </div>

          {/* ── Yesterday ── */}
          <SectionLabel className="mt-6">Yesterday</SectionLabel>
          <div className="flex flex-col gap-2.5">
            {NOTIFICATIONS.slice(2).map((notification) => (
              <NotificationCard key={notification.id} notification={notification} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Sub-components ── */

function SectionLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`block font-sans text-[11px] font-semibold text-muted uppercase tracking-wider mb-2 select-none ${className}`}>
      {children}
    </span>
  );
}

function NotificationCard({ notification }: { notification: Notification }) {
  const { type, title, message, time, isRead } = notification;

  return (
    <div
      className={`group relative w-full rounded-2xl border px-4 py-3.5 transition-all duration-200 cursor-pointer ${
        isRead
          ? 'bg-surface border-borderSubtle hover:border-border hover:shadow-sm'
          : 'bg-elevated border-accent/15 shadow-[0_1px_3px_rgba(108,77,202,0.06)] hover:border-accent/25 hover:shadow-[0_2px_8px_rgba(108,77,202,0.1)]'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-9 h-9 rounded-xl bg-accentSoft flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
          <span className="text-accent">{ICON_MAP[type]}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="font-sans text-[13.5px] font-semibold text-primaryText truncate leading-tight">
              {title}
            </h4>
            {!isRead && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 ring-2 ring-accent/20" />
            )}
          </div>
          <p className="font-sans text-[12.5px] text-secondaryText leading-[1.55] line-clamp-2">
            {message}
          </p>
          <span className="font-sans text-[11px] text-muted mt-1.5 block tracking-wide">
            {time}
          </span>
        </div>
      </div>
    </div>
  );
}
