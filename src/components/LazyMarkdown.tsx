import { lazy, Suspense } from 'react';
import type { MarkdownProps } from './Markdown';

const Markdown = lazy(() =>
  import('./Markdown').then((m) => ({ default: m.Markdown }))
);

// Lightweight placeholder while the markdown chunk loads (avoids layout jump).
function MarkdownFallback() {
  return <div className="min-h-[1.2em] w-full skeleton-shimmer rounded" />;
}

export function LazyMarkdown(props: MarkdownProps) {
  return (
    <Suspense fallback={<MarkdownFallback />}>
      <Markdown {...props} />
    </Suspense>
  );
}
