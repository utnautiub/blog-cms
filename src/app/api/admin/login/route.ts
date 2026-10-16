import { cookies } from "next/headers";

import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  checkPassword,
  createSessionToken,
  isAdminConfigured,
} from "@/lib/auth";

export async function POST(req: Request) {
  if (!isAdminConfigured()) {
    return Response.json(
      { error: "Chưa cấu hình ADMIN_PASSWORD trong biến môi trường." },
      { status: 500 },
    );
  }

  const { password } = (await req.json().catch(() => ({}))) as {
    password?: string;
  };

  if (typeof password !== "string" || !checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 600)); // làm chậm việc dò mật khẩu
    return Response.json({ error: "Sai mật khẩu" }, { status: 401 });
  }

  (await cookies()).set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return Response.json({ ok: true });
}
