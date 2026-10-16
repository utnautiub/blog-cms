import { Feed } from "feed";

import {
  AUTHOR_EMAIL,
  AUTHOR_IMAGE_URL,
  AUTHOR_NAME,
  COPYRIGHT_YEAR,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/config/site";
import type { Post } from "@/lib/post-format";

export function generateFeed(posts: Post[]) {
  const feed = new Feed({
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    id: SITE_URL,
    link: SITE_URL,
    language: "vi",
    favicon: `${SITE_URL}favicon.ico`,
    image: AUTHOR_IMAGE_URL || undefined,
    copyright: `All rights reserved ${COPYRIGHT_YEAR}, ${AUTHOR_NAME}`,
    feedLinks: { atom: `${SITE_URL}atom.xml`, rss: `${SITE_URL}rss.xml` },
    author: { name: AUTHOR_NAME, email: AUTHOR_EMAIL, link: SITE_URL },
  });

  for (const post of posts) {
    const url = `${SITE_URL}blog/${post.slug}/`;
    feed.addItem({
      title: post.title,
      id: url,
      link: url,
      description: post.description,
      date: new Date(post.date),
    });
  }
  return feed;
}
