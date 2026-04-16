import { useEffect, useRef, useCallback } from "react";

declare global {
  interface Window {
    Prism: {
      highlight: (code: string, grammar: unknown, language: string) => string;
      languages: Record<string, unknown>;
      highlightElement: (el: Element) => void;
    };
  }
}

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  placeholder?: string;
  "data-testid"?: string;
}

export function CodeEditor({ value, onChange, language = "javascript", placeholder = "// Enter your code here...", "data-testid": testId }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const getHighlighted = useCallback((code: string, lang: string) => {
    if (!window.Prism) return escapeHtml(code);
    const grammar = window.Prism.languages[lang] || window.Prism.languages["plaintext"];
    if (!grammar) return escapeHtml(code);
    try {
      return window.Prism.highlight(code, grammar, lang);
    } catch {
      return escapeHtml(code);
    }
  }, []);

  useEffect(() => {
    if (preRef.current) {
      const displayValue = value || "";
      preRef.current.innerHTML = getHighlighted(displayValue, language) + "\n";
    }
  }, [value, language, getHighlighted]);

  const syncScroll = useCallback(() => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const newValue = value.substring(0, start) + "  " + value.substring(end);
      onChange(newValue);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 2;
      });
    }
  }, [value, onChange]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-md border border-border bg-[#0d1117] font-mono text-sm">
      <pre
        ref={preRef}
        aria-hidden="true"
        className="absolute inset-0 m-0 p-4 overflow-auto whitespace-pre-wrap break-words pointer-events-none text-[#c9d1d9] leading-relaxed code-editor-area"
        style={{ fontFamily: "var(--app-font-mono)", fontSize: "0.875rem", lineHeight: "1.6" }}
      />
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={syncScroll}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        data-testid={testId}
        className="absolute inset-0 w-full h-full m-0 p-4 resize-none bg-transparent text-transparent caret-[#58a6ff] outline-none overflow-auto whitespace-pre-wrap break-words leading-relaxed selection:bg-[#58a6ff33] code-editor-area"
        style={{ fontFamily: "var(--app-font-mono)", fontSize: "0.875rem", lineHeight: "1.6", caretColor: "#58a6ff" }}
      />
    </div>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
