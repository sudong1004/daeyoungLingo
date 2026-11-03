import Link from "next/link";
import { getHomeStats } from "@/lib/session";

export default async function HomePage() {
  const s = await getHomeStats();
  const todo = s.dueCount + s.newToday;

  return (
    <main>
      <h1 className="text-2xl font-bold">오늘의 학습</h1>
      <p className="mt-1 text-sm text-stone-500">
        매일 조금씩, 끝까지 풀어 보세요.
      </p>

      <section className="mt-6 rounded-3xl bg-indigo-600 p-6 text-white shadow-sm">
        {s.total === 0 ? (
          <>
            <p className="text-lg font-semibold">아직 단어가 없어요</p>
            <p className="mt-1 text-sm text-indigo-100">
              단어를 먼저 추가하면 여기서 학습을 시작할 수 있어요.
            </p>
            <Link
              href="/words/new"
              className="mt-5 block rounded-2xl bg-white py-3.5 text-center text-base font-semibold text-indigo-700 active:bg-indigo-50"
            >
              단어 추가하기
            </Link>
          </>
        ) : todo === 0 ? (
          <>
            <p className="text-lg font-semibold">오늘 할 학습을 다 했어요 🎉</p>
            <p className="mt-1 text-sm text-indigo-100">
              내일 다시 복습할 단어가 나와요. 새 단어를 더 넣어 둘 수도 있어요.
            </p>
            <Link
              href="/words/new"
              className="mt-5 block rounded-2xl bg-white py-3.5 text-center text-base font-semibold text-indigo-700 active:bg-indigo-50"
            >
              단어 추가하기
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-indigo-100">오늘 풀 단어</p>
            <p className="mt-1 text-4xl font-bold">{todo}개</p>
            <p className="mt-1 text-sm text-indigo-100">
              복습 {s.dueCount}개 · 새 단어 {s.newToday}개
            </p>
            <Link
              href="/study"
              className="mt-5 block rounded-2xl bg-white py-3.5 text-center text-base font-semibold text-indigo-700 active:bg-indigo-50"
            >
              학습 시작
            </Link>
          </>
        )}
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="전체 단어" value={s.total} />
        <Stat label="외운 단어" value={s.graduated} />
      </section>

      <Link
        href="/words/import"
        className="mt-4 block rounded-2xl border border-stone-200 bg-white px-5 py-4 text-sm text-stone-600 active:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300"
      >
        단어 여러 개를 한 번에 붙여넣어 등록하기 →
      </Link>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
