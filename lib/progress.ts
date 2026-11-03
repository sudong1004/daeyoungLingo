import "server-only";
import type { Word } from "./types";

/**
 * 단어(words)는 모두가 같이 쓰고, 진도(숙련도·틀린 횟수·복습일)는 사용자별로
 * word_progress 표에 따로 저장합니다. 이 조회 문자열로 두 표를 한 번에 가져옵니다.
 */
export const PROGRESS_SELECT =
  "level, next_review_at, correct_count, wrong_count, last_reviewed_at, first_studied_at, created_at, words!inner(id, word, meaning, example)";

export interface ProgressRow {
  level: number;
  next_review_at: string;
  correct_count: number;
  wrong_count: number;
  last_reviewed_at: string | null;
  first_studied_at: string | null;
  created_at: string;
  words: { id: string; word: string; meaning: string; example: string | null };
}

/** word_progress + words 한 행을 기존 Word 모양으로 합칩니다 */
export function toWord(r: ProgressRow): Word {
  return {
    id: r.words.id,
    word: r.words.word,
    meaning: r.words.meaning,
    example: r.words.example,
    level: r.level,
    next_review_at: r.next_review_at,
    correct_count: r.correct_count,
    wrong_count: r.wrong_count,
    last_reviewed_at: r.last_reviewed_at,
    first_studied_at: r.first_studied_at,
    created_at: r.created_at,
  };
}
