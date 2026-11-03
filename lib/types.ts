export type QType =
  | "flashcard"
  | "mc_en_ko"
  | "mc_ko_en"
  | "cloze_mc"
  | "listen_meaning"
  | "listen_word";

export const Q_TYPES: QType[] = [
  "flashcard",
  "mc_en_ko",
  "mc_ko_en",
  "cloze_mc",
  "listen_meaning",
  "listen_word",
];

export interface Word {
  id: string;
  word: string;
  meaning: string;
  example: string | null;
  level: number;
  next_review_at: string;
  correct_count: number;
  wrong_count: number;
  last_reviewed_at: string | null;
  first_studied_at: string | null;
  created_at: string;
}

/** 학습 화면에 내려보내는 문제 한 개 */
export interface Question {
  key: string;
  wordId: string;
  type: QType;
  word: string;
  meaning: string; // 저장된 뜻 전체 (쉼표로 여러 개)
  primaryMeaning: string; // 정답으로 쓰는 대표 뜻
  example: string | null;
  /** 예문 빈칸 문제일 때 빈칸이 들어간 예문 */
  cloze?: string;
  options: string[];
  answer: string;
}
