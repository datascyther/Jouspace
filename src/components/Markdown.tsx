import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

/**
 * Markdown — shared renderer for assistant AI responses (chat + reflect).
 *
 * Renders model output as styled Markdown using Tailwind tokens (no
 * @tailwindcss/typography plugin). Raw HTML is never rendered — react-markdown
 * ignores it by default, and we do not add rehype-raw, so model output is
 * XSS-safe.
 *
 * Link safety: `urlTransform` only allows http/https/mailto, stripping
 * javascript:/data:/etc.
 */

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:'];

function urlTransform(url: string): string {
  try {
    const parsed = new URL(url, 'https://placeholder.invalid');
    if (ALLOWED_PROTOCOLS.includes(parsed.protocol)) return url;
  } catch {
    /* fall through */
  }
  return '';
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="font-serif text-primaryText font-medium text-xl leading-tight mt-3 mb-2 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-serif text-primaryText font-medium text-lg leading-tight mt-3 mb-2 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-serif text-primaryText font-medium text-[15.5px] leading-snug mt-2.5 mb-1.5 first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="font-sans text-[14.5px] leading-[1.65] text-primaryText my-1.5 first:mt-0 last:mb-0">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="font-sans text-primaryText list-disc pl-5 my-1.5 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="font-sans text-primaryText list-decimal pl-5 my-1.5 space-y-1">{children}</ol>
  ),
  li: ({ children }) => <li className="font-sans text-[14.5px] leading-[1.6]">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-primaryText">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-secondaryText">{children}</em>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-accent pl-3 italic text-secondaryText my-2">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="font-mono text-[13px] bg-base px-1 rounded text-primaryText">
      {children}
    </code>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent underline underline-offset-2 hover:opacity-80"
    >
      {children}
    </a>
  ),
};

/**
 * Unwrap whole-response emphasis framing before markdown parsing.
 *
 * The model occasionally frames an ENTIRE reply in a single asterisk pair
 * (`*…*` or `_…_`) as a stylistic "gentle voice" choice. react-markdown
 * renders that as one big `<em>`, italicizing the whole answer. Inline
 * emphasis (`*word*` in the middle of a sentence) and `**bold**` are left
 * alone — only a pair that opens at the very first character and closes at
 * the very last character of the response is stripped. A dangling opening
 * asterisk mid-stream is also dropped so streaming never flashes a literal
 * `*` (list items `* ` and bold `**` are untouched).
 */
function unwrapWholeEmphasis(text: string): string {
  let t = text.trim();

  const wholePair = (ch: string): boolean =>
    t.startsWith(ch) &&
    !t.startsWith(ch + ch) &&
    t.endsWith(ch) &&
    !t.endsWith(ch + ch) &&
    !t.slice(1, -1).includes(ch);

  if (wholePair('*') || wholePair('_')) return t.slice(1, -1);

  // Streaming partial: opening `*` with no close yet (not a list item, not bold).
  if (t.startsWith('*') && !t.startsWith('* ') && !t.startsWith('**') && !t.includes('*', 1)) {
    return t.slice(1);
  }

  return t;
}

export interface MarkdownProps {
  text: string;
}

export const Markdown: React.FC<MarkdownProps> = ({ text }) => {
  return (
    <div className="font-sans">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components} urlTransform={urlTransform}>
        {unwrapWholeEmphasis(text)}
      </ReactMarkdown>
    </div>
  );
};
