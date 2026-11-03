import "server-only";
import type { UserId } from "./auth";
import { PROGRESS_SELECT, toWord, type ProgressRow } from "./progress";
import { getSupabase } from "./supabase";
import { buildQuestion, shuffle } from "./questions";
import { getStreak, type StreakInfo } from "./stats";
import { MAX_LEVEL, MIN_ANSWERS_FOR_PLAN, planSession } from "./srs";
import type { Question } from "./types";

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
async function recentAccuracy(user: UserId): Promise<number | null> {
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data, error } = await getSupabase()
    .from("study_logs")
    .select("is_correct")
    .eq("user_id", user)
    .gte("answered_at", since)
    .order("answered_at", { ascending: false })
    .limit(30);
  if (error) throw new Error(error.message || "Supabase 오류");
  const rows = data ?? [];
  if (rows.length < MIN_ANSWERS_FOR_PLAN) return null;
  return rows.filter((r) => r.is_correct).length / rows.length;
}

export async function getHomeStats(user: UserId): Promise<HomeStats> {
  const sb = getSupabase();
  const nowIso = new Date().toISOString();

  const prog = () =>
    sb.from("word_progress").select("word_id", { count: "exact", head: true }).eq("user_id", user);

  const [due, fresh, total, graduated, wrong, accuracy, streak] = await Promise.all([
    prog()
      .lt("level", MAX_LEVEL)
      .not("first_studied_at", "is", null)
      .lte("next_review_at", nowIso),
    prog().is("first_studied_at", null),
    prog(),
    prog().gte("level", MAX_LEVEL),
    prog().gt("wrong_count", 0),
    recentAccuracy(user),
    getStreak(user),
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
export async function buildSession(user: UserId): Promise<Question[]> {
  const sb = getSupabase();
  const nowIso = new Date().toISOString();

  const [accuracy, dueTotal] = await Promise.all([
    recentAccuracy(user),
    sb
      .from("word_progress")
      .select("word_id", { count: "exact", head: true })
      .eq("user_id", user)
      .lt("level", MAX_LEVEL)
      .not("first_studied_at", "is", null)
      .lte("next_review_at", nowIso),
  ]);
  if (dueTotal.error) throw new Error(dueTotal.error.message || "Supabase 오류");
  const plan = planSession(accuracy, dueTotal.count ?? 0);

  // 복습 단어 / 새 단어 / 오답 보기 풀을 동시에 가져옵니다 (순서대로 기다리면 느려짐)
  const [dueRes, freshRes, poolRes] = await Promise.all([
    sb
      .from("word_progress")
      .select(PROGRESS_SELECT)
      .eq("user_id", user)
      .lt("level", MAX_LEVEL)
      .not("first_studied_at", "is", null)
      .lte("next_review_at", nowIso)
      .order("next_review_at", { ascending: true })
      .limit(plan.dueLimit),
    plan.newCount > 0
      ? sb
          .from("word_progress")
          .select(PROGRESS_SELECT)
          .eq("user_id", user)
          .is("first_studied_at", null)
          .order("created_at", { ascending: true })
          .limit(plan.newCount)
      : Promise.resolve({ data: [] as ProgressRow[], error: null }),
    // 오답 보기를 뽑을 단어 풀 (개인용이라 최근 1000개면 충분)
    sb
      .from("words")
      .select("id, word, meaning, example")
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);
  if (dueRes.error) throw new Error(dueRes.error.message || "Supabase 오류");
  if (freshRes.error) throw new Error(freshRes.error.message || "Supabase 오류");
  if (poolRes.error) throw new Error(poolRes.error.message || "Supabase 오류");
  const due = ((dueRes.data ?? []) as unknown as ProgressRow[]).map(toWord);
  const fresh = ((freshRes.data ?? []) as unknown as ProgressRow[]).map(toWord);

  const chosen = [...due, ...fresh];
  if (chosen.length === 0) return [];

  const pool = (poolRes.data ?? []) as { id: string; word: string; meaning: string; example: string | null }[];

  return shuffle(chosen).map((w) => buildQuestion(w, pool));
}
