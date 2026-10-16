import { guardAdminApi } from "@/lib/auth";
import { serializePost } from "@/lib/post-format";
import { removePost, writePost } from "@/lib/storage";
import { SLUG_REGEX } from "@/lib/utils";

interface SaveBody {
  originalSlug?: string | null;
  slug?: string;
  meta?: {
    title?: string;
    description?: string;
    date?: string;
    tags?: string[];
    draft?: boolean;
  };
  body?: string;
}

export async function PUT(req: Request) {
  const denied = await guardAdminApi();
  if (denied) return denied;

  const data = (await req.json().catch(() => ({}))) as SaveBody;
  const slug = data.slug ?? "";
  const meta = data.meta ?? {};

  if (!SLUG_REGEX.test(slug)) {
    return Response.json(
      { error: "Slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang" },
      { status: 400 },
    );
  }
  if (!meta.title?.trim()) {
    return Response.json({ error: "Thiếu tiêu đề" }, { status: 400 });
  }
  if (!meta.date || !/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) {
    return Response.json({ error: "Ngày không hợp lệ" }, { status: 400 });
  }

  const raw = serializePost(
    {
      title: meta.title.trim(),
      description: (meta.description ?? "").trim(),
      date: meta.date,
      tags: (meta.tags ?? []).map((t) => t.trim()).filter(Boolean),
      draft: meta.draft === true,
    },
    data.body ?? "",
  );

  try {
    const verb = meta.draft ? "draft" : "post";
    await writePost(slug, raw, `${verb}: ${meta.title.trim()}`);

    // Đổi slug = ghi bài mới rồi xoá file cũ
    const old = data.originalSlug;
    if (old && old !== slug && SLUG_REGEX.test(old)) {
      await removePost(old, `rename: ${old} -> ${slug}`);
    }
    return Response.json({ ok: true, slug });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Lưu thất bại" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  const denied = await guardAdminApi();
  if (denied) return denied;

  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  if (!SLUG_REGEX.test(slug)) {
    return Response.json({ error: "Slug không hợp lệ" }, { status: 400 });
  }
  try {
    await removePost(slug, `delete: ${slug}`);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Xoá thất bại" },
      { status: 500 },
    );
  }
}
