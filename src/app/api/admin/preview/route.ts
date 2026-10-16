import { guardAdminApi } from "@/lib/auth";
import { renderMarkdown } from "@/lib/markdown";

export async function POST(req: Request) {
  const denied = await guardAdminApi();
  if (denied) return denied;

  const { markdown } = (await req.json().catch(() => ({}))) as {
    markdown?: string;
  };
  try {
    const html = await renderMarkdown(typeof markdown === "string" ? markdown : "");
    return Response.json({ html });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Không render được" },
      { status: 500 },
    );
  }
}
