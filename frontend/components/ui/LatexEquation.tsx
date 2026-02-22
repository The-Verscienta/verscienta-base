'use client';

import { useMemo } from 'react';
import katex from 'katex';

interface LatexEquationProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

/**
 * Renders a LaTeX equation using KaTeX. Falls back to plain text if parsing fails.
 *
 * Security: KaTeX.renderToString produces sanitized math-only HTML.
 * The `trust: false` option prevents macros from accessing external resources.
 */
export function LatexEquation({ latex, displayMode = false, className = '' }: LatexEquationProps) {
  const rendered = useMemo(() => {
    try {
      return {
        html: katex.renderToString(latex, {
          displayMode,
          throwOnError: true,
          trust: false,
          strict: 'warn',
        }),
        error: null,
      };
    } catch {
      return { html: null, error: true };
    }
  }, [latex, displayMode]);

  if (rendered.error) {
    return (
      <code className={`font-mono text-xs bg-earth-50 text-earth-800 rounded px-2 py-1 ${className}`}>
        {latex}
      </code>
    );
  }

  // KaTeX.renderToString produces sanitized math-only HTML (no user HTML passthrough)
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: rendered.html! }}
    />
  );
}
