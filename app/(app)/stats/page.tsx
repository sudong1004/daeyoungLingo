import Link from "next/link";
import { logout } from "@/app/login/actions";
import { requireUser } from "@/lib/auth";
import { TYPE_LABEL } from "@/lib/labels";
import { getStats } from "@/lib/stats";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const dowOf = (key: string) => DOW[new Date(`${key}T00:00:00Z`).getUTCDay()];

export default async function StatsPage() {
  const s = await getStats(await requireUser());
  const maxAnswers = Math.max(1, ...s.week.map((d) => d.answers));
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

  return (
    <main>
      <h1 className="text-2xl font-bold">기록</h1>

      <section className="mt-5 rounded-3xl bg-orange-500 p-6 text-white shadow-sm">
        <p className="text-sm text-orange-100">연속 학습</p>
        <p className="mt-1 text-4xl font-bold">🔥 {s.streak.current}일</p>
        <p className="mt-1 text-sm text-orange-100">
          {s.streak.doneToday
            ? "오늘도 했어요! 내일도 이어가 봐요."
            : s.streak.current > 0
              ? "오늘 하면 연속 기록이 이어져요."
              : "오늘 하나만 풀어도 기록이 시작돼요."}
          {s.streak.longest > 0 && ` · 최장 ${s.streak.longest}일`}
        </p>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3">
        <Card label="오늘 푼 문제" value={`${s.today.answers}개`} sub={s.today.answers ? `정답률 ${pct(s.today.correct, s.today.answers)}%` : "아직 없어요"} />
        <Card
          label="이번 주 정답률"
          value={s.weekAccuracy === null ? "-" : `${Math.round(s.weekAccuracy * 100)}%`}
          sub={s.weekAccuracy === null ? "5문제 이상 풀면 보여요" : "최근 7일"}
        />
      </section>

      <section className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <h2 className="text-sm font-semibold text-stone-500">최근 7일</h2>
        <div className="mt-3 flex h-32 items-end gap-2">
          {s.week.map((d, i) => {
            const h = d.answers ? Math.max(8, (d.answers / maxAnswers) * 100) : 4;
            const isToday = i === s.week.length - 1;
            return (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] text-stone-400">{d.answers || ""}</span>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className={`w-full rounded-t-md ${d.answers ? (isToday ? "bg-indigo-600" : "bg-indigo-300 dark:bg-indigo-800") : "bg-stone-200 dark:bg-stone-800"}`}
                    style={{ height: `${h}%` }}
                    title={`${d.date}: ${d.answers}문제`}
                  />
                </div>
                <span className={`text-xs ${isToday ? "font-bold text-stone-800 dark:text-stone-100" : "text-stone-400"}`}>
                  {dowOf(d.date)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <h2 className="text-sm font-semibold text-stone-500">내 단어</h2>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Mini label="새 단어" value={s.words.fresh} />
          <Mini label="학습 중" value={s.words.learning} />
          <Mini label="외움" value={s.words.graduated} />
        </div>
        <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
          <div className="bg-emerald-500" style={{ width: `${pct(s.words.graduated, s.words.total)}%` }} />
          <div className="bg-indigo-400" style={{ width: `${pct(s.words.learning, s.words.total)}%` }} />
        </div>
      </section>

      {s.byType.length > 0 && (
        <section className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
          <h2 className="text-sm font-semibold text-stone-500">문제 유형별 정답률 (최근 30일)</h2>
          <p className="mt-0.5 text-xs text-stone-400">약한 유형이 위에 나와요</p>
          <ul className="mt-3 space-y-2.5">
            {s.byType.map((t) => {
              const p = pct(t.correct, t.total);
              return (
                <li key={t.type}>
                  <div className="flex justify-between text-sm">
                    <span>{TYPE_LABEL[t.type] ?? t.type}</span>
                    <span className="text-stone-500">
                      {p}% <span className="text-xs text-stone-400">({t.total}문제)</span>
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
                    <div className={`h-full rounded-full ${p >= 80 ? "bg-emerald-500" : p >= 60 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${p}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-500">많이 틀린 단어</h2>
          <Link href="/words?filter=wrong" className="text-xs text-indigo-600">
            전체 보기 →
          </Link>
        </div>
        {s.mostMissed.length === 0 ? (
          <p className="mt-3 text-sm text-stone-400">아직 틀린 단어가 없어요 👍</p>
        ) : (
          <ul className="mt-2 divide-y divide-stone-100 dark:divide-stone-800">
            {s.mostMissed.map((w) => (
              <li key={w.id} className="flex items-baseline justify-between py-2.5">
                <div className="min-w-0">
                  <span className="font-semibold">{w.word}</span>
                  <span className="ml-2 text-sm text-stone-500">{w.meaning}</span>
                </div>
                <span className="ml-3 shrink-0 text-xs font-medium text-red-500">틀림 {w.wrong_count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link
        href="/talk"
        className="mt-4 flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-5 py-4 text-sm active:bg-stone-50 dark:border-stone-800 dark:bg-stone-900"
      >
        <span>
          💬 회화 연습 <b>{s.talk.runs}번</b>
          {s.talk.lastScore && <span className="ml-2 text-stone-400">최근 {s.talk.lastScore}</span>}
        </span>
        <span className="text-stone-300">›</span>
      </Link>

      <form action={logout} className="mt-8">
        <button
          type="submit"
          className="w-full rounded-xl border border-stone-300 py-3 text-sm text-stone-500 active:bg-stone-100 dark:border-stone-700 dark:active:bg-stone-900"
        >
          나가기 (로그아웃)
        </button>
      </form>
    </main>
  );
}

function Card({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-xs text-stone-400">{sub}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-stone-500">{label}</p>
    </div>
  );
}
