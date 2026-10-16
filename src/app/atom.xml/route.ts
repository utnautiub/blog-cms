import { generateFeed } from "@/lib/feed";
import { getAllPosts } from "@/lib/posts";

export const dynamic = "force-static";

export async function GET() {
  return new Response(generateFeed(getAllPosts()).atom1(), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
