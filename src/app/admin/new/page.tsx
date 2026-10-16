import { redirect } from "next/navigation";

import { Editor } from "@/components/admin/editor";
import { isAdmin } from "@/lib/auth";
import { isGithubMode } from "@/lib/storage";
import { todayVN } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NewPost() {
  if (!(await isAdmin())) redirect("/admin/");

  return (
    <Editor
      githubMode={isGithubMode}
      initial={{
        slug: null,
        title: "",
        description: "",
        date: todayVN(),
        tags: "",
        draft: true,
        body: "## Mở đầu\n\nViết nội dung bài ở đây…\n",
      }}
    />
  );
}
