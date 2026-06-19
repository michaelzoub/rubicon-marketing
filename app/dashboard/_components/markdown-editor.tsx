"use client";

import { useEffect, useMemo, useRef } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import Image from "@tiptap/extension-image";
import { Markdown } from "tiptap-markdown";
import { HeadingEnter, SectionDecorations } from "./editor-extensions";
import {
  Bold,
  Heading,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";

// tiptap-markdown augments editor.storage at runtime but not in the types.
function getMarkdown(editor: Editor): string {
  return (editor.storage as unknown as { markdown: { getMarkdown(): string } }).markdown.getMarkdown();
}

// A "section" is a heading plus the blocks that follow it until the next
// heading. Top-level ProseMirror nodes are DOM siblings, so we decorate those
// nodes with explicit section classes instead of asking CSS to infer structure
// from adjacent selectors.
const HEADING_RE = /^#{1,3}\s+\S/;

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  // The markdown we last emitted, so parent re-renders don't reset the editor.
  const lastEmitted = useRef<string>(value);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: useMemo(
      () => [
        StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
        Placeholder.configure({ placeholder: placeholder ?? "Start writing, or paste your article here…" }),
        Image.configure({ inline: false, allowBase64: true }),
        Markdown.configure({ transformPastedText: true, transformCopiedText: true }),
        HeadingEnter,
        SectionDecorations,
      ],
      [placeholder],
    ),
    content: value,
    editorProps: { attributes: { class: "md-canvas", "aria-label": "Article content" } },
    onUpdate: ({ editor }) => {
      const markdown = getMarkdown(editor);
      lastEmitted.current = markdown;
      onChange(markdown);
    },
  });

  // Re-sync only when the value changed outside this component (e.g. upload).
  useEffect(() => {
    if (!editor) return;
    if (value !== lastEmitted.current) {
      lastEmitted.current = value;
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  const words = value.replace(/[#*`>_~\-[\]()!]/g, " ").split(/\s+/).filter(Boolean).length;
  const sectionCount = value.split(/\r?\n/).filter((line) => HEADING_RE.test(line)).length;

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]">
      <Toolbar editor={editor} />

      <div className="p-4">
        <EditorContent editor={editor} />
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
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-[var(--line)] bg-white px-3 py-2">
      <ToolButton
        label="Section heading"
        disabled={disabled}
        active={!!editor?.isActive("heading", { level: 2 })}
        onClick={() => run((c) => c.toggleHeading({ level: 2 }))}
      >
        <Heading size={16} aria-hidden="true" />
      </ToolButton>

      <span className="mx-1 h-5 w-px bg-[var(--line)]" aria-hidden="true" />

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
        Each heading starts a new section
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
      // Keep the editor selection while clicking the toolbar.
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
