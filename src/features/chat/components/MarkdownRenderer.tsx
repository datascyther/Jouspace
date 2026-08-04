/**
 * MarkdownRenderer
 *
 * Renders a subset of Markdown as native React Native elements.
 *
 * Supported syntax:
 *   # Heading 1
 *   ## Heading 2
 *   ### Heading 3
 *   **bold**, *italic*, `inline code`
 *   [link text](url)
 *   - / * unordered lists
 *   1. ordered lists
 *   > blockquotes
 *   ```fenced code blocks```
 *
 * Typography uses chat.typography tokens from the design system.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Linking } from 'react-native';
import { typography, chat, chatTypography } from '@/core/theme/tokens';

interface MarkdownRendererProps {
  text: string;
  baseStyle: {
    fontSize: number;
    lineHeight: number;
    color: string;
  };
  codeBackground: string;
  linkColor: string;
  blockquoteBackground: string;
  blockquoteBorder: string;
}

// ─── Emoji Utilities ─────────────────────────────────────────────────────────

/**
 * Detects if a line contains only emoji characters (and optional whitespace).
 * When true, the line is rendered at a larger font size for visual emphasis.
 */
const EMOJI_ONLY_REGEX = /^[\s\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FEFF}\u{1FA00}-\u{1FA9F}]+$/u;

function isEmojiOnly(line: string): boolean {
  return EMOJI_ONLY_REGEX.test(line.trim()) && line.trim().length > 0;
}

// ─── Inline Parser ────────────────────────────────────────────────────────────

function parseInlineLine(
  line: string,
  baseStyle: { fontSize: number; lineHeight: number; color: string },
  codeBackground: string,
  linkColor: string,
): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  let remaining = line;
  let key = 0;

  while (remaining) {
    // Inline code: `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      elements.push(
        <Text
          key={key++}
          style={[
            styles.inlineCode,
            {
              backgroundColor: codeBackground,
              fontSize: chatTypography.code.fontSize,
              lineHeight: chatTypography.code.lineHeight,
              color: baseStyle.color,
            },
          ]}
        >
          {codeMatch[1]}
        </Text>,
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Link: [text](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      elements.push(
        <Pressable key={key++} onPress={() => Linking.openURL(linkMatch[2]).catch(() => {})}>
          <Text
            style={[
              styles.link,
              { color: linkColor, fontSize: baseStyle.fontSize, lineHeight: baseStyle.lineHeight },
            ]}
          >
            {linkMatch[1]}
          </Text>
        </Pressable>,
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Bold: **text**
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      elements.push(
        <Text
          key={key++}
          style={[
            styles.bold,
            { fontSize: baseStyle.fontSize, lineHeight: baseStyle.lineHeight, color: baseStyle.color },
          ]}
        >
          {boldMatch[1]}
        </Text>,
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic: *text* (not **)
    const italicMatch = remaining.match(/^\*([^*]+)\*/);
    if (italicMatch) {
      elements.push(
        <Text
          key={key++}
          style={[
            styles.italic,
            { fontSize: baseStyle.fontSize, lineHeight: baseStyle.lineHeight, color: baseStyle.color },
          ]}
        >
          {italicMatch[1]}
        </Text>,
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Plain text up to next special marker
    const nextSpecial = remaining.search(/`|\[|\*\*/);
    if (nextSpecial === -1) {
      elements.push(
        <Text
          key={key++}
          style={{ fontSize: baseStyle.fontSize, lineHeight: baseStyle.lineHeight, color: baseStyle.color }}
        >
          {remaining}
        </Text>,
      );
      break;
    }

    if (nextSpecial > 0) {
      elements.push(
        <Text
          key={key++}
          style={{ fontSize: baseStyle.fontSize, lineHeight: baseStyle.lineHeight, color: baseStyle.color }}
        >
          {remaining.slice(0, nextSpecial)}
        </Text>,
      );
    }
    remaining = remaining.slice(nextSpecial);
  }

  return elements;
}

function InlineContent({
  line,
  baseStyle,
  codeBackground,
  linkColor,
}: {
  line: string;
  baseStyle: { fontSize: number; lineHeight: number; color: string };
  codeBackground: string;
  linkColor: string;
}) {
  const nodes = parseInlineLine(line, baseStyle, codeBackground, linkColor);
  return (
    <Text style={{ fontSize: baseStyle.fontSize, lineHeight: baseStyle.lineHeight, color: baseStyle.color }}>
      {nodes}
    </Text>
  );
}

// ─── Block Parsers ────────────────────────────────────────────────────────────

function countLeadingSpaces(line: string): number {
  const match = line.match(/^ */);
  return match ? match[0].length : 0;
}

function renderUnorderedList(
  lines: string[],
  baseStyle: { fontSize: number; lineHeight: number; color: string },
  codeBackground: string,
  linkColor: string,
  keyPrefix: string,
): React.ReactNode {
  const items: { level: number; content: string }[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    const m = trimmed.match(/^[-*]\s+(.*)$/);
    if (!m) break;
    const level = Math.floor(countLeadingSpaces(line) / 2);
    items.push({ level, content: m[1] });
  }

  const listStyle = {
    fontSize: chat.typography.listItem.fontSize,
    lineHeight: chat.typography.listItem.lineHeight,
    color: baseStyle.color,
  };

  return items.map((item, idx) => (
    <View key={`${keyPrefix}-ul-${idx}`} style={[styles.listItem, { paddingLeft: 8 + item.level * 16 }]}>
      <Text style={[styles.bullet, { color: baseStyle.color, fontSize: listStyle.fontSize }]}>{'•'}</Text>
      <View style={styles.listItemContent}>
        <InlineContent line={item.content} baseStyle={listStyle} codeBackground={codeBackground} linkColor={linkColor} />
      </View>
    </View>
  ));
}

function renderOrderedList(
  lines: string[],
  baseStyle: { fontSize: number; lineHeight: number; color: string },
  codeBackground: string,
  linkColor: string,
  keyPrefix: string,
): React.ReactNode {
  const items: { number: number; content: string }[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    const m = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (!m) break;
    items.push({ number: parseInt(m[1], 10), content: m[2] });
  }

  const listStyle = {
    fontSize: chat.typography.listItem.fontSize,
    lineHeight: chat.typography.listItem.lineHeight,
    color: baseStyle.color,
  };

  return items.map((item, idx) => (
    <View key={`${keyPrefix}-ol-${idx}`} style={styles.listItem}>
      <Text style={[styles.bullet, { color: baseStyle.color, fontSize: listStyle.fontSize, width: 24 }]}>
        {item.number}.
      </Text>
      <View style={styles.listItemContent}>
        <InlineContent line={item.content} baseStyle={listStyle} codeBackground={codeBackground} linkColor={linkColor} />
      </View>
    </View>
  ));
}

// ─── Main Renderer ────────────────────────────────────────────────────────────

export const MarkdownRenderer = React.memo(function MarkdownRenderer({
  text,
  baseStyle,
  codeBackground,
  linkColor,
  blockquoteBackground,
  blockquoteBorder,
}: MarkdownRendererProps) {
  const elements: React.ReactNode[] = [];
  const rawLines = text.split('\n');

  let i = 0;
  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // ── Fenced code block ─────────────────────────────────────────────────
    if (trimmed.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < rawLines.length && !rawLines[i].trim().startsWith('```')) {
        codeLines.push(rawLines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <ScrollView
          key={`cb-${elements.length}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.codeBlock, { backgroundColor: codeBackground }]}
        >
          <Text style={[styles.codeBlockText, { color: baseStyle.color }]}>
            {codeLines.join('\n')}
          </Text>
        </ScrollView>,
      );
      continue;
    }

    // ── Headings ──────────────────────────────────────────────────────────
    const h1Match = trimmed.match(/^#\s+(.+)$/);
    if (h1Match) {
      elements.push(
        <Text key={`h1-${elements.length}`} style={[styles.h1, { color: baseStyle.color }]}>
          {h1Match[1]}
        </Text>,
      );
      i++;
      continue;
    }

    const h2Match = trimmed.match(/^##\s+(.+)$/);
    if (h2Match) {
      elements.push(
        <Text key={`h2-${elements.length}`} style={[styles.h2, { color: baseStyle.color }]}>
          {h2Match[1]}
        </Text>,
      );
      i++;
      continue;
    }

    const h3Match = trimmed.match(/^###\s+(.+)$/);
    if (h3Match) {
      elements.push(
        <Text key={`h3-${elements.length}`} style={[styles.h3, { color: baseStyle.color }]}>
          {h3Match[1]}
        </Text>,
      );
      i++;
      continue;
    }

    // ── Blockquote ────────────────────────────────────────────────────────
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('>')) {
        quoteLines.push(rawLines[i].replace(/^>\s?/, ''));
        i++;
      }
      const quoteText = quoteLines.join(' ');
      elements.push(
        <View
          key={`bq-${elements.length}`}
          style={[styles.blockquote, { backgroundColor: blockquoteBackground, borderLeftColor: blockquoteBorder }]}
        >
          <InlineContent
            line={quoteText}
            baseStyle={{
              fontSize: chatTypography.quote.fontSize,
              lineHeight: chatTypography.quote.lineHeight,
              color: baseStyle.color,
            }}
            codeBackground={codeBackground}
            linkColor={linkColor}
          />
        </View>,
      );
      continue;
    }

    // ── Unordered list block ──────────────────────────────────────────────
    if (trimmed.match(/^[-*]\s/)) {
      const listLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().match(/^[-*]\s/)) {
        listLines.push(rawLines[i]);
        i++;
      }
      elements.push(
        <View key={`ul-${elements.length}`} style={styles.listBlock}>
          {renderUnorderedList(listLines, baseStyle, codeBackground, linkColor, `ul-${elements.length}`)}
        </View>,
      );
      continue;
    }

    // ── Ordered list block ────────────────────────────────────────────────
    if (trimmed.match(/^\d+\.\s/)) {
      const listLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().match(/^\d+\.\s/)) {
        listLines.push(rawLines[i]);
        i++;
      }
      elements.push(
        <View key={`ol-${elements.length}`} style={styles.listBlock}>
          {renderOrderedList(listLines, baseStyle, codeBackground, linkColor, `ol-${elements.length}`)}
        </View>,
      );
      continue;
    }

    // ── Empty line → paragraph break ─────────────────────────────────────
    if (!trimmed) {
      i++;
      continue;
    }

    // ── Paragraph ─────────────────────────────────────────────────────────
    // Collect contiguous non-empty, non-special lines into one paragraph
    const paraLines: string[] = [];
    while (
      i < rawLines.length &&
      rawLines[i].trim() !== '' &&
      !rawLines[i].trim().startsWith('#') &&
      !rawLines[i].trim().startsWith('>') &&
      !rawLines[i].trim().startsWith('```') &&
      !rawLines[i].trim().match(/^[-*]\s/) &&
      !rawLines[i].trim().match(/^\d+\.\s/)
    ) {
      paraLines.push(rawLines[i].trim());
      i++;
    }

    if (paraLines.length > 0) {
      const paragraphText = paraLines.join(' ');
      // Emoji-only lines: render at 1.4× size centered for visual emphasis
      if (isEmojiOnly(paragraphText)) {
        elements.push(
          <Text
            key={`emoji-${elements.length}`}
            style={[
              styles.emojiLine,
              { fontSize: Math.round(baseStyle.fontSize * 1.4), color: baseStyle.color },
            ]}
          >
            {paragraphText.trim()}
          </Text>,
        );
      } else {
        elements.push(
          <View key={`p-${elements.length}`} style={styles.paragraph}>
            <InlineContent
              line={paragraphText}
              baseStyle={baseStyle}
              codeBackground={codeBackground}
              linkColor={linkColor}
            />
          </View>,
        );
      }
    }
  }

  return <>{elements}</>;
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  paragraph: {
    marginBottom: 10,
  },
  emojiLine: {
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 6,
  },
  h1: {
    fontSize: chat.typography.h1.fontSize,
    lineHeight: chat.typography.h1.lineHeight,
    fontWeight: chat.typography.h1.fontWeight,
    marginBottom: 8,
    marginTop: 4,
  },
  h2: {
    fontSize: chat.typography.h2.fontSize,
    lineHeight: chat.typography.h2.lineHeight,
    fontWeight: chat.typography.h2.fontWeight,
    marginBottom: 6,
    marginTop: 2,
  },
  h3: {
    fontSize: chat.typography.h3.fontSize,
    lineHeight: chat.typography.h3.lineHeight,
    fontWeight: chat.typography.h3.fontWeight as '600',
    marginBottom: 4,
    marginTop: 2,
  },
  inlineCode: {
    fontFamily: typography.fontFamily.mono,
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  link: {
    textDecorationLine: 'underline',
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  listBlock: {
    marginBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  bullet: {
    width: 18,
    flexShrink: 0,
  },
  listItemContent: {
    flex: 1,
  },
  blockquote: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    paddingVertical: 6,
    paddingRight: 4,
    marginBottom: 10,
    borderRadius: 4,
  },
  codeBlock: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  codeBlockText: {
    fontFamily: typography.fontFamily.mono,
    fontSize: chat.typography.code.fontSize,
    lineHeight: 20,
  },
});

export default MarkdownRenderer;
