import type { QType, Question } from "./types";

type WordLite = { id: string; word: string; meaning: string; example?: string | null };
type StudyWord = WordLite & { example: string | null; level: number };

/** 숙련도별로 나올 수 있는 문제 유형 */
export const TYPES_BY_LEVEL: Record<number, QType[]> = {
  0: ["flashcard", "mc_en_ko"],
  1: ["mc_en_ko", "cloze_mc"],
  2: ["mc_ko_en", "cloze_mc"],
  3: ["listen_meaning", "build_sentence"],
  4: ["listen_word", "cloze_mc", "build_sentence"],
};

/** 문장을 타일(공백 기준 단어)로 나눔. 끝의 문장부호(. , ! ? ; :)는 뗌 — 부호가 정답 단서가 되지 않게 */
export function tokenizeSentence(sentence: string): string[] {
  return sentence
    .trim()
    .split(/\s+/)
    .map((t) => t.replace(/[.,!?;:]+$/, ""))
    .filter(Boolean);
}

const stripPunct = (t: string) => t.toLowerCase().replace(/[^a-z']/g, "");

/** 정답 타일 + 헷갈리는 오답 타일 (다른 단어의 예문에서 가져옴) 을 섞어 만든 보기 */
export function makeTiles(tokens: string[], otherSentences: string[], extraCount = 2): string[] {
  const have = new Set(tokens.map(stripPunct));
  const extras: string[] = [];
  for (const sent of shuffle(otherSentences)) {
    for (const t of shuffle(tokenizeSentence(sent))) {
      const k = stripPunct(t);
      if (!k || have.has(k)) continue;
      have.add(k);
      extras.push(t);
      break;
    }
    if (extras.length >= extraCount) break;
  }
  let tiles = shuffle([...tokens, ...extras]);
  for (let i = 0; i < 5 && tiles.join(" ") === tokens.join(" ") && tiles.length > 1; i++) {
    tiles = shuffle([...tokens, ...extras]);
  }
  return tiles;
}

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

/** 뜻을 조각으로 나눔: "밥, 쌀" → ["밥","쌀"], "형·오빠" → ["형","오빠"] */
function meaningTokens(meaning: string): string[] {
  return meaning
    .replace(/\([^)]*\)/g, "")
    .split(/[,;/·]/)
    .map((t) => t.replace(/[~\s]/g, "").toLowerCase())
    .filter(Boolean);
}

/**
 * 두 단어가 헷갈릴 만큼 뜻이 겹치는지.
 * - 뜻 조각이 같거나 (밥 / 밥)
 * - 한쪽이 다른 쪽을 포함 (안녕 / 안녕하세요, 좋아하다 / 좋아해요)
 */
export function meaningsConflict(a: string, b: string): boolean {
  const ta = meaningTokens(a);
  const tb = meaningTokens(b);
  return ta.some((x) =>
    tb.some((y) => x === y || (Math.min(x.length, y.length) >= 2 && (x.includes(y) || y.includes(x)))),
  );
}

type Cand = { text: string; meaning: string; word: string; example?: string | null };
type Pos = "verb" | "adj" | "phrase" | "noun";

/** 한글 마지막 글자의 받침이 ㄴ 인지 (한/운/은/른/는/인 → 형용사류) */
function endsWithNieun(s: string): boolean {
  const code = s.charCodeAt(s.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 === 4;
}

/** 품사를 대충 짐작: 오답을 같은 종류(동사는 동사끼리)로 뽑기 위함 */
function guessPos(word: string, meaning: string): Pos {
  const m = primaryMeaning(meaning).trim();
  if (/\s|['?!]/.test(word.trim()) || /(요|까|세요)$/.test(m) || /\s/.test(m)) {
    return /^[a-z]+(\s[a-z]+)?$/i.test(word.trim()) && /다$/.test(m) ? "verb" : "phrase";
  }
  if (/다$/.test(m)) return "verb";
  if (endsWithNieun(m)) return "adj";
  return "noun";
}

const STOP = new Set(["the","and","for","you","your","are","was","with","this","that","have","has","can","please","there","not","but","its","his","her","our","from","what","how","let"]);

/** 예문에서 의미 있는 영어 단어만 뽑기 (대상 단어 자신과 짧은/흔한 단어는 제외) */
function exampleTokens(example: string | null | undefined, word: string): Set<string> {
  const self = word.toLowerCase();
  return new Set(
    (example ?? "")
      .toLowerCase()
      .split(/[^a-z']+/)
      .filter((t) => t.length >= 3 && !STOP.has(t) && !self.includes(t) && !t.includes(self)),
  );
}

/** 예문이 비슷한 단어는 같은 상황/주제일 가능성이 높음 (eat 이 들어간 음식끼리 등) */
function exampleOverlap(a: Cand, b: Cand): number {
  const ta = exampleTokens(a.example, a.word);
  const tb = exampleTokens(b.example, b.word);
  if (ta.size === 0 || tb.size === 0) return 0;
  let hit = 0;
  for (const t of ta) if (tb.has(t)) hit++;
  return hit / (ta.size + tb.size - hit);
}

function charOverlap(a: string, b: string): number {
  const sa = new Set(a);
  const sb = new Set(b);
  let hit = 0;
  for (const c of sa) if (sb.has(c)) hit++;
  return hit / Math.max(sa.size, sb.size, 1);
}

/** 정답과 얼마나 헷갈리는지 (클수록 헷갈림) */
function confusability(answer: Cand, c: Cand, byWord: boolean): number {
  let score = 0;
  if (guessPos(answer.word, answer.meaning) === guessPos(c.word, c.meaning)) score += 3;
  score += 4 * exampleOverlap(answer, c);
  if (byWord) {
    // 영어 단어를 고르는 문제: 철자가 비슷할수록 헷갈림
    const a = answer.text.toLowerCase();
    const b = c.text.toLowerCase();
    score += 4 * (1 - levenshtein(a, b) / Math.max(a.length, b.length, 1));
    if (a[0] === b[0]) score += 0.7;
    if (a.at(-1) === b.at(-1)) score += 0.5;
  } else {
    // 뜻을 고르는 문제: 글자 수와 글자가 비슷할수록, 같은 어미일수록 헷갈림
    const a = answer.text;
    const b = c.text;
    score += 2 * charOverlap(a, b);
    score += 1.5 * (1 - Math.abs(a.length - b.length) / Math.max(a.length, b.length, 1));
    if (a.at(-1) === b.at(-1)) score += 1;
  }
  return score;
}

/**
 * 정답과 헷갈리지만 정답은 아닌 오답 보기 3개. 후보가 모자라면 null.
 * - 뜻이 정답과 겹치는 후보(동의어 등)는 뺌: 실제로 정답이 될 수 있으니까
 * - 품사가 같고 모양이 비슷한 후보를 우선: 숙련도가 높을수록 더 비슷한 것만
 * - 걸러내고 3개가 안 남으면(단어장이 작을 때) 조건을 풀어 채움
 */
function pickDistractors(
  answer: Cand,
  candidates: Cand[],
  byWord: boolean,
  level: number,
): string[] | null {
  const seen = new Set<string>();
  const uniq = candidates.filter((c) => {
    const k = c.text.toLowerCase();
    if (!c.text || k === answer.text.toLowerCase() || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  if (uniq.length < 3) return null;

  // 숙련도 0~1: 비슷한 후보 12개 중에서 무작위, 2: 8개, 3 이상: 가장 비슷한 5개
  const topK = level <= 1 ? 12 : level === 2 ? 8 : 5;
  const ranked = [...uniq]
    .map((c) => ({ c, s: confusability(answer, c, byWord) + Math.random() * 0.6 }))
    .sort((x, y) => y.s - x.s)
    .map((x) => x.c);

  const chosen: Cand[] = [];
  const tryAdd = (list: Cand[]) => {
    for (const c of list) {
      if (chosen.length >= 3) break;
      if (chosen.includes(c)) continue;
      if (meaningsConflict(answer.meaning, c.meaning)) continue;
      if (chosen.some((x) => meaningsConflict(x.meaning, c.meaning))) continue;
      chosen.push(c);
    }
  };
  tryAdd(shuffle(ranked.slice(0, topK)));
  if (chosen.length < 3) tryAdd(ranked);
  if (chosen.length < 3) {
    for (const c of ranked) {
      if (chosen.length >= 3) break;
      if (!chosen.includes(c)) chosen.push(c);
    }
  }
  return chosen.map((c) => c.text);
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
    pickDistractors(
      { text: w.word, meaning: w.meaning, word: w.word, example: w.example },
      others.map((o) => ({ text: o.word, meaning: o.meaning, word: o.word, example: o.example })),
      true,
      level,
    );
  const meaningOpts = () =>
    pickDistractors(
      { text: primary, meaning: w.meaning, word: w.word, example: w.example },
      others.map((o) => ({ text: primaryMeaning(o.meaning), meaning: o.meaning, word: o.word, example: o.example })),
      false,
      level,
    );

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
    if (type === "build_sentence") {
      const sentence = w.example?.trim().replace(/\s+/g, " ");
      const tokens = sentence ? tokenizeSentence(sentence) : [];
      if (sentence && tokens.length >= 3 && tokens.length <= 10) {
        const others2 = others.map((o) => o.example).filter((e): e is string => Boolean(e));
        return {
          ...base,
          type,
          options: [],
          answer: tokens.join(" "),
          sentenceTokens: tokens,
          tiles: makeTiles(tokens, others2),
        };
      }
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
