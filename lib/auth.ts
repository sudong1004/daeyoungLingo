import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "vocab_auth";
const MAX_AGE = 60 * 60 * 24 * 180; // 180일

function secret(): string {
  const s = process.env.AUTH_SECRET ?? process.env.APP_PASSWORD;
  if (!s) throw new Error("APP_PASSWORD 환경변수가 설정되지 않았어요.");
  return s;
}

function expectedToken(): string {
  return createHmac("sha256", secret()).update("vocab-app-auth-v1").digest("hex");
}

export function isPasswordConfigured(): boolean {
  return Boolean(process.env.APP_PASSWORD);
}

export function passwordMatches(input: string): boolean {
  const pw = process.env.APP_PASSWORD;
  if (!pw) return false;
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(pw).digest();
  return timingSafeEqual(a, b);
}

export async function isAuthed(): Promise<boolean> {
  if (!isPasswordConfigured()) return false;
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return false;
  const expected = expectedToken();
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

/** 서버 컴포넌트(레이아웃/페이지)에서 호출: 로그인 안 했으면 /login 으로 */
export async function requireAuth(): Promise<void> {
  if (!(await isAuthed())) redirect("/login");
}

/** 서버 액션에서 호출: 로그인 안 했으면 에러 (액션은 URL만 알면 직접 호출될 수 있어서 필수) */
export async function assertAuth(): Promise<void> {
  if (!(await isAuthed())) throw new Error("Unauthorized");
}

export async function setAuthCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, expectedToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearAuthCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}
