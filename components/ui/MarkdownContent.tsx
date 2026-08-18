import Link from "next/link";
import type { ReactNode } from "react";

type MarkdownContentProps = {
  content: string;
};

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let index = 0;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const label = match[1];
    const href = match[2];
    nodes.push(
      href.startsWith("/") ? (
        <Link href={href} key={`${keyPrefix}-link-${index}`}>
          {label}
        </Link>
      ) : (
        <a href={href} key={`${keyPrefix}-link-${index}`} rel="noreferrer">
          {label}
        </a>
      )
    );
    lastIndex = match.index + match[0].length;
    index += 1;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function renderTable(lines: string[], key: string) {
  const rows = lines.map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()));
  const [head, _separator, ...body] = rows;

  return (
    <div className="article-table-shell" key={key}>
      <table>
        <thead>
          <tr>
            {head.map((cell, index) => <th key={`${key}-head-${index}`}>{cell}</th>)}
          </tr>
        </thead>
        <tbody>
          {body.map((row, rowIndex) => (
            <tr key={`${key}-row-${rowIndex}`}>
              {row.map((cell, cellIndex) => <td key={`${key}-cell-${rowIndex}-${cellIndex}`}>{renderInline(cell, `${key}-${rowIndex}-${cellIndex}`)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  const lines = content.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push(<h3 key={`h3-${index}`}>{line.slice(4)}</h3>);
      index += 1;
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push(<h2 key={`h2-${index}`}>{line.slice(3)}</h2>);
      index += 1;
      continue;
    }

    if (line.startsWith("|") && lines[index + 1]?.trim().startsWith("| ---")) {
      const tableLines = [line, lines[index + 1].trim()];
      index += 2;
      while (lines[index]?.trim().startsWith("|")) {
        tableLines.push(lines[index].trim());
        index += 1;
      }
      blocks.push(renderTable(tableLines, `table-${index}`));
      continue;
    }

    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (lines[index]?.trim().startsWith("- ")) {
        items.push(lines[index].trim().slice(2));
        index += 1;
      }
      blocks.push(
        <ul key={`list-${index}`}>
          {items.map((item, itemIndex) => <li key={`item-${index}-${itemIndex}`}>{renderInline(item, `item-${index}-${itemIndex}`)}</li>)}
        </ul>
      );
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (lines[index]?.trim() && !/^(## |### |- |\|)/.test(lines[index].trim())) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(<p key={`p-${index}`}>{renderInline(paragraph.join(" "), `p-${index}`)}</p>);
  }

  return <div className="article-content">{blocks}</div>;
}
