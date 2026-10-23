import React from 'react';

/**
 * Lightweight, zero-dependency Markdown & Rich Text Renderer
 * Specially tailored for SUBA's ChatGPT-grade AI responses & Thirukkural couplets.
 */

// Helper to format inline markdown (bold, italic, code)
function formatInline(text) {
  if (!text) return null;

  // Regex to split tokens: **bold**, *italic*, `code`
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} className="font-bold text-forest-950">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={index} className="italic text-forest-900">
          {part.slice(1, -1)}
        </em>
      );
    }

    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 bg-cream-200 text-forest-900 rounded font-mono text-xs"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });
}

export default function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null;

  // Split content into paragraphs/blocks separated by double newlines
  const rawBlocks = content.split(/\n\s*\n/);

  return (
    <div className={`space-y-3 leading-relaxed text-sm ${className}`}>
      {rawBlocks.map((block, blockIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        const lines = trimmed.split('\n');

        // Check if block is a blockquote (all or first line starts with >)
        if (lines[0].startsWith('>')) {
          const quoteText = lines
            .map((line) => line.replace(/^>\s?/, ''))
            .join('\n');

          return (
            <blockquote
              key={blockIdx}
              className="my-3 pl-4 pr-3 py-2.5 rounded-r-xl border-l-4 border-gold-500 bg-gold-50/60 text-forest-950 font-serif italic text-sm shadow-xs"
            >
              {quoteText.split('\n').map((line, lIdx) => (
                <p key={lIdx} className="leading-relaxed">
                  {formatInline(line)}
                </p>
              ))}
            </blockquote>
          );
        }

        // Check if block is a list of bullet points (starts with •, -, or *)
        const isBulletList = lines.every((line) =>
          /^(\s*[-•*]\s+|\s*\d+\.\s+)/.test(line.trim())
        );

        if (isBulletList) {
          return (
            <ul key={blockIdx} className="space-y-1.5 my-2 pl-1">
              {lines.map((line, lIdx) => {
                const cleanLine = line.replace(/^\s*[-•*]\s+|\s*\d+\.\s+/, '');
                return (
                  <li key={lIdx} className="flex items-start space-x-2 text-forest-900">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-2 shrink-0" />
                    <span className="flex-1 leading-relaxed">
                      {formatInline(cleanLine)}
                    </span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Check if the block represents a major AI section heading
        // e.g. **1. Situational Diagnosis:** or 🤖 **SUBA AI Wisdom...**
        const isHeaderLike =
          /^(\*\*|###|##|\d+\.)/.test(trimmed) &&
          lines.length === 1 &&
          (trimmed.endsWith(':**') || trimmed.endsWith(':') || trimmed.includes('AI'));

        if (isHeaderLike) {
          return (
            <div
              key={blockIdx}
              className="pt-2 pb-1 border-b border-cream-200/80 font-bold text-forest-950 text-sm flex items-center space-x-1.5"
            >
              <span>{formatInline(trimmed)}</span>
            </div>
          );
        }

        // Standard paragraph
        return (
          <p key={blockIdx} className="whitespace-pre-wrap leading-relaxed text-forest-950">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {formatInline(line)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
