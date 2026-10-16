import matter from "gray-matter";

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  /** yyyy-mm-dd */
  date: string;
  tags: string[];
  draft: boolean;
}

export interface Post extends PostMeta {
  body: string;
}

const toDateString = (value: unknown): string => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string" && value.trim()) return value.trim().slice(0, 10);
  return "1970-01-01";
};

/** Đọc nội dung file .md (có frontmatter) thành object Post. */
export function parsePost(slug: string, raw: string): Post {
  const { data, content } = matter(raw);
  const tags = Array.isArray(data.tags)
    ? data.tags.map((t: unknown) => String(t).trim()).filter(Boolean)
    : [];
  return {
    slug,
    title: String(data.title ?? slug),
    description: String(data.description ?? ""),
    date: toDateString(data.date),
    tags,
    draft: data.draft === true,
    body: content.trim(),
  };
}

/** Ghi Post thành nội dung file .md. Viết tay phần frontmatter để file gọn, dễ đọc. */
export function serializePost(
  meta: Omit<PostMeta, "slug">,
  body: string,
): string {
  const q = (s: string) => JSON.stringify(s); // chuỗi JSON cũng là chuỗi YAML hợp lệ
  const lines = [
    "---",
    `title: ${q(meta.title)}`,
    `description: ${q(meta.description)}`,
    `date: ${meta.date}`,
    `tags: [${meta.tags.map(q).join(", ")}]`,
    ...(meta.draft ? ["draft: true"] : []),
    "---",
    "",
    body.trim(),
    "",
  ];
  return lines.join("\n");
}
