"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Đăng nhập thất bại");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4">
      <div className="space-y-1">
        <div className="mb-3 flex size-10 items-center justify-center rounded-xl border bg-muted">
          <Lock className="size-4" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Đăng nhập quản trị</h1>
        <p className="text-sm text-muted-foreground">Nhập mật khẩu để soạn và đăng bài.</p>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mật khẩu"
          className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password}
          className="h-10 w-full rounded-lg bg-foreground text-sm font-medium text-background transition-opacity disabled:opacity-50"
        >
          {loading ? "Đang kiểm tra…" : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
