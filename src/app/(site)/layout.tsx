import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPostMetas } from "@/lib/posts";

export default function SiteLayout({ children }: { children: ReactNode }) {
  const posts = getPostMetas().map(({ slug, title, date, tags }) => ({
    slug,
    title,
    date,
    tags,
  }));

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader posts={posts} />
      <main className="mx-auto w-full max-w-3xl flex-1 border-x">{children}</main>
      <SiteFooter />
    </div>
  );
}
