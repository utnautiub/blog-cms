import type { Metadata } from "next";
import Link from "next/link";
import { Github, Linkedin, Rss } from "lucide-react";

import { PatternSeparator } from "@/components/pattern-separator";
import {
  AUTHOR_IMAGE_URL,
  AUTHOR_NAME,
  GITHUB_URL,
  LINKEDIN_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/config/site";
import { getAllPosts } from "@/lib/posts";
import { formatDate } from "@/lib/utils";

const defaultTitle = `${SITE_NAME} — Góc viết của ${AUTHOR_NAME}`;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  title: defaultTitle,
  description: SITE_DESCRIPTION,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  author: { "@type": "Person", name: AUTHOR_NAME, url: SITE_URL },
};

const iconLink =
  "inline-flex size-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

export default function Home() {
  const posts = getAllPosts();

  const byYear = new Map<string, typeof posts>();
  for (const p of posts) {
    const y = p.date.slice(0, 4);
    byYear.set(y, [...(byYear.get(y) ?? []), p]);
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Profile */}
      <section className="flex flex-col gap-5 px-4 py-10 sm:flex-row sm:items-center">
        {AUTHOR_IMAGE_URL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={AUTHOR_IMAGE_URL}
            alt={AUTHOR_NAME}
            className="size-24 rounded-full border object-cover ring-4 ring-muted"
          />
        ) : (
          <span className="flex size-24 items-center justify-center rounded-full bg-foreground text-3xl font-semibold text-background ring-4 ring-muted">
            {AUTHOR_NAME.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{AUTHOR_NAME}</h1>
          <p className="max-w-md text-muted-foreground">{SITE_DESCRIPTION}</p>
          <div className="flex gap-2 pt-1">
            {GITHUB_URL && (
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className={iconLink}>
                <Github className="size-4" />
              </a>
            )}
            {LINKEDIN_URL && (
              <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className={iconLink}>
                <Linkedin className="size-4" />
              </a>
            )}
            <a href="/rss.xml" aria-label="RSS" className={iconLink}>
              <Rss className="size-4" />
            </a>
          </div>
        </div>
      </section>

      <PatternSeparator />

      {/* Posts */}
      <section>
        <div className="screen-line-bottom flex items-baseline justify-between px-4 py-3">
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Bài viết
          </h2>
          <span className="font-mono text-xs text-muted-foreground">{posts.length}</span>
        </div>

        {posts.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Chưa có bài viết nào.
          </p>
        )}

        {[...byYear.entries()].map(([year, list]) => (
          <div key={year}>
            <p className="screen-line-bottom bg-muted/40 px-4 py-1.5 font-mono text-xs text-muted-foreground">
              {year}
            </p>
            {list.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}/`}
                className="screen-line-bottom group block px-4 py-5 transition-colors hover:bg-muted/50"
              >
                <h3 className="font-medium tracking-tight group-hover:underline group-hover:underline-offset-4">
                  {post.title}
                </h3>
                {post.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {post.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <time className="font-mono text-xs text-muted-foreground">
                    {formatDate(post.date)}
                  </time>
                  {post.tags.map((t) => (
                    <span key={t} className="rounded-md border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                      {t}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        ))}
      </section>

      <PatternSeparator className="h-6" />
    </>
  );
}
