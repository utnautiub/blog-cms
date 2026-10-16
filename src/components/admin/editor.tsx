"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  Bold,
  Code,
  Code2,
  ExternalLink,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  Quote,
} from "lucide-react";

import { DeleteButton } from "@/components/admin/delete-button";
import { DatePicker } from "@/components/ui/date-picker";
import { PostBody } from "@/components/post-body";
import { blobUrls } from "@/lib/blob-urls";
import { playSound } from "@/lib/sound";
import { SLUG_REGEX, slugify } from "@/lib/utils";

export interface EditorInitial {
  slug: string | null;
  title: string;
  description: string;
  date: string;
  tags: string;
  draft: boolean;
  body: string;
}

const RichEditor = dynamic(
  () => import("@/components/admin/rich-editor").then((m) => m.RichEditor),
  {
    ssr: false,
    loading: () => (
      <p className="py-20 text-center text-sm text-muted-foreground">Đang tải trình soạn…</p>
    ),
  },
);

const inputCls =
  "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";

export function Editor({
  initial,
  githubMode,
}: {
  initial: EditorInitial;
  githubMode: boolean;
}) {
  const isNew = initial.slug === null;

  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [description, setDescription] = useState(initial.description);
  const [date, setDate] = useState(initial.date);
  const [tags, setTags] = useState(initial.tags);
  const [draft, setDraft] = useState(initial.draft);
  const [body, setBody] = useState(initial.body);

  const [originalSlug, setOriginalSlug] = useState<string | null>(initial.slug);
  const [html, setHtml] = useState("");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [mode, setMode] = useState<"rich" | "source">("rich");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const snapshot = (over: Partial<Record<string, unknown>> = {}) =>
    JSON.stringify({ title, slug, description, date, tags, draft, body, ...over });
  const [saved, setSaved] = useState(() => snapshot());
  const dirty = snapshot() !== saved;

  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Tự sinh slug từ tiêu đề cho bài mới
  useEffect(() => {
    if (isNew && !slugTouched) setSlug(slugify(title));
  }, [title, isNew, slugTouched]);

  // Xem trước (debounce)
  useEffect(() => {
    if (mode !== "source") return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/admin/preview/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markdown: body }),
        });
        const data = await res.json();
        if (!cancelled && res.ok) setHtml(data.html);
      } catch {
        /* bỏ qua lỗi mạng tạm thời */
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [body, mode]);

  // Âm thanh phản hồi khi lưu thành công / có lỗi
  useEffect(() => {
    if (error) playSound("error");
  }, [error]);
  useEffect(() => {
    if (message) playSound("success");
  }, [message]);

  // Cảnh báo khi rời trang mà chưa lưu
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const previewHtml = useMemo(
    () =>
      html.replace(/src="(\/uploads\/[^"]+)"/g, (m, url: string) =>
        blobUrls[url] ? `src="${blobUrls[url]}"` : m,
      ),
    [html],
  );

  // ---------- Lưu ----------
  const save = useCallback(
    async (asDraft: boolean) => {
      setError("");
      setMessage("");
      const finalSlug = slug.trim() || slugify(title);
      if (!title.trim()) return setError("Hãy nhập tiêu đề.");
      if (!SLUG_REGEX.test(finalSlug))
        return setError("Slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang.");

      setSaving(true);
      try {
        const res = await fetch("/api/admin/posts/", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            originalSlug,
            slug: finalSlug,
            meta: {
              title,
              description,
              date,
              tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
              draft: asDraft,
            },
            body,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return setError(data.error ?? "Lưu thất bại");

        setSlug(finalSlug);
        setDraft(asDraft);
        setSaved(snapshot({ slug: finalSlug, draft: asDraft }));
        if (originalSlug !== finalSlug) {
          setOriginalSlug(finalSlug);
          window.history.replaceState(null, "", `/admin/edit/${finalSlug}/`);
        }
        setMessage(
          asDraft
            ? "Đã lưu nháp."
            : githubMode
              ? "Đã đăng! Vercel đang deploy, bài sẽ lên site sau khoảng 1 phút."
              : "Đã đăng!",
        );
      } finally {
        setSaving(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slug, title, description, date, tags, body, originalSlug, githubMode],
  );

  const saveRef = useRef(save);
  saveRef.current = save;
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current(draftRef.current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---------- Chỉnh sửa văn bản ----------
  const setTextAndSelect = (text: string, start: number, end: number) => {
    const top = taRef.current?.scrollTop ?? 0;
    setBody(text);
    requestAnimationFrame(() => {
      const ta = taRef.current;
      if (!ta) return;
      ta.focus({ preventScroll: true });
      ta.setSelectionRange(start, end);
      ta.scrollTop = top; // giữ nguyên vị trí cuộn, không nhảy xuống cuối
    });
  };

  const wrap = (before: string, after: string, placeholder: string) => {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const selected = body.slice(s, e) || placeholder;
    setTextAndSelect(
      body.slice(0, s) + before + selected + after + body.slice(e),
      s + before.length,
      s + before.length + selected.length,
    );
  };

  const prefixLines = (prefix: string) => {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const lineStart = body.lastIndexOf("\n", s - 1) + 1;
    const block = body.slice(lineStart, e);
    const next = block
      .split("\n")
      .map((l) => prefix + l)
      .join("\n");
    setTextAndSelect(body.slice(0, lineStart) + next + body.slice(e), lineStart + prefix.length, lineStart + next.length);
  };

  const insertAtCursor = (text: string) => {
    const ta = taRef.current;
    const pos = ta ? ta.selectionStart : body.length;
    const end = ta ? ta.selectionEnd : body.length;
    const next = body.slice(0, pos) + text + body.slice(end);
    setTextAndSelect(next, pos + text.length, pos + text.length);
  };

  const insertCodeBlock = () => {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const selected = body.slice(s, e) || "code";
    const before = "\n```ts\n";
    setTextAndSelect(
      body.slice(0, s) + before + selected + "\n```\n" + body.slice(e),
      s + before.length,
      s + before.length + selected.length,
    );
  };

  // ---------- Upload ảnh ----------
  async function uploadOne(file: File): Promise<string | null> {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload/", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Upload ảnh thất bại");
        return null;
      }
      blobUrls[data.url] = URL.createObjectURL(file);
      return data.url as string;
    } finally {
      setUploading(false);
    }
  }

  async function uploadFiles(files: File[]) {
    let md = "";
    for (const file of files.filter((f) => f.type.startsWith("image/"))) {
      const url = await uploadOne(file);
      if (!url) continue;
      const alt = file.name.replace(/\.[^.]+$/, "").replace(/[[\]]/g, "");
      md += `\n![${alt}](${url})\n`;
    }
    if (md) insertAtCursor(md);
  }

  const onPaste = (e: React.ClipboardEvent) => {
    const files = Array.from(e.clipboardData.files);
    if (files.some((f) => f.type.startsWith("image/"))) {
      e.preventDefault();
      uploadFiles(files);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    const files = Array.from(e.dataTransfer.files);
    if (files.some((f) => f.type.startsWith("image/"))) {
      e.preventDefault();
      uploadFiles(files);
    }
  };

  const onEditorScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    const pv = previewRef.current;
    const max = ta.scrollHeight - ta.clientHeight;
    if (!pv || max <= 0) return;
    pv.scrollTop = (ta.scrollTop / max) * (pv.scrollHeight - pv.clientHeight);
  };

  const onTextareaKey = (e: React.KeyboardEvent) => {
    if (!(e.metaKey || e.ctrlKey)) return;
    const k = e.key.toLowerCase();
    if (k === "b") {
      e.preventDefault();
      wrap("**", "**", "chữ đậm");
    } else if (k === "i") {
      e.preventDefault();
      wrap("*", "*", "chữ nghiêng");
    } else if (k === "k") {
      e.preventDefault();
      wrap("[", "](https://)", "văn bản");
    }
  };

  const tools: { label: string; icon: React.ReactNode; run: () => void }[] = [
    { label: "Đậm (Ctrl+B)", icon: <Bold className="size-4" />, run: () => wrap("**", "**", "chữ đậm") },
    { label: "Nghiêng (Ctrl+I)", icon: <Italic className="size-4" />, run: () => wrap("*", "*", "chữ nghiêng") },
    { label: "Tiêu đề lớn", icon: <Heading2 className="size-4" />, run: () => prefixLines("## ") },
    { label: "Tiêu đề nhỏ", icon: <Heading3 className="size-4" />, run: () => prefixLines("### ") },
    { label: "Liên kết (Ctrl+K)", icon: <Link2 className="size-4" />, run: () => wrap("[", "](https://)", "văn bản") },
    { label: "Code trong dòng", icon: <Code className="size-4" />, run: () => wrap("`", "`", "code") },
    { label: "Khối code", icon: <Code2 className="size-4" />, run: insertCodeBlock },
    { label: "Trích dẫn", icon: <Quote className="size-4" />, run: () => prefixLines("> ") },
    { label: "Danh sách", icon: <List className="size-4" />, run: () => prefixLines("- ") },
  ];

  const status = saving
    ? "Đang lưu…"
    : dirty
      ? "Chưa lưu thay đổi"
      : originalSlug
        ? draft
          ? "Nháp"
          : "Đã đăng"
        : "";

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10">
      {/* Thanh trên */}
      <div className="sticky top-0 z-30 -mx-4 mb-6 flex flex-wrap items-center gap-2 border-b bg-background/90 px-4 py-3 backdrop-blur-md">
        <Link
          href="/admin/"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Danh sách
        </Link>
        <span className="font-mono text-xs text-muted-foreground">{status}</span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {originalSlug && !draft && (
            <a
              href={`/blog/${originalSlug}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ExternalLink className="size-4" /> Xem bài
            </a>
          )}
          {originalSlug && <DeleteButton slug={originalSlug} redirectTo="/admin/" label />}
          <button
            type="button"
            disabled={saving}
            onClick={() => save(true)}
            className="h-9 rounded-lg border px-3 text-sm transition-colors hover:bg-muted disabled:opacity-50"
          >
            Lưu nháp
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => save(false)}
            className="h-9 rounded-lg bg-foreground px-4 text-sm font-medium text-background disabled:opacity-50"
          >
            {draft || !originalSlug ? "Đăng bài" : "Cập nhật"}
          </button>
        </div>
      </div>

      {(message || error) && (
        <p
          className={`mb-4 rounded-lg border px-4 py-2.5 text-sm ${
            error
              ? "border-red-500/40 bg-red-500/10 text-red-500"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {error || message}
        </p>
      )}

      {/* Thông tin bài */}
      <div className="mb-6 space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tiêu đề bài viết"
          className="w-full bg-transparent text-3xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/50"
        />
        <div className="grid gap-3 md:grid-cols-[1fr_11rem_1fr]">
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Slug (đường dẫn)
            </label>
            <input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="duong-dan-bai-viet"
              className={`${inputCls} font-mono`}
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Ngày đăng
            </label>
            <DatePicker value={date} onChange={setDate} />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Tags (cách nhau bằng dấu phẩy)
            </label>
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="docker, devops" className={inputCls} />
          </div>
        </div>
        <div>
          <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Mô tả ngắn
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Hiện ở trang chủ và khi chia sẻ link"
            className={inputCls}
          />
        </div>
      </div>

      {/* Chọn chế độ soạn */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border p-0.5">
          {(
            [
              ["rich", "Trực quan"],
              ["source", "Markdown"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-md px-3 py-1 text-sm transition-colors ${
                mode === m ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="hidden font-mono text-[11px] text-muted-foreground md:inline">
          {mode === "rich"
            ? uploading
              ? "Đang tải ảnh…"
              : "Gõ / để chèn khối · bôi đen chữ để định dạng · kéo ⋮⋮ để đổi vị trí · Ctrl+S để lưu"
            : "Chế độ Markdown thô"}
        </span>
      </div>

      {mode === "rich" ? (
        <div className="rounded-xl border bg-background px-4 py-8 sm:px-6">
          <RichEditor
            key="rich"
            initialMarkdown={body}
            onChange={setBody}
            onUpload={uploadOne}
          />
        </div>
      ) : (
      <>
      {/* Toolbar */}
      <div className="mb-2 flex flex-wrap items-center gap-1 rounded-xl border bg-card p-1.5">
        {tools.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.label}
            aria-label={t.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={t.run}
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {t.icon}
          </button>
        ))}
        <button
          type="button"
          title="Chèn ảnh"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <ImagePlus className="size-4" /> {uploading ? "Đang tải…" : "Ảnh"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          hidden
          onChange={(e) => {
            uploadFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        <span className="ml-auto hidden px-2 font-mono text-[11px] text-muted-foreground md:inline">
          Dán hoặc kéo thả ảnh vào khung soạn · Ctrl+S để lưu
        </span>

        {/* Chuyển tab trên mobile */}
        <div className="ml-auto flex rounded-lg border p-0.5 lg:hidden">
          {(["write", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1 text-xs ${tab === t ? "bg-foreground text-background" : "text-muted-foreground"}`}
            >
              {t === "write" ? "Soạn" : "Xem trước"}
            </button>
          ))}
        </div>
      </div>

      {/* Soạn + xem trước */}
      <div className="grid gap-4 lg:grid-cols-2">
        <textarea
          ref={taRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onPaste={onPaste}
          onDrop={onDrop}
          onKeyDown={onTextareaKey}
          onScroll={onEditorScroll}
          spellCheck={false}
          placeholder="Viết Markdown ở đây…"
          className={`editor-textarea h-[70vh] w-full resize-none rounded-xl border bg-background p-4 font-mono text-sm leading-relaxed outline-none focus:ring-2 focus:ring-ring ${
            tab === "write" ? "block" : "hidden lg:block"
          }`}
        />
        <div
          ref={previewRef}
          className={`h-[70vh] overflow-y-auto rounded-xl border bg-background p-6 ${
            tab === "preview" ? "block" : "hidden lg:block"
          }`}
        >
          {title && (
            <h1 className="mb-6 text-3xl font-semibold tracking-tight">{title}</h1>
          )}
          {previewHtml ? (
            <PostBody html={previewHtml} />
          ) : (
            <p className="text-sm text-muted-foreground">Bản xem trước sẽ hiện ở đây.</p>
          )}
        </div>
      </div>
      </>
      )}
    </div>
  );
}
