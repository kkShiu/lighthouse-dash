import type { ReactNode } from "react";

const MARKDOWN_LINK = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

/**
 * Lighthouse audit descriptions embed markdown-style links, e.g.
 * "... [Learn more about X](https://...)." — this renders those as real
 * anchors (opening in a new tab) instead of showing the raw brackets/parens.
 */
export function linkify(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  MARKDOWN_LINK.lastIndex = 0;
  while ((match = MARKDOWN_LINK.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const [, label, url] = match;
    nodes.push(
      <a key={key++} href={url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent, #6ea8fe)" }}>
        {label}
      </a>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}
