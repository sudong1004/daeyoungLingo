"use server";

import { assertUser } from "@/lib/auth";
import { applyResult } from "@/lib/srs";
import { getSupabase } from "@/lib/supabase";
import { Q_TYPES, type QType } from "@/lib/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 문제 하나를 풀 때마다 호출됩니다.
 * - 풀이 기록(study_logs)은 항상 남김
 * - 세션 끝 "다시 풀기"(isRetry)는 숙련도에 반영하지 않음
 * - 그 외: 맞히면 숙련도 +1 / 틀리면 0, 다음 복습일 갱신
 * 숙련도는 클라이언트가 보낸 값이 아니라 DB의 현재 값으로 계산합니다.
 */
export async function submitAnswer(input: {
  wordId: string;
  type: QType;
  correct: boolean;
  isRetry: boolean;
}): Promise<void> {
  const user = await assertUser();
  const { wordId, type, correct, isRetry } = input;
  if (!UUID_RE.test(wordId) || !Q_TYPES.includes(type)) {
    throw new Error("Invalid input");
  }

  const sb = getSupabase();
  const found = await sb
    .from("word_progress")
    .select("level, correct_count, wrong_count, first_studied_at")
    .eq("user_id", user)
    .eq("word_id", wordId)
    .maybeSingle();
  if (found.error) throw new Error(found.error.message);
  if (!found.data) throw new Error("Word not found");
  const w = found.data as {
    level: number;
    correct_count: number;
    wrong_count: number;
    first_studied_at: string | null;
  };

  const now = new Date();
  const log = await sb.from("study_logs").insert({
    user_id: user,
    word_id: wordId,
    question_type: type,
    is_correct: correct,
    answered_at: now.toISOString(),
  });
  if (log.error) throw new Error(log.error.message);

  if (isRetry) return;

  const r = applyResult(w.level, correct, now);
  const upd = await sb
    .from("word_progress")
    .update({
      level: r.level,
      next_review_at: r.nextReviewAt.toISOString(),
      correct_count: w.correct_count + (correct ? 1 : 0),
      wrong_count: w.wrong_count + (correct ? 0 : 1),
      last_reviewed_at: now.toISOString(),
      first_studied_at: w.first_studied_at ?? now.toISOString(),
    })
    .eq("user_id", user)
    .eq("word_id", wordId);
  if (upd.error) throw new Error(upd.error.message);
}
