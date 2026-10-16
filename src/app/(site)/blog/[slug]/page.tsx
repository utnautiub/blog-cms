import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { PatternSeparator } from "@/components/pattern-separator";
import { PostBody } from "@/components/post-body";
import { Toc } from "@/components/toc";
import { AUTHOR_NAME, SITE_URL, TWITTER_HANDLE } from "@/config/site";
import { extractToc, readingMinutes, renderMarkdown } from "@/lib/markdown";
import { getAllPosts, getPostBySlug, getSurroundingPosts } from "@/lib/posts";
import { formatDate } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const month = formatDate(post.date, { month: "long", day: undefined, year: undefined });
  const image = `${SITE_URL}og/blog/?title=${encodeURIComponent(post.title)}&top=${encodeURIComponent(month)}`;

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${slug}/` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: `${SITE_URL}blog/${slug}/`,
      publishedTime: new Date(post.date).toISOString(),
      images: [{ url: image }],
    },
    twitter: {
      title: post.title,
      description: post.description,
      card: "summary_large_image",
      creator: TWITTER_HANDLE || undefined,
      images: [image],
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const html = await renderMarkdown(post.body);
  const toc = extractToc(html);
  const { newer, older } = getSurroundingPosts(slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: new Date(post.date).toISOString(),
    url: `${SITE_URL}blog/${slug}/`,
    author: { "@type": "Person", name: AUTHOR_NAME },
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Toc items={toc} />

      <header className="space-y-4 px-4 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Tất cả bài viết
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{post.title}</h1>
        {post.description && <p className="text-muted-foreground">{post.description}</p>}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
          <time>{formatDate(post.date)}</time>
          <span>·</span>
          <span>{readingMinutes(post.body)} phút đọc</span>
          {post.tags.map((t) => (
            <span key={t} className="rounded-md border px-1.5 py-0.5">
              {t}
            </span>
          ))}
        </div>
      </header>

      <PatternSeparator className="h-6" />

      <PostBody html={html} className="px-4 py-10" />

      <PatternSeparator className="h-6" />

      <nav className="grid sm:grid-cols-2" aria-label="Bài viết liền kề">
        {newer ? (
          <Link
            href={`/blog/${newer.slug}/`}
            className="group flex flex-col gap-1 px-4 py-6 transition-colors hover:bg-muted/50 sm:border-r"
          >
            <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              <ArrowLeft className="size-3" /> Bài mới hơn
            </span>
            <span className="font-medium tracking-tight">{newer.title}</span>
          </Link>
        ) : (
          <div className="sm:border-r" />
        )}
        {older ? (
          <Link
            href={`/blog/${older.slug}/`}
            className="group flex flex-col gap-1 px-4 py-6 transition-colors hover:bg-muted/50 sm:items-end sm:text-right"
          >
            <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              Bài cũ hơn <ArrowRight className="size-3" />
            </span>
            <span className="font-medium tracking-tight">{older.title}</span>
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </article>
  );
}
