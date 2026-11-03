import Link from "next/link";
import LevelDots from "@/components/LevelDots";
import Speaker from "@/components/Speaker";
import { getSupabase } from "@/lib/supabase";
import { MAX_LEVEL } from "@/lib/srs";
import type { Word } from "@/lib/types";

const FILTERS = [
  { key: "all", label: "전체" },
  { key: "learning", label: "학습 중" },
  { key: "known", label: "외움" },
] as const;

export default async function WordsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const { q = "", filter = "all" } = await searchParams;
  const term = q.trim().replace(/[,%()*]/g, " ").trim();

  let query = getSupabase()
    .from("words")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(300);

  if (filter === "learning") query = query.lt("level", MAX_LEVEL);
  if (filter === "known") query = query.gte("level", MAX_LEVEL);
  if (term) query = query.or(`word.ilike.%${term}%,meaning.ilike.%${term}%`);

  const { data, count, error } = await query;
  if (error) throw error;
  const words = (data ?? []) as Word[];

  const href = (f: string) =>
    `/words?filter=${f}${term ? `&q=${encodeURIComponent(term)}` : ""}`;

  return (
    <main>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">단어장</h1>
        <Link
          href="/words/new"
          className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white active:bg-indigo-700"
        >
          + 추가
        </Link>
      </div>

      <form action="/words" className="mt-4">
        <input type="hidden" name="filter" value={filter} />
        <input
          name="q"
          defaultValue={q}
          placeholder="단어나 뜻 검색"
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-stone-700 dark:bg-stone-900"
        />
      </form>

      <div className="mt-3 flex gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={href(f.key)}
            className={`rounded-full px-3.5 py-1.5 text-sm ${
              filter === f.key
                ? "bg-stone-900 font-medium text-white dark:bg-stone-100 dark:text-stone-900"
                : "bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-300"
            }`}
          >
            {f.label}
          </Link>
        ))}
        <span className="ml-auto self-center text-xs text-stone-400">{count ?? 0}개</span>
      </div>

      {words.length === 0 ? (
        <p className="mt-10 text-center text-sm text-stone-500">
          {term || filter !== "all" ? "조건에 맞는 단어가 없어요." : "아직 단어가 없어요."}
        </p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {words.map((w) => (
            <li
              key={w.id}
              className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
            >
              <Speaker text={w.word} size="sm" />
              <Link href={`/words/${w.id}/edit`} className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-base font-semibold">{w.word}</span>
                  <LevelDots level={w.level} />
                </div>
                <p className="mt-0.5 text-sm text-stone-600 dark:text-stone-300">{w.meaning}</p>
                {w.example && (
                  <p className="mt-1 text-sm italic text-stone-400">{w.example}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
