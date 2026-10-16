import Link from "next/link";

import { CommandMenu, type CommandPost } from "@/components/command-menu";
import { SoundToggle } from "@/components/sound-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { AUTHOR_IMAGE_URL, AUTHOR_NAME, SITE_NAME } from "@/config/site";

export function SiteHeader({ posts }: { posts: CommandPost[] }) {
  return (
    <header className="screen-line-bottom sticky top-0 z-50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 border-x px-4">
        <Link href="/" className="flex items-center gap-2.5 font-medium tracking-tight">
          {AUTHOR_IMAGE_URL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={AUTHOR_IMAGE_URL}
              alt={AUTHOR_NAME}
              className="size-7 rounded-full border object-cover"
            />
          ) : (
            <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
              {SITE_NAME.charAt(0).toUpperCase()}
            </span>
          )}
          <span>{SITE_NAME}</span>
        </Link>
        <div className="flex items-center gap-1.5">
          <CommandMenu posts={posts} />
          <SoundToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
