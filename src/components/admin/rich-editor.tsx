"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  EditorContent,
  Node,
  mergeAttributes,
  useEditor,
  type Editor,
} from "@tiptap/react";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Markdown } from "tiptap-markdown";
import {
  Bold,
  Code,
  Code2,
  GripVertical,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Lightbulb,
  Minus,
  Plus,
  Quote,
  Strikethrough,
  Table2,
  Type,
} from "lucide-react";

import { blobUrls } from "@/lib/blob-urls";
import { removeDiacritics } from "@/lib/utils";

/* ───────── Extension tuỳ biến ───────── */

// Khối callout: lưu trong Markdown dưới dạng <aside>…</aside>
const Aside = Node.create({
  name: "aside",
  group: "block",
  content: "block+",
  defining: true,
  parseHTML() {
    return [{ tag: "aside" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["aside", mergeAttributes(HTMLAttributes), 0];
  },
  addStorage() {
    return {
      markdown: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        serialize(state: any, node: any) {
          state.write("<aside>");
          state.closeBlock(node);
          state.renderContent(node);
          state.write("</aside>");
          state.closeBlock(node);
        },
        parse: {},
      },
    };
  },
});

// Ảnh: trong editor hiển thị blob tạm nếu có, nhưng trong tài liệu vẫn giữ đường dẫn thật
const ImageWithBlob = Image.extend({
  renderHTML({ HTMLAttributes }) {
    const src = String(HTMLAttributes.src ?? "");
    return ["img", mergeAttributes(HTMLAttributes, { src: blobUrls[src] ?? src })];
  },
});

/* ───────── Slash menu ───────── */

interface SlashItem {
  title: string;
  hint: string;
  keywords: string;
  icon: React.ReactNode;
  run: (editor: Editor) => void;
}

const ic = "size-4";

const LANGS = [
  "", "ts", "tsx", "js", "json", "bash", "powershell", "yaml", "dockerfile",
  "sql", "css", "html", "csharp", "python", "markdown", "diff",
];

interface SlashState {
  query: string;
  from: number;
  to: number;
  top: number;
  left: number;
}

interface ToolbarState {
  top: number;
  left: number;
}

export function RichEditor({
  initialMarkdown,
  onChange,
  onUpload,
}: {
  initialMarkdown: string;
  onChange: (markdown: string) => void;
  /** Upload ảnh, trả về URL (/uploads/...) hoặc null nếu lỗi */
  onUpload: (file: File) => Promise<string | null>;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const selectFocused = useRef(false);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onUploadRef = useRef(onUpload);
  onUploadRef.current = onUpload;

  const [slash, setSlash] = useState<SlashState | null>(null);
  const [slashIndex, setSlashIndex] = useState(0);
  const [toolbar, setToolbar] = useState<ToolbarState | null>(null);
  const [handle, setHandle] = useState<{ top: number; pos: number } | null>(null);

  const slashRef = useRef<SlashState | null>(null);
  slashRef.current = slash;
  const slashIndexRef = useRef(0);
  slashIndexRef.current = slashIndex;
  const dismissedRef = useRef<number | null>(null);
  const filteredRef = useRef<SlashItem[]>([]);
  const runSlashRef = useRef<(item: SlashItem) => void>(() => {});

  /* Chèn ảnh (từ dán / kéo thả / chọn file) */
  async function insertImages(files: File[], at?: number) {
    const ed = editorRef.current;
    if (!ed) return;
    let pos = at ?? ed.state.selection.to;
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      const url = await onUploadRef.current(file);
      if (!url) continue;
      const alt = file.name.replace(/\.[^.]+$/, "");
      ed.chain().focus().insertContentAt(pos, { type: "image", attrs: { src: url, alt } }).run();
      pos = ed.state.selection.to;
    }
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ dropcursor: { color: "#3b82f6", width: 2 } }),
      Link.configure({
        openOnClick: false,
        autolink: false,
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
      ImageWithBlob,
      Placeholder.configure({ placeholder: "Gõ “/” để chèn khối, hoặc cứ viết…" }),
      Table,
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      Aside,
      Markdown.configure({
        html: true,
        tightLists: true,
        bulletListMarker: "-",
        linkify: false,
        breaks: false,
        transformPastedText: true,
        transformCopiedText: false,
      }),
    ],
    content: initialMarkdown,
    editorProps: {
      attributes: {
        class:
          "rich-editor post-body prose prose-neutral max-w-none dark:prose-invert focus:outline-none min-h-[60vh] pb-40",
      },
      handleKeyDown: (_view, event) => {
        const s = slashRef.current;
        const items = filteredRef.current;
        if (!s || items.length === 0) return false;
        if (event.key === "ArrowDown") {
          setSlashIndex((i) => (i + 1) % items.length);
          return true;
        }
        if (event.key === "ArrowUp") {
          setSlashIndex((i) => (i - 1 + items.length) % items.length);
          return true;
        }
        if (event.key === "Enter") {
          const item = items[Math.min(slashIndexRef.current, items.length - 1)];
          if (item) runSlashRef.current(item);
          return true;
        }
        if (event.key === "Escape") {
          dismissedRef.current = s.from;
          setSlash(null);
          return true;
        }
        return false;
      },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []);
        if (files.some((f) => f.type.startsWith("image/"))) {
          event.preventDefault();
          void insertImages(files);
          return true;
        }
        return false;
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false;
        const files = Array.from(event.dataTransfer?.files ?? []);
        if (!files.some((f) => f.type.startsWith("image/"))) return false;
        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        void insertImages(files, pos);
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      onChangeRef.current(editor.storage.markdown.getMarkdown());
    },
  });

  editorRef.current = editor;

  /* Cập nhật vị trí thanh định dạng nổi + slash menu */
  useEffect(() => {
    if (!editor) return;

    const update = () => {
      const { state, view } = editor;
      const { selection } = state;
      const { from, to, empty, $from } = selection;

      // Slash menu
      let nextSlash: SlashState | null = null;
      if (empty && editor.isFocused && $from.parent.type.name === "paragraph") {
        const textBefore = $from.parent.textBetween(0, $from.parentOffset, undefined, "\ufffc");
        const m = /^\/([^\s/]*)$/.exec(textBefore);
        if (m) {
          const start = from - textBefore.length;
          if (dismissedRef.current !== start) {
            const c = view.coordsAtPos(from);
            nextSlash = { query: m[1], from: start, to: from, top: c.bottom + 6, left: c.left };
          }
        } else {
          dismissedRef.current = null;
        }
      } else {
        dismissedRef.current = null;
      }
      if (nextSlash && slashRef.current?.query !== nextSlash.query) setSlashIndex(0);
      setSlash(nextSlash);

      // Thanh định dạng nổi
      const inCode = editor.isActive("codeBlock");
      const hasTextSel = !empty && selection instanceof TextSelection;
      const focused = editor.isFocused || selectFocused.current;
      if (focused && (hasTextSel || inCode) && !nextSlash) {
        const a = view.coordsAtPos(from);
        const b = view.coordsAtPos(to);
        let top = a.top - 46;
        if (top < 8) top = b.bottom + 10;
        const center = hasTextSel ? (a.left + b.right) / 2 : a.left + 120;
        const left = Math.min(Math.max(center, 190), window.innerWidth - 190);
        setToolbar({ top, left });
      } else {
        setToolbar(null);
      }
    };

    const onBlur = () =>
      setTimeout(() => {
        if (!selectFocused.current) {
          setToolbar(null);
          setSlash(null);
        }
      }, 0);

    editor.on("transaction", update);
    editor.on("focus", update);
    editor.on("blur", onBlur);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      editor.off("transaction", update);
      editor.off("focus", update);
      editor.off("blur", onBlur);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [editor]);

  /* Danh sách lệnh "/" */
  const items = useMemo<SlashItem[]>(
    () => [
      { title: "Văn bản", hint: "Đoạn văn thường", keywords: "text paragraph van ban", icon: <Type className={ic} />, run: (e) => e.chain().focus().setParagraph().run() },
      { title: "Tiêu đề lớn", hint: "H2 – mục chính", keywords: "h2 heading tieu de lon", icon: <Heading2 className={ic} />, run: (e) => e.chain().focus().setNode("heading", { level: 2 }).run() },
      { title: "Tiêu đề nhỏ", hint: "H3 – mục con", keywords: "h3 heading tieu de nho", icon: <Heading3 className={ic} />, run: (e) => e.chain().focus().setNode("heading", { level: 3 }).run() },
      { title: "Danh sách", hint: "Gạch đầu dòng", keywords: "bullet list danh sach", icon: <List className={ic} />, run: (e) => e.chain().focus().toggleBulletList().run() },
      { title: "Danh sách số", hint: "1. 2. 3.", keywords: "number ordered list so", icon: <ListOrdered className={ic} />, run: (e) => e.chain().focus().toggleOrderedList().run() },
      { title: "Việc cần làm", hint: "Checklist có ô tick", keywords: "todo task checklist viec", icon: <ListChecks className={ic} />, run: (e) => e.chain().focus().toggleTaskList().run() },
      { title: "Trích dẫn", hint: "Khối quote", keywords: "quote blockquote trich dan", icon: <Quote className={ic} />, run: (e) => e.chain().focus().toggleBlockquote().run() },
      { title: "Callout", hint: "Khung ghi chú nổi bật", keywords: "callout aside note ghi chu", icon: <Lightbulb className={ic} />, run: (e) => e.chain().focus().wrapIn("aside").run() },
      { title: "Khối code", hint: "Có tô màu cú pháp", keywords: "code block khoi", icon: <Code2 className={ic} />, run: (e) => e.chain().focus().setCodeBlock({ language: "ts" }).run() },
      { title: "Bảng", hint: "Bảng 3×3", keywords: "table bang", icon: <Table2 className={ic} />, run: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
      { title: "Ảnh", hint: "Tải ảnh từ máy", keywords: "image photo anh hinh", icon: <ImagePlus className={ic} />, run: () => fileRef.current?.click() },
      { title: "Đường kẻ", hint: "Ngăn cách nội dung", keywords: "divider hr line duong ke", icon: <Minus className={ic} />, run: (e) => e.chain().focus().setHorizontalRule().run() },
    ],
    [],
  );

  const filtered = useMemo(() => {
    const q = removeDiacritics((slash?.query ?? "").toLowerCase());
    if (!q) return items;
    return items.filter((i) =>
      removeDiacritics(`${i.title} ${i.keywords}`.toLowerCase()).includes(q),
    );
  }, [items, slash?.query]);
  filteredRef.current = filtered;

  runSlashRef.current = (item: SlashItem) => {
    const ed = editorRef.current;
    const s = slashRef.current;
    if (!ed || !s) return;
    ed.chain().focus().deleteRange({ from: s.from, to: s.to }).run();
    setSlash(null);
    item.run(ed);
  };

  /* ───────── Tay nắm kéo khối (giống Notion) ───────── */
  const onMouseMove = (e: React.MouseEvent) => {
    const ed = editorRef.current;
    const wrapper = wrapperRef.current;
    if (!ed || !wrapper) return;
    if ((e.target as HTMLElement).closest("[data-block-handle]")) return;

    const content = ed.view.dom as HTMLElement;
    const r = content.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX, r.left + 4), r.right - 4);
    const found = ed.view.posAtCoords({ left: x, top: e.clientY });
    if (!found) return;

    const $pos = ed.state.doc.resolve(found.pos);
    let blockPos: number;
    if ($pos.depth >= 1) {
      blockPos = $pos.before(1);
    } else if ($pos.nodeAfter) {
      blockPos = found.pos;
    } else {
      return;
    }
    const dom = ed.view.nodeDOM(blockPos);
    if (!(dom instanceof HTMLElement)) return;
    const top = dom.getBoundingClientRect().top - wrapper.getBoundingClientRect().top;
    setHandle((prev) => (prev && prev.pos === blockPos && prev.top === top ? prev : { top, pos: blockPos }));
  };

  const onDragStart = (e: React.DragEvent) => {
    const ed = editorRef.current;
    if (!ed || !handle) return;
    const { view, state } = ed;
    try {
      const sel = NodeSelection.create(state.doc, handle.pos);
      view.dispatch(state.tr.setSelection(sel));
      view.dragging = { slice: sel.content(), move: true };
      e.dataTransfer.effectAllowed = "copyMove";
      e.dataTransfer.setData("text/plain", " ");
      const dom = view.nodeDOM(handle.pos);
      if (dom instanceof HTMLElement) e.dataTransfer.setDragImage(dom, 0, 0);
    } catch {
      e.preventDefault();
    }
  };

  const onDragEnd = () => {
    const ed = editorRef.current;
    if (ed) ed.view.dragging = null;
  };

  const addBlockBelow = () => {
    const ed = editorRef.current;
    if (!ed || !handle) return;
    const node = ed.state.doc.nodeAt(handle.pos);
    if (!node) return;
    const after = handle.pos + node.nodeSize;
    ed.chain()
      .insertContentAt(after, { type: "paragraph", content: [{ type: "text", text: "/" }] })
      .focus(after + 2)
      .run();
  };

  const setLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Dán đường dẫn (để trống để gỡ link)", prev ?? "https://");
    if (url === null) return;
    if (url.trim() === "" || url.trim() === "https://") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
    }
  };

  const fmt: { label: string; icon: React.ReactNode; active: () => boolean; run: () => void }[] = editor
    ? [
        { label: "Đậm", icon: <Bold className={ic} />, active: () => editor.isActive("bold"), run: () => editor.chain().focus().toggleBold().run() },
        { label: "Nghiêng", icon: <Italic className={ic} />, active: () => editor.isActive("italic"), run: () => editor.chain().focus().toggleItalic().run() },
        { label: "Gạch ngang", icon: <Strikethrough className={ic} />, active: () => editor.isActive("strike"), run: () => editor.chain().focus().toggleStrike().run() },
        { label: "Code", icon: <Code className={ic} />, active: () => editor.isActive("code"), run: () => editor.chain().focus().toggleCode().run() },
        { label: "Liên kết", icon: <Link2 className={ic} />, active: () => editor.isActive("link"), run: setLink },
        { label: "Tiêu đề lớn", icon: <Heading2 className={ic} />, active: () => editor.isActive("heading", { level: 2 }), run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
        { label: "Tiêu đề nhỏ", icon: <Heading3 className={ic} />, active: () => editor.isActive("heading", { level: 3 }), run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
        { label: "Danh sách", icon: <List className={ic} />, active: () => editor.isActive("bulletList"), run: () => editor.chain().focus().toggleBulletList().run() },
        { label: "Trích dẫn", icon: <Quote className={ic} />, active: () => editor.isActive("blockquote"), run: () => editor.chain().focus().toggleBlockquote().run() },
      ]
    : [];

  const inCode = editor?.isActive("codeBlock") ?? false;
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  return (
    <div
      ref={wrapperRef}
      className="relative mx-auto max-w-3xl pl-12 pr-2"
      onMouseMove={onMouseMove}
      onMouseLeave={() => setHandle(null)}
    >
      {/* Tay nắm kéo + nút thêm khối */}
      {handle && (
        <div
          data-block-handle
          className="absolute left-0 flex items-center"
          style={{ top: handle.top + 2 }}
        >
          <button
            type="button"
            data-sound="none"
            aria-label="Thêm khối bên dưới"
            title="Thêm khối bên dưới"
            onMouseDown={(e) => e.preventDefault()}
            onClick={addBlockBelow}
            className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Plus className="size-4" />
          </button>
          <div
            draggable
            data-sound="none"
            title="Kéo để di chuyển · bấm để chọn khối"
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={() => editor?.chain().focus().setNodeSelection(handle.pos).run()}
            className="inline-flex size-6 cursor-grab items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
          >
            <GripVertical className="size-4" />
          </div>
        </div>
      )}

      <EditorContent editor={editor} />

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        hidden
        onChange={(e) => {
          void insertImages(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />

      {/* Thanh định dạng nổi khi bôi đen chữ */}
      {portalTarget &&
        toolbar &&
        editor &&
        createPortal(
          <div
            ref={toolbarRef}
            onMouseDown={(e) => {
              if ((e.target as HTMLElement).tagName !== "SELECT") e.preventDefault();
            }}
            className="cmd-dialog fixed z-[150] flex -translate-x-1/2 items-center gap-0.5 rounded-xl border bg-background p-1 shadow-lg"
            style={{ top: toolbar.top, left: toolbar.left }}
          >
            {inCode ? (
              <select
                value={(editor.getAttributes("codeBlock").language as string) ?? ""}
                onFocus={() => (selectFocused.current = true)}
                onBlur={() => (selectFocused.current = false)}
                onChange={(e) =>
                  editor
                    .chain()
                    .focus()
                    .updateAttributes("codeBlock", { language: e.target.value || null })
                    .run()
                }
                className="h-8 rounded-lg bg-background px-2 font-mono text-xs outline-none"
                aria-label="Ngôn ngữ của khối code"
              >
                {LANGS.map((l) => (
                  <option key={l} value={l}>
                    {l || "text"}
                  </option>
                ))}
              </select>
            ) : (
              fmt.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  title={t.label}
                  aria-label={t.label}
                  onClick={t.run}
                  className={`inline-flex size-8 items-center justify-center rounded-lg transition-colors ${
                    t.active()
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {t.icon}
                </button>
              ))
            )}
          </div>,
          portalTarget,
        )}

      {/* Slash menu */}
      {portalTarget &&
        slash &&
        filtered.length > 0 &&
        createPortal(
          <div
            onMouseDown={(e) => e.preventDefault()}
            className="cmd-dialog fixed z-[150] max-h-72 w-64 overflow-y-auto rounded-xl border bg-background p-1.5 shadow-lg"
            style={{
              top: Math.min(slash.top, window.innerHeight - 300),
              left: Math.min(slash.left, window.innerWidth - 270),
            }}
          >
            <p className="px-2 pb-1 pt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Chèn khối
            </p>
            {filtered.map((item, i) => (
              <button
                key={item.title}
                type="button"
                data-sound="none"
                onMouseEnter={() => setSlashIndex(i)}
                onClick={() => runSlashRef.current(item)}
                className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left ${
                  i === Math.min(slashIndex, filtered.length - 1) ? "bg-muted" : ""
                }`}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground">
                  {item.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm">{item.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{item.hint}</span>
                </span>
              </button>
            ))}
          </div>,
          portalTarget,
        )}
    </div>
  );
}
