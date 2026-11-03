import Link from "next/link";
import { SCENARIOS, myLineCount } from "@/lib/scenarios";
import { requireUser, type UserId } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

/** 시나리오별 최고 점수. 테이블이 없거나 조회에 실패하면 빈 값 (화면은 그대로 보여 줌) */
async function bestScores(user: UserId): Promise<Map<string, { correct: number; total: number; runs: number }>> {
  const best = new Map<string, { correct: number; total: number; runs: number }>();
  const { data, error } = await getSupabase()
    .from("scenario_runs")
    .select("scenario_id, correct, total")
    .eq("user_id", user)
    .order("finished_at", { ascending: false })
    .limit(500);
  if (error || !data) return best;
  for (const r of data as { scenario_id: string; correct: number; total: number }[]) {
    const cur = best.get(r.scenario_id);
    const ratio = r.total ? r.correct / r.total : 0;
    if (!cur) best.set(r.scenario_id, { correct: r.correct, total: r.total, runs: 1 });
    else {
      cur.runs += 1;
      if (ratio > (cur.total ? cur.correct / cur.total : 0)) {
        cur.correct = r.correct;
        cur.total = r.total;
      }
    }
  }
  return best;
}

export default async function TalkPage() {
  const best = await bestScores(await requireUser());

  return (
    <main>
      <h1 className="text-2xl font-bold">상황별 회화</h1>
      <p className="mt-1 text-sm text-stone-500">
        대화를 듣고, 내 대사를 단어 카드로 직접 만들어 보세요.
      </p>

      <ul className="mt-5 space-y-3">
        {[...SCENARIOS].sort((a, b) => a.level - b.level).map((s) => {
          const b = best.get(s.id);
          return (
            <li key={s.id}>
              <Link
                href={`/talk/${s.id}`}
                className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 active:bg-stone-50 dark:border-stone-800 dark:bg-stone-900"
              >
                <span className="text-3xl">{s.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{s.title}</span>
                    <span className="text-xs text-amber-500" aria-label={`난이도 ${s.level}`}>
                      {"★".repeat(s.level)}
                      <span className="text-stone-300 dark:text-stone-700">{"★".repeat(3 - s.level)}</span>
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-stone-500">{s.intro}</p>
                  <p className="mt-1 text-xs text-stone-400">
                    내 대사 {myLineCount(s)}개
                    {b && (
                      <span className="ml-2 font-medium text-emerald-600 dark:text-emerald-400">
                        최고 {b.correct}/{b.total} · {b.runs}번 연습
                      </span>
                    )}
                  </p>
                </div>
                <span className="text-stone-300">›</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
