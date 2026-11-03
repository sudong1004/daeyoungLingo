import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { buildSession } from "@/lib/session";
import StudyClient from "./StudyClient";

export default async function StudyPage() {
  const questions = await buildSession(await requireUser());

  if (questions.length === 0) {
    return (
      <main className="pt-10 text-center">
        <p className="text-5xl">🎉</p>
        <h1 className="mt-4 text-xl font-bold">오늘 풀 단어가 없어요</h1>
        <p className="mt-2 text-sm text-stone-500">
          복습할 단어와 새 단어를 모두 끝냈어요. 단어를 더 추가하거나 내일 다시 오세요.
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <Link
            href="/words/new"
            className="rounded-xl bg-indigo-600 py-3.5 font-semibold text-white active:bg-indigo-700"
          >
            단어 추가하기
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-stone-300 py-3.5 font-medium dark:border-stone-700"
          >
            홈으로
          </Link>
        </div>
      </main>
    );
  }

  // key: 새 세션을 받으면 화면 상태(결과 화면 등)를 처음부터 다시 시작
  return <StudyClient key={questions[0].key} questions={questions} />;
}
