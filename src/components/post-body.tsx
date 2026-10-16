"use client";

import { useEffect, useRef } from "react";

/** Hiển thị HTML đã render từ Markdown + gắn nút "Sao chép" và nhãn ngôn ngữ cho từng khối code. */
export function PostBody({ html, className = "" }: { html: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    root.querySelectorAll<HTMLPreElement>("pre.shiki").forEach((pre) => {
      if (pre.parentElement?.classList.contains("code-block")) return;

      const wrapper = document.createElement("div");
      wrapper.className = "code-block";
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      const lang = pre.getAttribute("data-lang");
      if (lang && lang !== "text") {
        const label = document.createElement("span");
        label.className = "code-lang";
        label.textContent = lang;
        wrapper.appendChild(label);
      }

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "copy-btn";
      btn.textContent = "Sao chép";
      btn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(pre.innerText);
          btn.textContent = "Đã chép ✓";
        } catch {
          btn.textContent = "Lỗi";
        }
        setTimeout(() => (btn.textContent = "Sao chép"), 1500);
      });
      wrapper.appendChild(btn);
    });
  }, [html]);

  return (
    <div
      ref={ref}
      className={`post-body prose prose-neutral max-w-none dark:prose-invert ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
