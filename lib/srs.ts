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

/** 정답률을 계산할 때 최소로 필요한 최근 답변 수 (이보다 적으면 기본값 사용) */
export const MIN_ANSWERS_FOR_PLAN = 8;

/**
 * 한 세션의 분량을 최근 정답률에 맞춰 정합니다. 고정된 하루 할당량은 없어요.
 * - 잘 풀수록 새 단어와 복습이 늘고, 헷갈려 하면 줄어듭니다.
 * - 밀린 복습이 많으면 새 단어를 줄이고 복습부터 끝내게 합니다.
 * accuracy: 0~1, 기록이 부족하면 null
 */
export function planSession(
  accuracy: number | null,
  dueCount: number,
): { newCount: number; dueLimit: number } {
  let newCount: number;
  let dueLimit: number;
  if (accuracy === null) {
    newCount = 5;
    dueLimit = 10;
  } else if (accuracy >= 0.9) {
    newCount = 10;
    dueLimit = 15;
  } else if (accuracy >= 0.8) {
    newCount = 7;
    dueLimit = 12;
  } else if (accuracy >= 0.7) {
    newCount = 5;
    dueLimit = 10;
  } else if (accuracy >= 0.55) {
    newCount = 3;
    dueLimit = 8;
  } else {
    newCount = 2;
    dueLimit = 6;
  }
  // 복습이 밀려 있으면 새 단어를 줄임
  if (dueCount > 30) newCount = 0;
  else if (dueCount > 15) newCount = Math.floor(newCount / 2);
  return { newCount, dueLimit };
}

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
