export function createURL(path: string, options?: { scheme?: string; queryParams?: Record<string, string> }): string {
  if (typeof window === 'undefined') return path;
  const base = options?.scheme ? `${options.scheme}://` : window.location.origin;
  const url = new URL(path, base);
  if (options?.queryParams) {
    for (const [key, value] of Object.entries(options.queryParams)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export function parseURL(url: string): { path?: string; queryParams: Record<string, string> } {
  try {
    const parsed = new URL(url);
    const queryParams: Record<string, string> = {};
    parsed.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    return { path: parsed.pathname, queryParams };
  } catch {
    return { queryParams: {} };
  }
}

export function addEventListener(): { remove(): void } {
  return { remove() {} };
}

export function removeEventListener(): void {}

export function getInitialURL(): Promise<string | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  return Promise.resolve(window.location.href);
}

export default {
  createURL,
  parseURL,
  addEventListener,
  removeEventListener,
  getInitialURL,
};
