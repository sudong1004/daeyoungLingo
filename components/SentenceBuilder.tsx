"use client";

import { useState } from "react";

/**
 * 문장 만들기: 아래 단어 카드를 순서대로 눌러 문장을 완성합니다.
 * tiles 는 이미 섞인 상태로 받고(정답 단어 + 헷갈리게 하는 오답 단어), answer 는 정답 순서입니다.
 * 확인하면 onChecked(맞았는지) 를 한 번 호출합니다. 다음 문제로 가면 부모가 key 를 바꿔 초기화하세요.
 */
export default function SentenceBuilder({
  answer,
  tiles,
  onChecked,
}: {
  answer: string[];
  tiles: string[];
  onChecked: (correct: boolean) => void;
}) {
  const [picked, setPicked] = useState<number[]>([]); // tiles 의 인덱스, 누른 순서
  const [result, setResult] = useState<boolean | null>(null);

  const done = result !== null;
  const remaining = tiles.map((_, i) => i).filter((i) => !picked.includes(i));
  const attempt = picked.map((i) => tiles[i]);

  function check() {
    if (done || picked.length === 0) return;
    const correct =
      attempt.length === answer.length && attempt.every((t, i) => t === answer[i]);
    setResult(correct);
    onChecked(correct);
  }

  return (
    <div className="mt-4">
      <div
        className={`flex min-h-16 flex-wrap content-start gap-2 rounded-2xl border-2 p-3 ${
          result === null
            ? "border-stone-300 bg-white dark:border-stone-700 dark:bg-stone-900"
            : result
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950"
              : "border-red-400 bg-red-50 dark:bg-red-950"
        }`}
        aria-label="내가 만든 문장"
      >
        {picked.length === 0 && (
          <span className="self-center text-sm text-stone-400">
            아래 단어를 순서대로 눌러 보세요
          </span>
        )}
        {picked.map((i, pos) => (
          <button
            key={`${i}-${pos}`}
            type="button"
            disabled={done}
            onClick={() => setPicked(picked.filter((x) => x !== i))}
            className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-base font-medium shadow-sm active:bg-stone-100 dark:border-stone-600 dark:bg-stone-800"
          >
            {tiles[i]}
          </button>
        ))}
      </div>

      {!done && (
        <div className="mt-4 flex min-h-16 flex-wrap justify-center gap-2">
          {remaining.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPicked([...picked, i])}
              className="rounded-xl border-2 border-stone-200 bg-stone-50 px-3 py-2 text-base font-medium active:bg-indigo-50 dark:border-stone-700 dark:bg-stone-900"
            >
              {tiles[i]}
            </button>
          ))}
        </div>
      )}

      {!done && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={picked.length === 0}
            onClick={() => setPicked([])}
            className="rounded-xl bg-stone-200 py-3 text-sm font-semibold text-stone-700 disabled:opacity-40 dark:bg-stone-800 dark:text-stone-200"
          >
            다시
          </button>
          <button
            type="button"
            disabled={picked.length === 0}
            onClick={check}
            className="col-span-2 rounded-xl bg-indigo-600 py-3 text-base font-semibold text-white disabled:opacity-40 active:bg-indigo-700"
          >
            확인
          </button>
        </div>
      )}

      {done && !result && (
        <p className="mt-3 text-center text-sm text-stone-500">
          정답: <span className="font-semibold text-stone-800 dark:text-stone-100">{answer.join(" ")}</span>
        </p>
      )}
    </div>
  );
}
