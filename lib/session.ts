import "server-only";
import { getSupabase } from "./supabase";
import { startOfTodayKST } from "./kst";
import { buildQuestion, shuffle } from "./questions";
import { MAX_LEVEL, NEW_WORDS_PER_DAY, SESSION_DUE_LIMIT } from "./srs";
import type { Question, Word } from "./types";

export interface HomeStats {
  dueCount: number; // 오늘 복습할 단어
  newToday: number; // 오늘 새로 시작할 수 있는 단어 수
  total: number;
  graduated: number;
}

async function countNewIntroducedToday(): Promise<number> {
  const sb = getSupabase();
  const { count, error } = await sb
    .from("words")
    .select("id", { count: "exact", head: true })
    .gte("first_studied_at", startOfTodayKST().toISOString());
  if (error) throw error;
  return count ?? 0;
}

export async function getHomeStats(): Promise<HomeStats> {
  const sb = getSupabase();
  const nowIso = new Date().toISOString();

  const [due, fresh, total, graduated, introduced] = await Promise.all([
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
    countNewIntroducedToday(),
  ]);

  for (const r of [due, fresh, total, graduated]) if (r.error) throw r.error;

  const newLeftToday = Math.max(0, NEW_WORDS_PER_DAY - introduced);
  return {
    dueCount: due.count ?? 0,
    newToday: Math.min(newLeftToday, fresh.count ?? 0),
    total: total.count ?? 0,
    graduated: graduated.count ?? 0,
  };
}

/** 한 세션 분량의 문제를 만듭니다: 복습할 단어(최대 10개) + 오늘 남은 새 단어 */
export async function buildSession(): Promise<Question[]> {
  const sb = getSupabase();
  const nowIso = new Date().toISOString();

  const dueRes = await sb
    .from("words")
    .select("*")
    .lt("level", MAX_LEVEL)
    .not("first_studied_at", "is", null)
    .lte("next_review_at", nowIso)
    .order("next_review_at", { ascending: true })
    .limit(SESSION_DUE_LIMIT);
  if (dueRes.error) throw dueRes.error;
  const due = (dueRes.data ?? []) as Word[];

  const introduced = await countNewIntroducedToday();
  const newSlots = Math.max(0, NEW_WORDS_PER_DAY - introduced);
  let fresh: Word[] = [];
  if (newSlots > 0) {
    const freshRes = await sb
      .from("words")
      .select("*")
      .is("first_studied_at", null)
      .order("created_at", { ascending: true })
      .limit(newSlots);
    if (freshRes.error) throw freshRes.error;
    fresh = (freshRes.data ?? []) as Word[];
  }

  const chosen = [...due, ...fresh];
  if (chosen.length === 0) return [];

  // 오답 보기를 뽑을 단어 풀 (개인용이라 최근 1000개면 충분)
  const poolRes = await sb
    .from("words")
    .select("id, word, meaning")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (poolRes.error) throw poolRes.error;
  const pool = (poolRes.data ?? []) as { id: string; word: string; meaning: string }[];

  return shuffle(chosen).map((w) => buildQuestion(w, pool));
}
