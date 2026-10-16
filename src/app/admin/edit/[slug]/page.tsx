import { notFound, redirect } from "next/navigation";

import { Editor } from "@/components/admin/editor";
import { isAdmin } from "@/lib/auth";
import { isGithubMode, readPost } from "@/lib/storage";
import { SLUG_REGEX } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EditPost({ params }: { params: Promise<{ slug: string }> }) {
  if (!(await isAdmin())) redirect("/admin/");

  const { slug } = await params;
  if (!SLUG_REGEX.test(slug)) notFound();
  const post = await readPost(slug);
  if (!post) notFound();

  return (
    <Editor
      githubMode={isGithubMode}
      initial={{
        slug: post.slug,
        title: post.title,
        description: post.description,
        date: post.date,
        tags: post.tags.join(", "),
        draft: post.draft,
        body: post.body,
      }}
    />
  );
}
