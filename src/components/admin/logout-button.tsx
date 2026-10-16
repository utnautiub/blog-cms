"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/admin/logout/", { method: "POST" });
        // Tải lại hẳn trang chủ để xoá sạch cache của router
        window.location.assign("/");
      }}
      className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
    >
      <LogOut className="size-4" /> {busy ? "Đang thoát…" : "Đăng xuất"}
    </button>
  );
}
