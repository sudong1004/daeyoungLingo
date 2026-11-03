import { makeTiles, tokenizeSentence } from "./questions";
import type { DialogueLine, Scenario } from "./scenarios";

export interface PracticeLine extends DialogueLine {
  /** 내 대사일 때: 정답 순서의 단어, 그리고 오답 단어가 섞인 타일 */
  tokens?: string[];
  tiles?: string[];
}

/** 회화 연습용 데이터: 내 대사마다 단어 타일을 섞어서 만듭니다 (서버에서 한 번만 섞음) */
export function buildPractice(s: Scenario): PracticeLine[] {
  const all = s.lines.map((l) => l.en);
  return s.lines.map((l) => {
    if (l.who !== "me") return { ...l };
    const tokens = tokenizeSentence(l.en);
    const others = all.filter((e) => e !== l.en);
    return { ...l, tokens, tiles: makeTiles(tokens, others) };
  });
}
