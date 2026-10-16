import { guardAdminApi } from "@/lib/auth";
import { writeUpload } from "@/lib/storage";
import { slugify } from "@/lib/utils";

const MAX_BYTES = 4 * 1024 * 1024; // Vercel giới hạn body ~4.5MB
const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(req: Request) {
  const denied = await guardAdminApi();
  if (denied) return denied;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Thiếu file" }, { status: 400 });
  }
  const ext = ALLOWED[file.type];
  if (!ext) {
    return Response.json(
      { error: "Chỉ hỗ trợ ảnh PNG, JPG, WEBP, GIF" },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Ảnh quá lớn (tối đa 4MB)" }, { status: 400 });
  }

  const base =
    slugify(file.name.replace(/\.[^.]+$/, ""))
      .slice(0, 40)
      .replace(/-+$/, "") || "image";
  const name = `${new Date().getFullYear()}/${base}-${Date.now().toString(36)}.${ext}`;

  try {
    const url = await writeUpload(name, Buffer.from(await file.arrayBuffer()));
    return Response.json({ url });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Upload thất bại" },
      { status: 500 },
    );
  }
}
