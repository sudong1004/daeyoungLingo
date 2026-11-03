export interface BulkRow {
  word: string;
  meaning: string;
  example: string | null;
}

/**
 * 한 줄에 단어 하나. 칸은 탭 또는 | 로 구분: 단어 | 뜻 | 예문(선택)
 * 구분자가 없으면 쉼표로 최대 3칸(단어, 뜻, 예문)으로 나눕니다.
 * (뜻이 여러 개일 땐 | 나 탭을 쓰세요: apple | 사과, 사과나무 | I ate an apple.)
 */
export function parseBulk(text: string): BulkRow[] {
  const rows: BulkRow[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    let parts: string[];
    if (line.includes("\t")) parts = line.split("\t");
    else if (line.includes("|")) parts = line.split("|");
    else {
      const [a, b, ...rest] = line.split(",");
      parts = [a, b ?? "", rest.join(",")];
    }
    const [word, meaning, example] = parts.map((p) => (p ?? "").trim());
    if (!word || !meaning) continue;
    rows.push({ word, meaning, example: example || null });
  }
  return rows;
}
