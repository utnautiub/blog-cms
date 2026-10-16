"use client";

import { useEffect } from "react";

import { playSound, type SoundName } from "@/lib/sound";

const INTERACTIVE =
  'a[href], button, [role="button"], [role="menuitem"], summary, select, label[for], input[type="checkbox"], input[type="radio"], [data-sound]';

/** Phát âm thanh nhẹ khi bấm vào link, nút... trên toàn site. Dùng data-sound="toggle|open|success|error|none" để chọn âm riêng. */
export function SoundProvider() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>(INTERACTIVE);
      if (!el) return;
      if ((el as HTMLButtonElement).disabled || el.getAttribute("aria-disabled") === "true") return;
      const kind = el.dataset.sound;
      if (kind === "none") return;
      playSound((kind as SoundName) || "click");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
