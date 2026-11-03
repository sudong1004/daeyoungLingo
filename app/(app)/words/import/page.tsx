import Link from "next/link";
import { importWords } from "../actions";

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ added?: string; skipped?: string; error?: string }>;
}) {
  const { added, skipped, error } = await searchParams;

  return (
    <main>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">한 번에 등록</h1>
        <Link href="/words/new" className="text-sm text-indigo-600">
          하나씩 추가 →
        </Link>
      </div>

      {added !== undefined && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          {added}개 추가했어요.
          {Number(skipped) > 0 && ` (이미 있거나 형식이 맞지 않은 ${skipped}개는 건너뜀)`}
        </p>
      )}
      {error === "empty" && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          등록할 줄이 없어요. 아래 형식으로 한 줄에 단어 하나씩 넣어 주세요.
        </p>
      )}

      <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
        <p className="font-medium text-stone-900 dark:text-stone-100">입력 형식</p>
        <p className="mt-1">
          한 줄에 하나, <b>단어 | 뜻 | 예문</b> (예문은 생략 가능). 엑셀에서 복사하면 탭으로
          구분돼 그대로 붙습니다.
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-stone-100 p-3 text-xs leading-relaxed dark:bg-stone-800">
{`reluctant | 꺼리는 | He was reluctant to leave.
How much is it? | 이거 얼마예요? | How much is it? I'll take two.
apple, 사과, I ate an apple.`}
        </pre>
        <p className="mt-2">
          | 나 탭이 없으면 쉼표로 나눠요. 뜻이 여러 개라 쉼표가 들어갈 땐 | 로 구분하세요.
        </p>
      </div>

      <form action={importWords} className="mt-4">
        <textarea
          name="text"
          required
          rows={10}
          placeholder="여기에 붙여넣기"
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 font-mono text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-stone-700 dark:bg-stone-900"
        />
        <button
          type="submit"
          className="mt-3 w-full rounded-xl bg-indigo-600 py-3.5 text-base font-semibold text-white active:bg-indigo-700"
        >
          등록하기
        </button>
      </form>
    </main>
  );
}
