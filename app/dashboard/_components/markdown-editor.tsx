"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import Image from "@tiptap/extension-image";
import { Markdown } from "tiptap-markdown";
import {
  Bold,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Plus,
  Quote,
  Trash2,
} from "lucide-react";

// tiptap-markdown augments editor.storage at runtime but not in the types.
function getMarkdown(editor: Editor): string {
  return (editor.storage as unknown as { markdown: { getMarkdown(): string } }).markdown.getMarkdown();
}

interface Section {
  id: string;
  title: string;
  body: string; // markdown for this section's body (no heading line)
}

let idCounter = 0;
const nextId = () => `s${Date.now().toString(36)}-${idCounter++}`;

const HEADING_RE = /^(#{1,3})\s+(.*)$/;

// Markdown -> section boxes. Text before the first heading becomes an
// untitled lead-in section.
function parseSections(markdown: string): Section[] {
  const lines = markdown.split("\n");
  const sections: Section[] = [];
  let current: { title: string; body: string[] } = { title: "", body: [] };
  let started = false;

  const flush = () => {
    const body = current.body.join("\n").trim();
    if (started || current.title || body) {
      sections.push({ id: nextId(), title: current.title, body });
    }
  };

  for (const line of lines) {
    const match = line.match(HEADING_RE);
    if (match) {
      flush();
      current = { title: match[2].trim(), body: [] };
      started = true;
    } else {
      current.body.push(line);
    }
  }
  flush();

  if (sections.length === 0) sections.push({ id: nextId(), title: "", body: "" });
  return sections;
}

// Section boxes -> markdown.
function assemble(sections: Section[]): string {
  return sections
    .map((s) => {
      const head = s.title.trim() ? `# ${s.title.trim()}` : "";
      return [head, s.body.trim()].filter(Boolean).join("\n\n");
    })
    .filter(Boolean)
    .join("\n\n");
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [sections, setSections] = useState<Section[]>(() => parseSections(value));
  // The markdown we last emitted, so parent re-renders don't reset the boxes.
  const lastEmitted = useRef<string>(value);
  // The section body editor that currently has focus — the toolbar targets it.
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null);

  // Re-parse only when the value changed outside this component (e.g. upload).
  useEffect(() => {
    if (value !== lastEmitted.current) {
      lastEmitted.current = value;
      setSections(parseSections(value));
    }
  }, [value]);

  function commit(next: Section[]) {
    setSections(next);
    const markdown = assemble(next);
    lastEmitted.current = markdown;
    onChange(markdown);
  }

  const update = (id: string, patch: Partial<Section>) =>
    commit(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const remove = (id: string) => commit(sections.filter((s) => s.id !== id));

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  };

  const addSection = () => commit([...sections, { id: nextId(), title: "", body: "" }]);

  const words = value.replace(/[#*`>_~\-[\]()!]/g, " ").split(/\s+/).filter(Boolean).length;
  const sectionCount = sections.filter((s) => s.title.trim()).length;

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]">
      <Toolbar editor={activeEditor} />

      <div className="grid gap-4 p-4">
        {sections.map((section, index) => (
          <SectionCard
            key={section.id}
            section={section}
            index={index}
            total={sections.length}
            canRemove={sections.length > 1}
            placeholder={index === 0 ? placeholder : undefined}
            onTitle={(title) => update(section.id, { title })}
            onBody={(body) => update(section.id, { body })}
            onMoveUp={() => move(index, -1)}
            onMoveDown={() => move(index, 1)}
            onRemove={() => remove(section.id)}
            onFocusEditor={setActiveEditor}
            onBlurEditor={(ed) => setActiveEditor((cur) => (cur === ed ? null : cur))}
          />
        ))}

        <button
          type="button"
          onClick={addSection}
          className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--line)] bg-white py-3 text-sm font-medium text-[var(--muted)] transition-colors hover:border-[var(--river)] hover:text-[var(--river-deep)]"
        >
          <Plus size={16} aria-hidden="true" /> Add section
        </button>
      </div>

      <div className="flex items-center justify-between border-t border-[var(--line)] bg-white px-4 py-2 text-xs text-[var(--muted)]">
        <span>
          {sectionCount} {sectionCount === 1 ? "section" : "sections"}
        </span>
        <span className="mono">{words.toLocaleString()} words</span>
      </div>
    </div>
  );
}

function SectionCard({
  section,
  index,
  total,
  canRemove,
  placeholder,
  onTitle,
  onBody,
  onMoveUp,
  onMoveDown,
  onRemove,
  onFocusEditor,
  onBlurEditor,
}: {
  section: Section;
  index: number;
  total: number;
  canRemove: boolean;
  placeholder?: string;
  onTitle: (v: string) => void;
  onBody: (v: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onFocusEditor: (editor: Editor) => void;
  onBlurEditor: (editor: Editor) => void;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[var(--line)] bg-white shadow-[0_1px_0_rgba(23,23,25,0.03),0_12px_28px_-26px_rgba(23,23,25,0.5)]">
      <header className="flex items-center gap-2 border-b border-[var(--faint)] bg-[var(--surface-muted)] px-3 py-2">
        <span className="mono shrink-0 rounded-md bg-[var(--river-pale)] px-2 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-[var(--river-deep)]">
          Section {index + 1}
        </span>
        <input
          value={section.title}
          onChange={(e) => onTitle(e.target.value)}
          placeholder="Untitled section"
          aria-label={`Section ${index + 1} title`}
          className="min-w-0 flex-1 bg-transparent text-base font-semibold text-[var(--ink)] outline-none placeholder:font-normal placeholder:text-[var(--quiet)]"
        />
        <div className="flex shrink-0 items-center">
          <IconButton label="Move section up" disabled={index === 0} onClick={onMoveUp}>
            <ChevronUp size={15} aria-hidden="true" />
          </IconButton>
          <IconButton label="Move section down" disabled={index === total - 1} onClick={onMoveDown}>
            <ChevronDown size={15} aria-hidden="true" />
          </IconButton>
          <IconButton label="Delete section" disabled={!canRemove} onClick={onRemove} danger>
            <Trash2 size={15} aria-hidden="true" />
          </IconButton>
        </div>
      </header>

      <SectionBody
        value={section.body}
        placeholder={placeholder ?? "Write this section…"}
        onChange={onBody}
        onFocusEditor={onFocusEditor}
        onBlurEditor={onBlurEditor}
      />
    </section>
  );
}

function SectionBody({
  value,
  placeholder,
  onChange,
  onFocusEditor,
  onBlurEditor,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onFocusEditor: (editor: Editor) => void;
  onBlurEditor: (editor: Editor) => void;
}) {
  const lastEmitted = useRef<string>(value);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: useMemo(
      () => [
        StarterKit.configure({ heading: false }),
        Placeholder.configure({ placeholder }),
        Image.configure({ inline: false, allowBase64: true }),
        Markdown.configure({ transformPastedText: true, transformCopiedText: true }),
      ],
      [placeholder],
    ),
    content: value,
    editorProps: { attributes: { class: "md-canvas", "aria-label": "Section body" } },
    onUpdate: ({ editor }) => {
      const markdown = getMarkdown(editor);
      lastEmitted.current = markdown;
      onChange(markdown);
    },
    onFocus: ({ editor }) => onFocusEditor(editor),
    onBlur: ({ editor }) => onBlurEditor(editor),
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== lastEmitted.current) {
      lastEmitted.current = value;
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  return <EditorContent editor={editor} />;
}

function Toolbar({ editor }: { editor: Editor | null }) {
  const disabled = !editor;

  const run = (fn: (chain: ReturnType<Editor["chain"]>) => ReturnType<Editor["chain"]>) => {
    if (!editor) return;
    fn(editor.chain().focus()).run();
  };

  const addImage = () => {
    if (!editor) return;
    const url = window.prompt("Image URL");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-[var(--line)] bg-white px-2 py-1.5">
      <ToolButton label="Bold" disabled={disabled} active={!!editor?.isActive("bold")} onClick={() => run((c) => c.toggleBold())}>
        <Bold size={16} aria-hidden="true" />
      </ToolButton>
      <ToolButton label="Italic" disabled={disabled} active={!!editor?.isActive("italic")} onClick={() => run((c) => c.toggleItalic())}>
        <Italic size={16} aria-hidden="true" />
      </ToolButton>

      <span className="mx-1 h-5 w-px bg-[var(--line)]" aria-hidden="true" />

      <ToolButton label="Bullet list" disabled={disabled} active={!!editor?.isActive("bulletList")} onClick={() => run((c) => c.toggleBulletList())}>
        <List size={16} aria-hidden="true" />
      </ToolButton>
      <ToolButton label="Numbered list" disabled={disabled} active={!!editor?.isActive("orderedList")} onClick={() => run((c) => c.toggleOrderedList())}>
        <ListOrdered size={16} aria-hidden="true" />
      </ToolButton>
      <ToolButton label="Quote" disabled={disabled} active={!!editor?.isActive("blockquote")} onClick={() => run((c) => c.toggleBlockquote())}>
        <Quote size={16} aria-hidden="true" />
      </ToolButton>

      <span className="mx-1 h-5 w-px bg-[var(--line)]" aria-hidden="true" />

      <ToolButton label="Insert image" disabled={disabled} active={false} onClick={addImage}>
        <ImagePlus size={16} aria-hidden="true" />
      </ToolButton>

      <span className="ml-auto hidden pr-1 text-xs text-[var(--muted)] sm:block">
        {disabled ? "Select a section to format" : "Formatting current section"}
      </span>
    </div>
  );
}

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // Keep the section editor's selection while clicking the toolbar.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
        active ? "bg-[var(--river-pale)] text-[var(--river-deep)]" : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
      }`}
    >
      {children}
    </button>
  );
}

function IconButton({
  label,
  disabled,
  danger,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`grid h-7 w-7 place-items-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        danger
          ? "text-[var(--muted)] hover:bg-[#fff1f0] hover:text-[#8d2f2d]"
          : "text-[var(--muted)] hover:bg-white hover:text-[var(--ink)]"
      }`}
    >
      {children}
    </button>
  );
}
