import { daysFromTodayKST } from "./kst";

/** 숙련도 5 = 졸업 (복습에서 빠짐) */
export const MAX_LEVEL = 5;

/** 맞혀서 숙련도 n이 되었을 때 다음 복습까지의 일수 */
export const INTERVAL_DAYS: Record<number, number> = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
};

/** 하루에 새로 시작하는 단어 수 */
export const NEW_WORDS_PER_DAY = 5;

/** 한 세션에 담는 복습 단어 최대 개수 */
export const SESSION_DUE_LIMIT = 10;

/**
 * 맞히면 숙련도 +1 (간격이 늘어남), 틀리면 0으로 돌아가 다음 날 다시 나옵니다.
 * 복습일은 한국 시간 0시 기준이라, 며칠 뒤 아침에 열면 바로 나옵니다.
 */
export function applyResult(
  level: number,
  correct: boolean,
  now: Date = new Date(),
): { level: number; nextReviewAt: Date } {
  if (!correct) {
    return { level: 0, nextReviewAt: daysFromTodayKST(1, now) };
  }
  const next = Math.min(level + 1, MAX_LEVEL);
  if (next >= MAX_LEVEL) {
    // 졸업: 사실상 다시 나오지 않도록 먼 미래로
    return { level: MAX_LEVEL, nextReviewAt: daysFromTodayKST(3650, now) };
  }
  return { level: next, nextReviewAt: daysFromTodayKST(INTERVAL_DAYS[next], now) };
}
