import type { QType, Question } from "./types";

type WordLite = { id: string; word: string; meaning: string };
type StudyWord = WordLite & { example: string | null; level: number };

/** 숙련도별로 나올 수 있는 문제 유형 */
export const TYPES_BY_LEVEL: Record<number, QType[]> = {
  0: ["flashcard", "mc_en_ko"],
  1: ["mc_en_ko", "cloze_mc"],
  2: ["mc_ko_en", "cloze_mc"],
  3: ["listen_meaning"],
  4: ["listen_word", "cloze_mc"],
};

export function primaryMeaning(meaning: string): string {
  const first = meaning.split(",")[0]?.trim();
  return first || meaning.trim();
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] =
        a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[n];
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * 예문에서 단어(변화형 포함)를 찾아 ____ 로 바꿉니다. 못 찾으면 null.
 * 예: leave → "He was reluctant to leave." / leaving, left 는 불규칙형이라 못 찾음
 */
export function makeCloze(example: string | null, word: string): string | null {
  const w = word.trim();
  const ex = example?.trim();
  if (!w || !ex) return null;

  const alts: string[] = [`${esc(w)}(?:s|es|ed|d|ing|ly|er|est)?`];
  const derived: string[] = [];
  if (/e$/i.test(w)) derived.push(`${esc(w.slice(0, -1))}(?:ing|ed|er|est)`);
  if (/[^aeiou]y$/i.test(w))
    derived.push(`${esc(w.slice(0, -1))}(?:ies|ied|ier|iest|ily)`);
  if (/[a-z]$/i.test(w)) derived.push(`${esc(w + w.slice(-1))}(?:ed|ing|er|est)`);
  alts.push(...derived);

  const re = new RegExp(`(?<![A-Za-z])(?:${alts.join("|")})(?![A-Za-z])`, "i");
  if (!re.test(ex)) return null;
  return ex.replace(re, "____");
}

/** 정답과 겹치지 않는 오답 보기 3개. 후보가 모자라면 null */
function pickDistractors(
  answer: string,
  candidates: string[],
  similarSpelling: boolean,
): string[] | null {
  const uniq = [
    ...new Set(
      candidates.filter((c) => c && c.toLowerCase() !== answer.toLowerCase()),
    ),
  ];
  if (uniq.length < 3) return null;
  let pool = uniq;
  if (similarSpelling) {
    pool = [...uniq]
      .sort((x, y) => levenshtein(answer, x) - levenshtein(answer, y))
      .slice(0, 6);
  }
  return shuffle(pool).slice(0, 3);
}

/**
 * 단어 하나에 대한 문제 한 개를 만듭니다.
 * - 객관식: 단어장에 다른 단어가 4개 이상 있어야 낼 수 있음 (오답 보기 3개 필요)
 * - 예문 빈칸: 예문 안에서 단어를 찾을 수 있어야 함
 * - 위 조건이 안 맞는 유형은 건너뛰고, 낼 수 있는 게 없으면 플래시카드
 */
export function buildQuestion(
  w: StudyWord,
  pool: WordLite[],
  level: number = w.level,
): Question {
  const others = pool.filter((p) => p.id !== w.id);
  const primary = primaryMeaning(w.meaning);
  const base = {
    key: `${w.id}-${Math.random().toString(36).slice(2, 8)}`,
    wordId: w.id,
    word: w.word,
    meaning: w.meaning,
    primaryMeaning: primary,
    example: w.example,
  };

  const wordOpts = () =>
    pickDistractors(w.word, others.map((o) => o.word), true);
  const meaningOpts = () =>
    pickDistractors(primary, others.map((o) => primaryMeaning(o.meaning)), false);

  const candidates = shuffle(TYPES_BY_LEVEL[Math.min(Math.max(level, 0), 4)]);
  for (const type of candidates) {
    if (type === "flashcard") {
      return { ...base, type, options: [], answer: w.word };
    }
    if (type === "mc_en_ko" || type === "listen_meaning") {
      const d = meaningOpts();
      if (d) return { ...base, type, options: shuffle([primary, ...d]), answer: primary };
    }
    if (type === "mc_ko_en" || type === "listen_word") {
      const d = wordOpts();
      if (d) return { ...base, type, options: shuffle([w.word, ...d]), answer: w.word };
    }
    if (type === "cloze_mc") {
      const cloze = makeCloze(w.example, w.word);
      const d = wordOpts();
      if (cloze && d) {
        return { ...base, type, cloze, options: shuffle([w.word, ...d]), answer: w.word };
      }
    }
  }
  return { ...base, type: "flashcard", options: [], answer: w.word };
}
