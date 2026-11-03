import "server-only";
import { kstDateKey } from "./kst";
import { addDays, computeStreak } from "./streak";
import type { UserId } from "./auth";
import { getSupabase } from "./supabase";
import type { QType } from "./types";

const PAGE = 1000;

type LogRow = { answered_at: string; is_correct: boolean; question_type: string };

/** study_logs 를 최신순으로 페이지를 넘기며 가져옵니다 (Supabase 는 한 번에 1000개까지) */
async function fetchLogs(user: UserId, sinceDays: number, maxPages: number, stop?: (rows: LogRow[]) => boolean): Promise<LogRow[]> {
  const sb = getSupabase();
  const since = new Date(Date.now() - sinceDays * 86_400_000).toISOString();
  const all: LogRow[] = [];
  for (let p = 0; p < maxPages; p++) {
    const { data, error } = await sb
      .from("study_logs")
      .select("answered_at, is_correct, question_type")
      .eq("user_id", user)
      .gte("answered_at", since)
      .order("answered_at", { ascending: false })
      .range(p * PAGE, p * PAGE + PAGE - 1);
    if (error) throw new Error(error.message || "Supabase 오류");
    const rows = (data ?? []) as LogRow[];
    all.push(...rows);
    if (rows.length < PAGE) break;
    if (stop?.(all)) break;
  }
  return all;
}

/** 회화 연습 기록. 테이블이 아직 없으면 빈 배열 (앱은 그대로 동작) */
async function fetchScenarioRuns(user: UserId, sinceDays: number) {
  const since = new Date(Date.now() - sinceDays * 86_400_000).toISOString();
  const { data, error } = await getSupabase()
    .from("scenario_runs")
    .select("finished_at, correct, total")
    .eq("user_id", user)
    .gte("finished_at", since)
    .order("finished_at", { ascending: false })
    .limit(1000);
  if (error || !data) return [];
  return data as { finished_at: string; correct: number; total: number }[];
}

export interface StreakInfo {
  current: number;
  longest: number;
  doneToday: boolean;
}

/** 홈 화면용: 연속 일수만 가볍게. 끊긴 날이 확인되면 더 안 읽음 */
export async function getStreak(user: UserId): Promise<StreakInfo> {
  const today = kstDateKey(new Date());
  const logs = await fetchLogs(user, 120, 10, (rows) => {
    const days = new Set(rows.map((r) => kstDateKey(new Date(r.answered_at))));
    const { currentStart } = computeStreak(days, today);
    const oldest = kstDateKey(new Date(rows[rows.length - 1].answered_at));
    // 현재 연속이 시작된 날보다 더 이전 기록까지 읽었다면 끊긴 지점을 확인한 것
    return currentStart ? oldest < addDays(currentStart, -1) : oldest < addDays(today, -1);
  });
  const runs = await fetchScenarioRuns(user, 120);
  const days = new Set([
    ...logs.map((r) => kstDateKey(new Date(r.answered_at))),
    ...runs.map((r) => kstDateKey(new Date(r.finished_at))),
  ]);
  const s = computeStreak(days, today);
  return { current: s.current, longest: s.longest, doneToday: s.doneToday };
}

export interface DayStat {
  date: string;
  answers: number;
  correct: number;
}

export interface Stats {
  streak: StreakInfo;
  today: { answers: number; correct: number };
  week: DayStat[]; // 오늘 포함 최근 7일 (오래된 날 → 오늘)
  weekAccuracy: number | null;
  byType: { type: QType | string; total: number; correct: number }[]; // 최근 30일, 약한 유형이 먼저
  words: { total: number; fresh: number; learning: number; graduated: number };
  mostMissed: { id: string; word: string; meaning: string; wrong_count: number; correct_count: number }[];
  talk: { runs: number; lastScore: string | null };
}

export async function getStats(user: UserId): Promise<Stats> {
  const sb = getSupabase();
  const today = kstDateKey(new Date());

  const [logs, runs, total, fresh, graduated, missed] = await Promise.all([
    fetchLogs(user, 120, 10),
    fetchScenarioRuns(user, 120),
    sb.from("word_progress").select("word_id", { count: "exact", head: true }).eq("user_id", user),
    sb
      .from("word_progress")
      .select("word_id", { count: "exact", head: true })
      .eq("user_id", user)
      .is("first_studied_at", null),
    sb
      .from("word_progress")
      .select("word_id", { count: "exact", head: true })
      .eq("user_id", user)
      .gte("level", 5),
    sb
      .from("word_progress")
      .select("wrong_count, correct_count, words!inner(id, word, meaning)")
      .eq("user_id", user)
      .gt("wrong_count", 0)
      .order("wrong_count", { ascending: false })
      .limit(8),
  ]);
  for (const r of [total, fresh, graduated, missed]) if (r.error) throw new Error(r.error.message || "Supabase 오류");

  const logDay = (r: LogRow) => kstDateKey(new Date(r.answered_at));
  const activeDays = new Set([...logs.map(logDay), ...runs.map((r) => kstDateKey(new Date(r.finished_at)))]);
  const streak = computeStreak(activeDays, today);

  const week: DayStat[] = [];
  for (let i = 6; i >= 0; i--) week.push({ date: addDays(today, -i), answers: 0, correct: 0 });
  const byDate = new Map(week.map((d) => [d.date, d]));
  const typeMap = new Map<string, { total: number; correct: number }>();
  const monthAgo = addDays(today, -29);
  for (const r of logs) {
    const d = logDay(r);
    const slot = byDate.get(d);
    if (slot) {
      slot.answers++;
      if (r.is_correct) slot.correct++;
    }
    if (d >= monthAgo) {
      const t = typeMap.get(r.question_type) ?? { total: 0, correct: 0 };
      t.total++;
      if (r.is_correct) t.correct++;
      typeMap.set(r.question_type, t);
    }
  }
  const weekAnswers = week.reduce((a, d) => a + d.answers, 0);
  const weekCorrect = week.reduce((a, d) => a + d.correct, 0);

  const totalWords = total.count ?? 0;
  const freshWords = fresh.count ?? 0;
  const grad = graduated.count ?? 0;
  const last = runs[0];

  return {
    streak: { current: streak.current, longest: streak.longest, doneToday: streak.doneToday },
    today: byDate.get(today) ? { answers: byDate.get(today)!.answers, correct: byDate.get(today)!.correct } : { answers: 0, correct: 0 },
    week,
    weekAccuracy: weekAnswers >= 5 ? weekCorrect / weekAnswers : null,
    byType: [...typeMap.entries()]
      .map(([type, v]) => ({ type, ...v }))
      .filter((t) => t.total >= 3)
      .sort((a, b) => a.correct / a.total - b.correct / b.total),
    words: { total: totalWords, fresh: freshWords, learning: Math.max(0, totalWords - freshWords - grad), graduated: grad },
    mostMissed: ((missed.data ?? []) as unknown as {
      wrong_count: number;
      correct_count: number;
      words: { id: string; word: string; meaning: string };
    }[]).map((m) => ({
      id: m.words.id,
      word: m.words.word,
      meaning: m.words.meaning,
      wrong_count: m.wrong_count,
      correct_count: m.correct_count,
    })),
    talk: { runs: runs.length, lastScore: last ? `${last.correct}/${last.total}` : null },
  };
}
