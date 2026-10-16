import "server-only";
import fs from "fs";
import path from "path";

import { parsePost, type Post, type PostMeta } from "@/lib/post-format";
import { SLUG_REGEX } from "@/lib/utils";

export const POSTS_DIR = path.join(process.cwd(), "content", "posts");

const sortByDateDesc = <T extends { date: string }>(items: T[]) =>
  items.sort((a, b) => b.date.localeCompare(a.date));

/** Đọc toàn bộ bài từ thư mục content/posts (dùng cho phần public của site). */
export function getAllPosts(): Post[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const posts = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      return parsePost(slug, fs.readFileSync(path.join(POSTS_DIR, file), "utf-8"));
    })
    .filter((p) => !p.draft);
  return sortByDateDesc(posts);
}

export function getPostMetas(): PostMeta[] {
  return getAllPosts().map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    date: p.date,
    tags: p.tags,
    draft: p.draft,
  }));
}

export function getPostBySlug(slug: string): Post | null {
  if (!SLUG_REGEX.test(slug)) return null;
  const file = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const post = parsePost(slug, fs.readFileSync(file, "utf-8"));
  return post.draft ? null : post;
}

export function getSurroundingPosts(slug: string) {
  const posts = getAllPosts();
  const i = posts.findIndex((p) => p.slug === slug);
  if (i === -1) return { newer: null, older: null };
  return {
    newer: posts[i - 1] ?? null,
    older: posts[i + 1] ?? null,
  };
}
