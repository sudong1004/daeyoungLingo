// 연속 학습 일수 계산 (날짜는 한국 시간 기준 YYYY-MM-DD 문자열)
const DAY_MS = 86_400_000;

function toMs(key: string): number {
  return Date.parse(`${key}T00:00:00Z`);
}

export function addDays(key: string, days: number): string {
  return new Date(toMs(key) + days * DAY_MS).toISOString().slice(0, 10);
}

/**
 * current: 오늘까지 이어진 연속 일수. 오늘 아직 안 했으면 어제까지 이어진 일수 (오늘 하면 이어서 올라감)
 * longest: 가장 길었던 연속 일수
 * currentStart: 현재 연속이 시작된 날 (없으면 null)
 */
export function computeStreak(
  activeDays: ReadonlySet<string>,
  todayKey: string,
): { current: number; longest: number; currentStart: string | null; doneToday: boolean } {
  const doneToday = activeDays.has(todayKey);
  let cursor = doneToday ? todayKey : addDays(todayKey, -1);
  let current = 0;
  let currentStart: string | null = null;
  while (activeDays.has(cursor)) {
    current++;
    currentStart = cursor;
    cursor = addDays(cursor, -1);
  }

  const sorted = [...activeDays].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = d;
  }
  return { current, longest, currentStart, doneToday };
}
