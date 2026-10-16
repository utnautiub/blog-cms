"use client";

import { useEffect, useState } from "react";

import type { TocItem } from "@/lib/markdown";

export function Toc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const els = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px" },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  return (
    <nav
      aria-label="Mục lục"
      className="fixed top-24 hidden max-h-[calc(100vh-8rem)] w-56 overflow-y-auto text-sm xl:block"
      style={{ left: "calc(50% + 25rem)" }}
    >
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Mục lục
      </p>
      <ul className="space-y-1.5 border-l">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`-ml-px block border-l py-0.5 transition-colors ${
                item.level === 3 ? "pl-6" : "pl-3"
              } ${
                active === item.id
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
