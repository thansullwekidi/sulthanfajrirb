import type { ReactNode } from "react";

/**
 * Perender Markdown minimal tanpa HTML mentah.
 * Mendukung judul, paragraf, daftar, blok kode, dan penekanan sebaris.
 */

function inline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      nodes.push(text.slice(cursor, match.index));
    }
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(<strong key={`b-${key}`}>{token.slice(2, -2)}</strong>);
    } else {
      nodes.push(<code key={`c-${key}`}>{token.slice(1, -1)}</code>);
    }
    key += 1;
    cursor = match.index + token.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

interface Block {
  kind: "h3" | "h4" | "p" | "ul" | "quote" | "code";
  lines: string[];
}

function parse(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let buffer: string[] = [];
  let kind: Block["kind"] = "p";
  let inCode = false;

  const flush = () => {
    if (buffer.length === 0) return;
    blocks.push({ kind, lines: [...buffer] });
    buffer = [];
    kind = "p";
  };

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (inCode) {
        flush();
        inCode = false;
      } else {
        flush();
        inCode = true;
        kind = "code";
      }
      continue;
    }

    if (inCode) {
      buffer.push(line);
      continue;
    }

    if (/^#{2,3}\s/.test(line)) {
      flush();
      blocks.push({
        kind: line.startsWith("### ") ? "h4" : "h3",
        lines: [line.replace(/^#{2,3}\s/, "")]
      });
      continue;
    }

    if (/^[-*]\s/.test(line)) {
      if (kind !== "ul") flush();
      kind = "ul";
      buffer.push(line.replace(/^[-*]\s/, ""));
      continue;
    }

    if (/^>\s?/.test(line)) {
      if (kind !== "quote") flush();
      kind = "quote";
      buffer.push(line.replace(/^>\s?/, ""));
      continue;
    }

    if (line.trim() === "") {
      flush();
      continue;
    }

    if (kind !== "p") flush();
    kind = "p";
    buffer.push(line);
  }

  flush();
  return blocks;
}

export function MarkdownBlock({ content }: { content: string }) {
  const blocks = parse(content);

  return (
    <div className="markdown">
      {blocks.map((block, index) => {
        const key = `block-${index}`;
        if (block.kind === "h3") return <h3 key={key}>{inline(block.lines.join(" "))}</h3>;
        if (block.kind === "h4") return <h4 key={key}>{inline(block.lines.join(" "))}</h4>;
        if (block.kind === "code")
          return (
            <pre key={key}>
              <code>{block.lines.join("\n")}</code>
            </pre>
          );
        if (block.kind === "ul")
          return (
            <ul key={key}>
              {block.lines.map((line, itemIndex) => (
                <li key={`${key}-${itemIndex}`}>{inline(line)}</li>
              ))}
            </ul>
          );
        if (block.kind === "quote")
          return (
            <p key={key} style={{ borderLeft: "2px solid var(--accent)", paddingLeft: 12 }}>
              {inline(block.lines.join(" "))}
            </p>
          );
        return <p key={key}>{inline(block.lines.join(" "))}</p>;
      })}
    </div>
  );
}
