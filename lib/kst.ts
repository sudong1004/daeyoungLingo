// 서버는 UTC로 돌아가지만 "오늘"은 한국 시간 기준으로 셉니다.
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** 한국 시간 기준 오늘 0시 (UTC Date로 반환) */
export function startOfTodayKST(now: Date = new Date()): Date {
  const shifted = new Date(now.getTime() + KST_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - KST_OFFSET_MS);
}

/** 한국 시간 기준 오늘 0시 + days일 */
export function daysFromTodayKST(days: number, now: Date = new Date()): Date {
  return new Date(startOfTodayKST(now).getTime() + days * DAY_MS);
}

/** 한국 시간 기준 날짜 문자열 (YYYY-MM-DD) */
export function kstDateKey(d: Date): string {
  return new Date(d.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}
