import Link from "next/link";
import { ExternalLink, Pencil, Plus } from "lucide-react";

import { DeleteButton } from "@/components/admin/delete-button";
import { LoginForm } from "@/components/admin/login-form";
import { LogoutButton } from "@/components/admin/logout-button";
import { SoundToggle } from "@/components/sound-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { isAdmin, isAdminConfigured } from "@/lib/auth";
import { isGithubMode, listAllPosts } from "@/lib/storage";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  if (!isAdminConfigured()) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <h1 className="text-xl font-semibold">Chưa cấu hình mật khẩu</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Thêm biến môi trường <code className="font-mono">ADMIN_PASSWORD</code> (và{" "}
          <code className="font-mono">SESSION_SECRET</code>) vào file{" "}
          <code className="font-mono">.env.local</code> hoặc phần Environment Variables của
          Vercel, rồi chạy lại. Xem README để biết chi tiết.
        </p>
      </div>
    );
  }

  if (!(await isAdmin())) return <LoginForm />;

  let posts: Awaited<ReturnType<typeof listAllPosts>> = [];
  let error = "";
  try {
    posts = await listAllPosts();
  } catch (e) {
    error = e instanceof Error ? e.message : "Không đọc được danh sách bài";
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quản lý bài viết</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isGithubMode
              ? "Chế độ GitHub: đăng bài = commit vào repo, site tự cập nhật sau ~1 phút."
              : "Chế độ local: bài được lưu thẳng vào thư mục content/posts."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/new/"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-3 text-sm font-medium text-background"
          >
            <Plus className="size-4" /> Bài mới
          </Link>
          <Link
            href="/"
            className="inline-flex h-9 items-center rounded-lg border px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Xem site
          </Link>
          <LogoutButton />
          <SoundToggle />
          <ThemeToggle />
        </div>
      </div>

      {error && (
        <p className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border">
        {posts.length === 0 && !error && (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Chưa có bài nào. Bấm &ldquo;Bài mới&rdquo; để bắt đầu.
          </p>
        )}
        {posts.map((post) => (
          <div
            key={post.slug}
            className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0"
          >
            <div className="min-w-0 flex-1">
              <Link
                href={`/admin/edit/${post.slug}/`}
                className="line-clamp-1 font-medium hover:underline"
              >
                {post.title}
              </Link>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {formatDate(post.date)} · /{post.slug}
              </p>
            </div>
            <span
              className={`rounded-md border px-2 py-0.5 font-mono text-[11px] ${
                post.draft ? "text-amber-500" : "text-emerald-500"
              }`}
            >
              {post.draft ? "Nháp" : "Đã đăng"}
            </span>
            <Link
              href={`/admin/edit/${post.slug}/`}
              aria-label="Sửa"
              className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Pencil className="size-4" />
            </Link>
            {!post.draft && (
              <a
                href={`/blog/${post.slug}/`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Xem bài"
                className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ExternalLink className="size-4" />
              </a>
            )}
            <DeleteButton slug={post.slug} />
          </div>
        ))}
      </div>
    </div>
  );
}
