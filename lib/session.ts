import "server-only";
import { getSupabase } from "./supabase";
import { buildQuestion, shuffle } from "./questions";
import { getStreak, type StreakInfo } from "./stats";
import { MAX_LEVEL, MIN_ANSWERS_FOR_PLAN, planSession } from "./srs";
import type { Question, Word } from "./types";

export interface HomeStats {
  dueCount: number; // 복습할 단어 (오늘 기준으로 도래한 것 전부)
  newNext: number; // 다음 세션에서 새로 시작할 단어 수 (최근 정답률에 따라 달라짐)
  dueNext: number; // 다음 세션에서 복습할 단어 수
  accuracy: number | null; // 최근 정답률 0~1 (기록이 적으면 null)
  total: number;
  graduated: number;
  wrongCount: number; // 한 번이라도 틀린 적 있는 단어
  streak: StreakInfo; // 연속 학습 일수
}

/** 최근 7일, 최근 30개 답변의 정답률. 기록이 적으면 null */
async function recentAccuracy(): Promise<number | null> {
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data, error } = await getSupabase()
    .from("study_logs")
    .select("is_correct")
    .gte("answered_at", since)
    .order("answered_at", { ascending: false })
    .limit(30);
  if (error) throw new Error(error.message || "Supabase 오류");
  const rows = data ?? [];
  if (rows.length < MIN_ANSWERS_FOR_PLAN) return null;
  return rows.filter((r) => r.is_correct).length / rows.length;
}

export async function getHomeStats(): Promise<HomeStats> {
  const sb = getSupabase();
  const nowIso = new Date().toISOString();

  const [due, fresh, total, graduated, wrong, accuracy, streak] = await Promise.all([
    sb
      .from("words")
      .select("id", { count: "exact", head: true })
      .lt("level", MAX_LEVEL)
      .not("first_studied_at", "is", null)
      .lte("next_review_at", nowIso),
    sb
      .from("words")
      .select("id", { count: "exact", head: true })
      .is("first_studied_at", null),
    sb.from("words").select("id", { count: "exact", head: true }),
    sb.from("words").select("id", { count: "exact", head: true }).gte("level", MAX_LEVEL),
    sb.from("words").select("id", { count: "exact", head: true }).gt("wrong_count", 0),
    recentAccuracy(),
    getStreak(),
  ]);

  for (const r of [due, fresh, total, graduated, wrong])
    if (r.error) throw new Error(r.error.message || "Supabase 오류");

  const dueCount = due.count ?? 0;
  const plan = planSession(accuracy, dueCount);
  return {
    dueCount,
    dueNext: Math.min(dueCount, plan.dueLimit),
    newNext: Math.min(plan.newCount, fresh.count ?? 0),
    accuracy,
    total: total.count ?? 0,
    graduated: graduated.count ?? 0,
    wrongCount: wrong.count ?? 0,
    streak,
  };
}

/** 한 세션 분량의 문제를 만듭니다: 복습할 단어 + 새 단어 (양은 최근 정답률에 따라 달라짐) */
export async function buildSession(): Promise<Question[]> {
  const sb = getSupabase();
  const nowIso = new Date().toISOString();

  const [accuracy, dueTotal] = await Promise.all([
    recentAccuracy(),
    sb
      .from("words")
      .select("id", { count: "exact", head: true })
      .lt("level", MAX_LEVEL)
      .not("first_studied_at", "is", null)
      .lte("next_review_at", nowIso),
  ]);
  if (dueTotal.error) throw new Error(dueTotal.error.message || "Supabase 오류");
  const plan = planSession(accuracy, dueTotal.count ?? 0);

  const dueRes = await sb
    .from("words")
    .select("*")
    .lt("level", MAX_LEVEL)
    .not("first_studied_at", "is", null)
    .lte("next_review_at", nowIso)
    .order("next_review_at", { ascending: true })
    .limit(plan.dueLimit);
  if (dueRes.error) throw new Error(dueRes.error.message || "Supabase 오류");
  const due = (dueRes.data ?? []) as Word[];

  let fresh: Word[] = [];
  if (plan.newCount > 0) {
    const freshRes = await sb
      .from("words")
      .select("*")
      .is("first_studied_at", null)
      .order("created_at", { ascending: true })
      .limit(plan.newCount);
    if (freshRes.error) throw new Error(freshRes.error.message || "Supabase 오류");
    fresh = (freshRes.data ?? []) as Word[];
  }

  const chosen = [...due, ...fresh];
  if (chosen.length === 0) return [];

  // 오답 보기를 뽑을 단어 풀 (개인용이라 최근 1000개면 충분)
  const poolRes = await sb
    .from("words")
    .select("id, word, meaning, example")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (poolRes.error) throw new Error(poolRes.error.message || "Supabase 오류");
  const pool = (poolRes.data ?? []) as { id: string; word: string; meaning: string; example: string | null }[];

  return shuffle(chosen).map((w) => buildQuestion(w, pool));
}
