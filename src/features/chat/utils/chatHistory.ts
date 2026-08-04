import type { ChatMessage } from '@/shared/types';

export interface ChatSession {
  id: string;
  title: string;
  preview: string;
  startedAt: Date;
  lastAt: Date;
  messageCount: number;
  messages: ChatMessage[];
}

export function formatSessionTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    const hours = date.getHours();
    const mins = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    return `${h}:${mins.toString().padStart(2, '0')} ${ampm}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return 'Yesterday';
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

export function groupSessionsByDateLabel(label: string, sessions: ChatSession[]): { label: string; sessions: ChatSession[] } {
  return { label, sessions };
}

export function getDateLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86400000);

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return 'This Week';
  if (diffDays < 30) return 'This Month';
  return 'Older';
}

export function groupIntoSessions(messages: ChatMessage[]): ChatSession[] {
  const groups = new Map<string, ChatMessage[]>();

  for (const msg of messages) {
    const key = msg.conversationId ?? '__orphaned__';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(msg);
  }

  const sessions: ChatSession[] = [];

  for (const [id, msgs] of groups) {
    msgs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const userMsgs = msgs.filter(m => m.isUser);
    const title = userMsgs.length > 0
      ? userMsgs[0].content.slice(0, 42) + (userMsgs[0].content.length > 42 ? '…' : '')
      : '(no messages)';

    const last = msgs[msgs.length - 1];
    const preview = last.content.slice(0, 60) + (last.content.length > 60 ? '…' : '');

    sessions.push({
      id,
      title,
      preview,
      startedAt: msgs[0].timestamp,
      lastAt: msgs[msgs.length - 1].timestamp,
      messageCount: msgs.length,
      messages: msgs,
    });
  }

  sessions.sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
  return sessions.filter(s => s.id !== '__orphaned__');
}

export function groupSessionsByDate(sessions: ChatSession[]): { label: string; sessions: ChatSession[] }[] {
  const sections = new Map<string, ChatSession[]>();

  for (const session of sessions) {
    const label = getDateLabel(session.lastAt);
    if (!sections.has(label)) sections.set(label, []);
    sections.get(label)!.push(session);
  }

  const order = ['Today', 'Yesterday', 'This Week', 'This Month', 'Older'];
  return order
    .filter(label => sections.has(label))
    .map(label => ({ label, sessions: sections.get(label)! }));
}
