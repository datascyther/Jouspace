export async function openAuthSessionAsync(
  url: string,
  _redirectUrl?: string,
): Promise<{ type: string; url: string }> {
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
  return { type: 'dismiss', url: '' };
}

export async function openBrowserAsync(url: string): Promise<'opened' | 'cancelled'> {
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
  return 'opened';
}

export function dismissBrowser(): void {}

export function maybeCompleteAuthSession(): void {}

export default {
  openAuthSessionAsync,
  openBrowserAsync,
  dismissBrowser,
  maybeCompleteAuthSession,
};
