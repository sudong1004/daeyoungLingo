import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "vocab_auth";
const MAX_AGE = 60 * 60 * 24 * 180; // 180일

/** 사용자 구분. 'a' = APP_PASSWORD, 'b' = APP_PASSWORD_2 */
export type UserId = "a" | "b";

function secret(): string {
  const s = process.env.AUTH_SECRET ?? process.env.APP_PASSWORD;
  if (!s) throw new Error("APP_PASSWORD 환경변수가 설정되지 않았어요.");
  return s;
}

function tokenFor(user: UserId): string {
  return `${user}.${createHmac("sha256", secret()).update(`vocab-app-auth-v2:${user}`).digest("hex")}`;
}

export function isPasswordConfigured(): boolean {
  return Boolean(process.env.APP_PASSWORD);
}

function same(a: string, b: string): boolean {
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
}

/** 입력한 비밀번호가 누구 것인지. 맞는 게 없으면 null */
export function userForPassword(input: string): UserId | null {
  const pw1 = process.env.APP_PASSWORD;
  const pw2 = process.env.APP_PASSWORD_2;
  if (pw1 && same(input, pw1)) return "a";
  if (pw2 && same(input, pw2)) return "b";
  return null;
}

/** 로그인한 사용자. 로그인 안 했으면 null */
export async function getUserId(): Promise<UserId | null> {
  if (!isPasswordConfigured()) return null;
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  for (const u of ["a", "b"] as const) {
    if (u === "b" && !process.env.APP_PASSWORD_2) continue;
    const expected = tokenFor(u);
    if (token.length === expected.length && timingSafeEqual(Buffer.from(token), Buffer.from(expected))) {
      return u;
    }
  }
  return null;
}

export async function isAuthed(): Promise<boolean> {
  return (await getUserId()) !== null;
}

/** 서버 컴포넌트(레이아웃/페이지)에서 호출: 로그인 안 했으면 /login 으로 */
export async function requireUser(): Promise<UserId> {
  const u = await getUserId();
  if (!u) redirect("/login");
  return u;
}

/** 서버 액션에서 호출: 로그인 안 했으면 에러 (액션은 URL만 알면 직접 호출될 수 있어서 필수) */
export async function assertUser(): Promise<UserId> {
  const u = await getUserId();
  if (!u) throw new Error("Unauthorized");
  return u;
}

export async function setAuthCookie(user: UserId): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, tokenFor(user), {
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
