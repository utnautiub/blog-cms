"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteButton({
  slug,
  redirectTo,
  label = false,
}: {
  slug: string;
  redirectTo?: string;
  label?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm(`Xoá bài "${slug}"? Không thể hoàn tác (trừ khi khôi phục từ lịch sử Git).`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/posts/?slug=${encodeURIComponent(slug)}`, {
      method: "DELETE",
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Xoá thất bại");
      return;
    }
    if (redirectTo) router.push(redirectTo);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={busy}
      aria-label="Xoá bài"
      className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-red-500 disabled:opacity-50"
    >
      <Trash2 className="size-4" />
      {label && "Xoá"}
    </button>
  );
}
