import React from 'react';
import { Bell, BookOpen, RefreshCw } from 'lucide-react';
import { TbSparkle } from 'react-icons/tb';

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

const getIcon = (type: NotificationType) => {
  switch (type) {
    case 'memory':
      return <TbSparkle className="w-[18px] h-[18px] text-accent stroke-[1.8]" />;
    case 'reflection':
      return <RefreshCw className="w-[18px] h-[18px] text-accent stroke-[1.8]" />;
    case 'thread':
      return <BookOpen className="w-[18px] h-[18px] text-accent stroke-[1.8]" />;
    case 'reminder':
      return <Bell className="w-[18px] h-[18px] text-accent stroke-[1.8]" />;
  }
};

export const NotificationScreen: React.FC<NotificationScreenProps> = ({
  onBack,
  className = '',
}) => {
  return (
    <div className={`flex flex-col w-full pt-4 px-6 animate-fadeIn ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="w-[38px] h-[38px] rounded-full bg-surface border border-border flex items-center justify-center text-primaryText hover:bg-accentSoft transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4L6 9L11 14" />
          </svg>
        </button>
        <h1 className="font-serif font-medium text-[22px] text-primaryText tracking-tight">
          Notifications
        </h1>
      </div>

      {/* Notifications List */}
      {NOTIFICATIONS.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-14 h-14 rounded-full bg-accentSoft flex items-center justify-center mb-4">
            <Bell className="w-6 h-6 text-accent stroke-[1.6]" />
          </div>
          <p className="font-sans text-[14px] text-muted text-center">
            No notifications yet
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {NOTIFICATIONS.map((notification) => (
            <div
              key={notification.id}
              className={`w-full bg-surface border rounded-xl px-4 py-3.5 transition-colors ${
                notification.isRead
                  ? 'border-border'
                  : 'border-accent/20 bg-accentSoft/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-accentSoft flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <h4 className="font-sans text-[14px] font-medium text-primaryText truncate">
                      {notification.title}
                    </h4>
                    {!notification.isRead && (
                      <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                    )}
                  </div>
                  <p className="font-sans text-[13px] text-secondaryText leading-relaxed">
                    {notification.message}
                  </p>
                  <span className="font-sans text-[11px] text-muted mt-1.5 block">
                    {notification.time}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
