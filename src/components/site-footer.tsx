import Link from "next/link";

import { AUTHOR_NAME, COPYRIGHT_YEAR, GITHUB_URL, LINKEDIN_URL } from "@/config/site";

export function SiteFooter() {
  const year = new Date().getFullYear();
  const range = String(year) === COPYRIGHT_YEAR ? COPYRIGHT_YEAR : `${COPYRIGHT_YEAR}–${year}`;
  return (
    <footer className="screen-line-top">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 border-x px-4 py-8 text-sm text-muted-foreground">
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          {GITHUB_URL && (
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
              GitHub
            </a>
          )}
          {LINKEDIN_URL && (
            <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
              LinkedIn
            </a>
          )}
          <a href="/rss.xml" className="hover:text-foreground">RSS</a>
          <Link href="/admin/" className="hover:text-foreground">Quản trị</Link>
        </nav>
        <p className="font-mono text-xs">© {range} {AUTHOR_NAME}</p>
      </div>
    </footer>
  );
}
