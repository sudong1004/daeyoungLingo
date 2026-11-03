import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAuthed()) redirect("/");
  const { error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <form
        action={login}
        className="w-full max-w-sm rounded-3xl border border-stone-200 bg-white p-8 shadow-sm dark:border-stone-800 dark:bg-stone-900"
      >
        <p className="text-4xl">📚</p>
        <h1 className="mt-3 text-2xl font-bold">영어 단어장</h1>
        <p className="mt-1 text-sm text-stone-500">비밀번호를 입력하세요.</p>

        <input
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
          placeholder="비밀번호"
          className="mt-6 w-full rounded-xl border border-stone-300 bg-transparent px-4 py-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-stone-700"
        />

        {error === "wrong" && (
          <p className="mt-3 text-sm text-red-600">비밀번호가 맞지 않아요.</p>
        )}
        {error === "config" && (
          <p className="mt-3 text-sm text-red-600">
            서버에 APP_PASSWORD 환경변수가 설정되지 않았어요.
          </p>
        )}

        <button
          type="submit"
          className="mt-6 w-full rounded-xl bg-indigo-600 py-3 text-base font-semibold text-white active:bg-indigo-700"
        >
          들어가기
        </button>
      </form>
    </main>
  );
}
