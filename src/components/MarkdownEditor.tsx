"use client";

import React, { useRef, useState } from "react";
import { Bold, Italic, Heading2, List, Link as LinkIcon, Code, Quote } from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  id?: string;
}

/**
 * Lightweight Markdown editor: textarea + formatting toolbar that wraps the
 * current selection with Markdown syntax. Designed to be a drop-in
 * replacement for `<textarea>` for task descriptions.
 *
 * Why custom instead of pulling in @uiw/react-md-editor:
 *  - Avoid the bundle hit (~250KB) for what amounts to 8 buttons
 *  - Keep the existing textarea-driven form submission flow
 *  - Maintain the exact same styling as the rest of the planner
 */
export function MarkdownEditor({ value, onChange, placeholder, rows = 4, id }: MarkdownEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });

  const recordSelection = () => {
    const el = ref.current;
    if (!el) return;
    setSelection({ start: el.selectionStart, end: el.selectionEnd });
  };

  /** Apply a transformation around the current selection and update the value. */
  const wrap = (left: string, right: string = left, placeholderText = "") => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = value.slice(0, start);
    const middle = value.slice(start, end) || placeholderText;
    const after = value.slice(end);
    const next = `${before}${left}${middle}${right}${after}`;
    onChange(next);
    // Restore selection around the wrapped content
    requestAnimationFrame(() => {
      el.focus();
      const cursorAt = start + left.length + middle.length;
      el.setSelectionRange(start + left.length, cursorAt);
    });
  };

  const prefixLines = (prefix: string) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = value.slice(0, start);
    const middle = value.slice(start, end);
    const after = value.slice(end);
    // Add prefix to each line in the selection (or current line if empty selection)
    const lines = (middle || "\n").split("\n");
    const prefixed = lines.map((l) => `${prefix}${l}`).join("\n");
    onChange(`${before}${prefixed}${after}`);
    requestAnimationFrame(() => {
      el.focus();
    });
  };

  const insertLink = () => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || "link text";
    const insertion = `[${selected}](https://)`;
    const before = value.slice(0, start);
    const after = value.slice(end);
    onChange(`${before}${insertion}${after}`);
    requestAnimationFrame(() => {
      el.focus();
      // Place cursor inside the URL parentheses
      const urlStart = start + insertion.indexOf("https://");
      el.setSelectionRange(urlStart, urlStart + "https://".length);
    });
  };

  const buttons: Array<{ icon: React.ReactNode; label: string; onClick: () => void; }> = [
    { icon: <Bold size={12} />, label: "Bold", onClick: () => wrap("**", "**", "bold text") },
    { icon: <Italic size={12} />, label: "Italic", onClick: () => wrap("_", "_", "italic text") },
    { icon: <Heading2 size={12} />, label: "Heading", onClick: () => prefixLines("## ") },
    { icon: <List size={12} />, label: "List", onClick: () => prefixLines("- ") },
    { icon: <Quote size={12} />, label: "Quote", onClick: () => prefixLines("> ") },
    { icon: <Code size={12} />, label: "Code", onClick: () => wrap("`", "`", "code") },
    { icon: <LinkIcon size={12} />, label: "Link", onClick: insertLink },
  ];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-0.5 p-1 rounded-lg bg-muted/10 border border-border/40 w-fit">
        {buttons.map((b) => (
          <button
            type="button"
            key={b.label}
            onClick={b.onClick}
            aria-label={b.label}
            title={b.label}
            className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            {b.icon}
          </button>
        ))}
      </div>
      <textarea
        ref={ref}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={recordSelection}
        onKeyUp={recordSelection}
        onMouseUp={recordSelection}
        placeholder={placeholder ?? "Supports Markdown: **bold**, _italic_, ## heading, - list, > quote, `code`, [link](url)"}
        rows={rows}
        className="w-full text-sm bg-background border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:border-accent resize-none font-mono leading-relaxed"
      />
      <p className="text-[10px] text-muted/70 leading-tight">
        Markdown supported. The viewer renders bold, italic, headings, lists, code and links.
      </p>
    </div>
  );
}

export default MarkdownEditor;
