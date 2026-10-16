import "server-only";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeShiki from "@shikijs/rehype";
import rehypeStringify from "rehype-stringify";
import {
  transformerNotationFocus,
  transformerNotationHighlight,
} from "@shikijs/transformers";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSlug)
  .use(rehypeShiki, {
    themes: { light: "github-light", dark: "github-dark-default" },
    defaultColor: false,
    fallbackLanguage: "text",
    transformers: [
      transformerNotationHighlight(),
      transformerNotationFocus(),
      {
        name: "code-lang",
        pre(node) {
          node.properties["data-lang"] = this.options.lang;
        },
      },
    ],
  })
  .use(rehypeStringify);

/** Markdown -> HTML (có tô màu code). Dùng chung cho trang bài viết và bản xem trước trong editor. */
export async function renderMarkdown(source: string): Promise<string> {
  const file = await processor.process(source);
  return String(file);
}

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

/** Lấy mục lục từ HTML đã render (h2/h3 có id do rehype-slug tạo). */
export function extractToc(html: string): TocItem[] {
  const items: TocItem[] = [];
  const re = /<h([23])\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const text = m[3].replace(/<[^>]+>/g, "").trim();
    if (text) items.push({ level: Number(m[1]) as 2 | 3, id: m[2], text });
  }
  return items;
}

export function readingMinutes(markdown: string): number {
  const words = markdown.replace(/```[\s\S]*?```/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
