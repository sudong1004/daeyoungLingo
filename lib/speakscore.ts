// 말하기 채점: 음성 인식 결과(heard)가 목표 문장(target)과 얼마나 맞는지 단어 단위로 비교합니다.
// 인식기는 숫자를 "4"처럼 적거나 대소문자·문장부호가 제각각이라 먼저 정규화합니다.

const NUM_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
];

const IRREGULAR: Record<string, string[]> = {
  "can't": ["can", "not"],
  cannot: ["can", "not"],
  "won't": ["will", "not"],
  "let's": ["let", "us"],
  "i'm": ["i", "am"],
};

/** 축약형을 풀어서 "I'd" 와 "I would" 처럼 인식기가 다르게 적어도 같게 봄 */
function expandContraction(w: string): string[] {
  if (IRREGULAR[w]) return IRREGULAR[w];
  let m: RegExpMatchArray | null;
  if ((m = w.match(/^(.+)n't$/))) return [m[1], "not"];
  if ((m = w.match(/^(.+)'re$/))) return [m[1], "are"];
  if ((m = w.match(/^(.+)'ll$/))) return [m[1], "will"];
  if ((m = w.match(/^(.+)'ve$/))) return [m[1], "have"];
  if ((m = w.match(/^(.+)'d$/))) return [m[1], "would"];
  if ((m = w.match(/^(it|he|she|that|what|there|here|how|where|who)'s$/))) return [m[1], "is"];
  return [w];
}

/** 소문자·부호 제거·20 이하 숫자는 영어 단어로·축약형 풀기 */
export function normalizeWords(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^'+|'+$/g, ""))
    .filter(Boolean)
    .map((w) => (/^\d+$/.test(w) && Number(w) <= 20 ? NUM_WORDS[Number(w)] : w))
    .flatMap(expandContraction);
}

function lev(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[b.length];
}

/** 같은 단어로 쳐 줄지: 완전히 같거나, 긴 단어(5자 이상)에서 한 글자 차이 (인식 오차 허용) */
function same(a: string, b: string): boolean {
  if (a === b) return true;
  return Math.max(a.length, b.length) >= 5 && lev(a, b) <= 1;
}

export interface SpeechScore {
  /** 맞힌 단어 비율 0~1 */
  score: number;
  pass: boolean;
  /** 목표 문장의 단어(원래 표기)와 제대로 말했는지 */
  words: { text: string; ok: boolean }[];
}

/** 단어를 놓쳐도 통과로 봐 주는 개수: 5단어 이하는 0개, 6~11단어는 1개, 12단어 이상은 2개 */
export function allowedMisses(tokenCount: number): number {
  return Math.floor(tokenCount / 6);
}

export function scoreSpeech(target: string, heard: string): SpeechScore {
  const tokens = target.trim().split(/\s+/).filter(Boolean);
  // 표시용 토큰마다 정규화된 단어(0개 이상)를 연결
  const flat: { word: string; token: number }[] = [];
  tokens.forEach((t, ti) => normalizeWords(t).forEach((w) => flat.push({ word: w, token: ti })));
  const said = normalizeWords(heard);

  // 최장 공통 부분수열(LCS)로 순서를 지킨 일치 단어를 찾음
  const n = flat.length;
  const m = said.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = same(flat[i - 1].word, said[j - 1])
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const matched = new Array<boolean>(n).fill(false);
  for (let i = n, j = m; i > 0 && j > 0; ) {
    if (same(flat[i - 1].word, said[j - 1]) && dp[i][j] === dp[i - 1][j - 1] + 1) {
      matched[i - 1] = true;
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
    else j--;
  }

  const tokenOk = tokens.map(() => true);
  const tokenHas = tokens.map(() => false);
  flat.forEach((f, idx) => {
    tokenHas[f.token] = true;
    if (!matched[idx]) tokenOk[f.token] = false;
  });
  const score = n === 0 ? 0 : dp[n][m] / n;
  const missed = tokens.filter((_, i) => tokenHas[i] && !tokenOk[i]).length;
  return {
    score,
    pass: n > 0 && missed <= allowedMisses(tokens.length),
    words: tokens.map((text, i) => ({ text, ok: tokenHas[i] ? tokenOk[i] : true })),
  };
}

/** 인식기가 여러 후보를 주면 가장 점수가 높은 것을 채택 */
export function bestScore(target: string, candidates: string[]): SpeechScore & { heard: string } {
  let best: (SpeechScore & { heard: string }) | null = null;
  for (const c of candidates) {
    const s = scoreSpeech(target, c);
    if (!best || s.score > best.score) best = { ...s, heard: c };
  }
  return best ?? { ...scoreSpeech(target, ""), heard: "" };
}
