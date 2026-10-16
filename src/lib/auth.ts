import "server-only";
import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 ngày

export const isAdminConfigured = () => Boolean(process.env.ADMIN_PASSWORD);

const secret = () =>
  process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "";

const sign = (payload: string) =>
  createHmac("sha256", secret()).update(payload).digest("hex");

const digest = (s: string) => createHash("sha256").update(s).digest();

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return timingSafeEqual(digest(input), digest(expected));
}

export function createSessionToken(): string {
  const exp = String(Date.now() + SESSION_MAX_AGE * 1000);
  return `${exp}.${sign(exp)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token || !secret()) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig) return false;
  const expected = sign(exp);
  if (sig.length !== expected.length) return false;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  return Number(exp) > Date.now();
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/** Dùng đầu mỗi API route của admin. Trả về Response 401 nếu chưa đăng nhập. */
export async function guardAdminApi(): Promise<Response | null> {
  if (await isAdmin()) return null;
  return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
}
