"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import SentenceBuilder from "@/components/SentenceBuilder";
import Speaker from "@/components/Speaker";
import SpeakingPractice from "@/components/SpeakingPractice";
import { canSpeak } from "@/lib/speech";
import type { PracticeLine } from "@/lib/talk";
import { recordScenarioRun } from "../actions";

type Phase = "listen" | "practice" | "done";
const noopSubscribe = () => () => {};

export default function TalkClient({
  scenarioId,
  title,
  emoji,
  intro,
  lines,
}: {
  scenarioId: string;
  title: string;
  emoji: string;
  intro: string;
  lines: PracticeLine[];
}) {
  const [phase, setPhase] = useState<Phase>("listen");
  const [showKo, setShowKo] = useState(true);
  const [index, setIndex] = useState(0); // 연습 중인 줄
  const [checked, setChecked] = useState<boolean | null>(null); // 내 대사를 확인한 결과
  const [correct, setCorrect] = useState(0);
  const [saved, setSaved] = useState<boolean | null>(null);
  const speechOk = useSyncExternalStore(noopSubscribe, canSpeak, () => true);

  const myTotal = lines.filter((l) => l.who === "me").length;

  function restart() {
    setPhase("practice");
    setIndex(0);
    setChecked(null);
    setCorrect(0);
    setSaved(null);
  }

  function next() {
    setChecked(null);
    if (index + 1 < lines.length) {
      setIndex(index + 1);
      return;
    }
    setPhase("done");
    recordScenarioRun({ scenarioId, correct })
      .then((r) => setSaved(r.ok))
      .catch(() => setSaved(false));
  }

  function onChecked(ok: boolean) {
    setChecked(ok);
    if (ok) setCorrect((c) => c + 1);
  }

  const header = (
    <div className="flex items-center justify-between text-sm">
      <Link href="/talk" className="text-stone-500">
        ← 회화 목록
      </Link>
      {phase === "practice" && (
        <span className="font-medium text-stone-600 dark:text-stone-300">
          {index + 1} / {lines.length}
        </span>
      )}
    </div>
  );

  if (phase === "listen") {
    return (
      <main>
        {header}
        <h1 className="mt-4 text-2xl font-bold">
          {emoji} {title}
        </h1>
        <p className="mt-1 text-sm text-stone-500">{intro}</p>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-stone-400">
            {speechOk ? "🔊 눌러서 한 줄씩 들어 보세요" : "이 브라우저는 음성을 지원하지 않아요"}
          </p>
          <button
            type="button"
            onClick={() => setShowKo((v) => !v)}
            className="rounded-full bg-stone-200 px-3 py-1 text-xs font-medium text-stone-700 dark:bg-stone-800 dark:text-stone-200"
          >
            {showKo ? "한국어 숨기기" : "한국어 보기"}
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {lines.map((l, i) => (
            <Bubble key={i} line={l} showKo={showKo} />
          ))}
        </div>

        <button
          type="button"
          onClick={restart}
          className="mt-6 w-full rounded-xl bg-indigo-600 py-4 text-base font-semibold text-white active:bg-indigo-700"
        >
          내 대사 연습하기
        </button>
      </main>
    );
  }

  if (phase === "done") {
    const perfect = correct === myTotal;
    return (
      <main className="pt-6 text-center">
        {header}
        <p className="mt-6 text-5xl">{perfect ? "🎉" : "👏"}</p>
        <h1 className="mt-3 text-2xl font-bold">
          {correct} / {myTotal} 문장 성공
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          {perfect ? "하나도 안 틀렸어요! 이제 소리 내어 따라 말해 보세요." : "틀린 문장은 다시 연습하면 금방 익숙해져요."}
        </p>
        {saved === false && (
          <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            기록은 저장되지 않았어요. (Supabase 에서 schema.sql 을 다시 실행했는지 확인해 주세요)
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={restart}
            className="rounded-xl bg-indigo-600 py-3.5 font-semibold text-white active:bg-indigo-700"
          >
            한 번 더 연습
          </button>
          <button
            type="button"
            onClick={() => setPhase("listen")}
            className="rounded-xl border border-stone-300 py-3.5 font-medium dark:border-stone-700"
          >
            대화 다시 듣기
          </button>
          <Link
            href="/talk"
            className="rounded-xl border border-stone-300 py-3.5 font-medium dark:border-stone-700"
          >
            다른 회화 고르기
          </Link>
        </div>
      </main>
    );
  }

  // 연습: 지금까지의 대화 + 현재 줄
  const cur = lines[index];
  return (
    <main>
      {header}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${(index / lines.length) * 100}%` }}
        />
      </div>

      <div className="mt-5 space-y-3">
        {lines.slice(0, index).map((l, i) => (
          <Bubble key={i} line={l} showKo />
        ))}

        {cur.who === "other" ? (
          <>
            <Bubble line={cur} showKo highlight />
            <button
              type="button"
              onClick={next}
              className="mt-2 w-full rounded-xl bg-indigo-600 py-3.5 text-base font-semibold text-white active:bg-indigo-700"
            >
              다음
            </button>
          </>
        ) : (
          <section key={index}>
            <div className="rounded-3xl border border-stone-200 bg-white p-5 text-center dark:border-stone-800 dark:bg-stone-900">
              <p className="text-xs font-medium text-stone-400">영어로 말해 보세요</p>
              <p className="mt-2 text-xl font-bold">{cur.ko}</p>
            </div>
            {cur.tokens && cur.tiles && (
              <SentenceBuilder answer={cur.tokens} tiles={cur.tiles} onChecked={onChecked} />
            )}
            {checked !== null && (
              <div className="mt-4">
                <div
                  className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                    checked
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                  }`}
                >
                  {checked ? "정답이에요!" : "아쉬워요. 정답을 보고 따라 말해 보세요."}
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                  <p className="flex-1 text-base font-medium">{cur.en}</p>
                  <Speaker text={cur.en} size="sm" label="문장 듣기" />
                </div>
                <SpeakingPractice target={cur.en} />
                <button
                  type="button"
                  onClick={next}
                  className="mt-3 w-full rounded-xl bg-indigo-600 py-3.5 text-base font-semibold text-white active:bg-indigo-700"
                >
                  {index + 1 < lines.length ? "다음" : "결과 보기"}
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function Bubble({
  line,
  showKo,
  highlight = false,
}: {
  line: PracticeLine;
  showKo: boolean;
  highlight?: boolean;
}) {
  const me = line.who === "me";
  return (
    <div className={`flex ${me ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          me
            ? "bg-indigo-600 text-white"
            : "border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900"
        } ${highlight ? "ring-2 ring-indigo-300" : ""}`}
      >
        <div className="flex items-start gap-2">
          <p className="flex-1 text-base font-medium">{line.en}</p>
          <Speaker text={line.en} size="sm" label="문장 듣기" />
        </div>
        {showKo && (
          <p className={`mt-1 text-sm ${me ? "text-indigo-100" : "text-stone-500"}`}>{line.ko}</p>
        )}
      </div>
    </div>
  );
}
