import "server-only";
import fs from "fs/promises";
import path from "path";

import { parsePost, type Post } from "@/lib/post-format";

/**
 * Lớp lưu trữ cho trang quản trị.
 * - Có GITHUB_TOKEN + GITHUB_REPO  -> đọc/ghi qua GitHub API (commit vào repo, Vercel tự deploy lại).
 * - Không có                       -> đọc/ghi thẳng vào thư mục dự án (dùng khi chạy local).
 */
const TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPO;
const BRANCH = process.env.GITHUB_BRANCH || "main";

export const isGithubMode = Boolean(TOKEN && REPO);

const POSTS_PATH = "content/posts";
const UPLOADS_PATH = "public/uploads";

// ---------- GitHub helpers ----------
async function gh(apiPath: string, init: RequestInit = {}) {
  return fetch(`https://api.github.com/repos/${REPO}/${apiPath}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers ?? {}),
    },
  });
}

async function ghError(res: Response, action: string): Promise<Error> {
  let detail = "";
  try {
    detail = ((await res.json()) as { message?: string }).message ?? "";
  } catch {
    /* ignore */
  }
  return new Error(`GitHub: ${action} thất bại (${res.status}) ${detail}`.trim());
}

async function ghGetSha(filePath: string): Promise<string | undefined> {
  const res = await gh(`contents/${filePath}?ref=${BRANCH}`);
  if (res.status === 404) return undefined;
  if (!res.ok) throw await ghError(res, "đọc file");
  const data = (await res.json()) as { sha: string };
  return data.sha;
}

async function ghPut(filePath: string, content: Buffer, message: string) {
  const sha = await ghGetSha(filePath);
  const res = await gh(`contents/${filePath}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: content.toString("base64"),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) throw await ghError(res, "ghi file");
}

async function ghDelete(filePath: string, message: string) {
  const sha = await ghGetSha(filePath);
  if (!sha) return;
  const res = await gh(`contents/${filePath}`, {
    method: "DELETE",
    body: JSON.stringify({ message, sha, branch: BRANCH }),
  });
  if (!res.ok) throw await ghError(res, "xoá file");
}

async function ghReadText(filePath: string): Promise<string | null> {
  const res = await gh(`contents/${filePath}?ref=${BRANCH}`, {
    headers: { Accept: "application/vnd.github.raw+json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw await ghError(res, "đọc file");
  return res.text();
}

// ---------- Public API ----------
const localPath = (p: string) => path.join(process.cwd(), p);

/** Danh sách tất cả bài (kể cả nháp) – dùng cho trang quản trị. */
export async function listAllPosts(): Promise<Post[]> {
  let slugs: string[] = [];

  if (isGithubMode) {
    const res = await gh(`contents/${POSTS_PATH}?ref=${BRANCH}`);
    if (res.status === 404) return [];
    if (!res.ok) throw await ghError(res, "liệt kê bài");
    const items = (await res.json()) as { name: string }[];
    slugs = items.filter((i) => i.name.endsWith(".md")).map((i) => i.name.slice(0, -3));
  } else {
    try {
      const files = await fs.readdir(localPath(POSTS_PATH));
      slugs = files.filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3));
    } catch {
      return [];
    }
  }

  const posts = await Promise.all(slugs.map((s) => readPost(s)));
  return posts
    .filter((p): p is Post => p !== null)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function readPost(slug: string): Promise<Post | null> {
  const file = `${POSTS_PATH}/${slug}.md`;
  if (isGithubMode) {
    const raw = await ghReadText(file);
    return raw === null ? null : parsePost(slug, raw);
  }
  try {
    return parsePost(slug, await fs.readFile(localPath(file), "utf-8"));
  } catch {
    return null;
  }
}

export async function writePost(slug: string, raw: string, message: string) {
  const file = `${POSTS_PATH}/${slug}.md`;
  if (isGithubMode) return ghPut(file, Buffer.from(raw, "utf-8"), message);
  await fs.mkdir(localPath(POSTS_PATH), { recursive: true });
  await fs.writeFile(localPath(file), raw, "utf-8");
}

export async function removePost(slug: string, message: string) {
  const file = `${POSTS_PATH}/${slug}.md`;
  if (isGithubMode) return ghDelete(file, message);
  await fs.rm(localPath(file), { force: true });
}

/** Lưu ảnh upload, trả về URL công khai (/uploads/...). */
export async function writeUpload(fileName: string, data: Buffer): Promise<string> {
  const rel = `${UPLOADS_PATH}/${fileName}`;
  if (isGithubMode) {
    await ghPut(rel, data, `chore: upload ${fileName}`);
  } else {
    await fs.mkdir(path.dirname(localPath(rel)), { recursive: true });
    await fs.writeFile(localPath(rel), data);
  }
  return `/uploads/${fileName}`;
}
