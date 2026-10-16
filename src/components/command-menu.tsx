"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { FileText, Moon, PenLine, Rss, Search, Sun } from "lucide-react";

import { removeDiacritics } from "@/lib/utils";

export interface CommandPost {
  slug: string;
  title: string;
  date: string;
  tags: string[];
}

interface Item {
  id: string;
  label: string;
  hint?: string;
  group: "Bài viết" | "Tác vụ";
  icon: React.ReactNode;
  run: () => void;
}

export function CommandMenu({ posts }: { posts: CommandPost[] }) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const items = useMemo<Item[]>(() => {
    const postItems: Item[] = posts.map((p) => ({
      id: `post-${p.slug}`,
      label: p.title,
      hint: p.tags.join(" · "),
      group: "Bài viết",
      icon: <FileText className="size-4" />,
      run: () => go(`/blog/${p.slug}/`),
    }));
    const actions: Item[] = [
      {
        id: "theme",
        label: resolvedTheme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối",
        group: "Tác vụ",
        icon: resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />,
        run: () => {
          setTheme(resolvedTheme === "dark" ? "light" : "dark");
          setOpen(false);
        },
      },
      {
        id: "rss",
        label: "Đăng ký RSS",
        group: "Tác vụ",
        icon: <Rss className="size-4" />,
        run: () => {
          setOpen(false);
          window.open("/rss.xml", "_blank");
        },
      },
      {
        id: "admin",
        label: "Viết bài mới",
        group: "Tác vụ",
        icon: <PenLine className="size-4" />,
        run: () => go("/admin/new/"),
      },
    ];
    return [...postItems, ...actions];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, resolvedTheme]);

  const filtered = useMemo(() => {
    const q = removeDiacritics(query.trim().toLowerCase());
    if (!q) return items;
    return items.filter((i) =>
      removeDiacritics(`${i.label} ${i.hint ?? ""}`.toLowerCase()).includes(q),
    );
  }, [items, query]);

  useEffect(() => setActive(0), [query]);

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[active]?.run();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-sound="open"
        className="inline-flex h-9 items-center gap-2 rounded-lg border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Tìm kiếm</span>
        <kbd className="hidden rounded border bg-muted px-1.5 font-mono text-[10px] sm:inline">
          ⌘K
        </kbd>
      </button>

      {open &&
        createPortal(
        <div
          className="cmd-overlay fixed inset-0 z-[100] flex items-start justify-center bg-black/40 px-4 pt-[15vh] backdrop-blur-sm"
          onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Command menu"
            className="cmd-dialog w-full max-w-lg overflow-hidden rounded-xl border bg-background shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b px-4">
              <Search className="size-4 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Tìm bài viết hoặc tác vụ…"
                className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <ul className="max-h-80 overflow-y-auto p-2">
              {filtered.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Không tìm thấy kết quả.
                </li>
              )}
              {filtered.map((item, i) => {
                const showGroup = i === 0 || filtered[i - 1].group !== item.group;
                return (
                  <li key={item.id}>
                    {showGroup && (
                      <p className="px-3 pb-1 pt-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        {item.group}
                      </p>
                    )}
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={item.run}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                        i === active ? "bg-muted" : ""
                      }`}
                    >
                      <span className="text-muted-foreground">{item.icon}</span>
                      <span className="line-clamp-1 flex-1">{item.label}</span>
                      {item.hint && (
                        <span className="hidden text-xs text-muted-foreground sm:inline">
                          {item.hint}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
