"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useSyncExternalStore } from "react";
import SentenceBuilder from "@/components/SentenceBuilder";
import SpeakingPractice from "@/components/SpeakingPractice";
import Speaker from "@/components/Speaker";
import { shuffle } from "@/lib/questions";
import { canSpeak } from "@/lib/speech";
import type { Question } from "@/lib/types";
import { submitAnswer } from "./actions";

type Phase = "main" | "retry";
type Answered = { correct: boolean; picked: string } | null;

const noopSubscribe = () => () => {};

export default function StudyClient({ questions }: { questions: Question[] }) {
  const [queue, setQueue] = useState<Question[]>(questions);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("main");
  const [answered, setAnswered] = useState<Answered>(null);
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  const [mainTotal, setMainTotal] = useState(0);
  const [mainCorrect, setMainCorrect] = useState(0);
  const [wrongWords, setWrongWords] = useState<Question[]>([]);
  const [saveError, setSaveError] = useState(false);

  // 본 세션에서 틀린 문제 (다시 풀기 단계에서 사용). state 반영 전에 읽어야 해서 ref로도 보관
  const wrongRef = useRef<Question[]>([]);

  // 음성 합성을 못 쓰는 브라우저면 듣기 문제에서 단어를 글자로 보여 줌
  const speechOk = useSyncExternalStore(noopSubscribe, canSpeak, () => true);

  const router = useRouter();
  const q = queue[index];

  function commit(question: Question, correct: boolean) {
    submitAnswer({
      wordId: question.wordId,
      type: question.type,
      correct,
      isRetry: phase === "retry",
    }).catch(() => setSaveError(true));

    if (phase === "main") {
      setMainTotal((t) => t + 1);
      if (correct) setMainCorrect((c) => c + 1);
      else {
        wrongRef.current = [...wrongRef.current, question];
        setWrongWords(wrongRef.current);
      }
    }
  }

  function startRetry(list: Question[]) {
    setQueue(
      shuffle(
        list.map((x) => ({
          ...x,
          options: shuffle(x.options),
          tiles: x.tiles ? shuffle(x.tiles) : undefined,
        })),
      ),
    );
    setIndex(0);
    setPhase("retry");
    setAnswered(null);
    setFlipped(false);
    setFinished(false);
  }

  function advance() {
    setAnswered(null);
    setFlipped(false);
    if (index + 1 < queue.length) {
      setIndex(index + 1);
      return;
    }
    if (phase === "main" && wrongRef.current.length > 0) {
      startRetry(wrongRef.current);
      return;
    }
    setFinished(true);
  }

  function onPick(option: string) {
    if (answered) return;
    const correct = option === q.answer;
    commit(q, correct);
    setAnswered({ correct, picked: option });
  }

  function onBuilt(correct: boolean) {
    commit(q, correct);
    setAnswered({ correct, picked: "" });
  }

  function onRate(correct: boolean) {
    commit(q, correct);
    advance();
  }

  if (finished) {
    return (
      <Result
        total={mainTotal}
        correct={mainCorrect}
        wrong={wrongWords}
        saveError={saveError}
        onRetry={() => startRetry(wrongWords)}
        onNextSession={() => router.push(`/study?s=${Date.now()}`)}
      />
    );
  }

  const isListen = q.type === "listen_meaning" || q.type === "listen_word";
  const progress = ((index + (answered ? 1 : 0)) / queue.length) * 100;

  return (
    <main>
      <div className="flex items-center justify-between text-sm">
        <Link href="/" className="text-stone-500">
          ← 그만하기
        </Link>
        <span className="font-medium text-stone-600 dark:text-stone-300">
          {phase === "retry" && (
            <span className="mr-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              틀린 문제 다시
            </span>
          )}
          {index + 1} / {queue.length}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {saveError && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          기록 저장에 실패한 문제가 있어요. 인터넷 연결을 확인해 주세요.
        </p>
      )}

      {q.type === "flashcard" ? (
        <FlashCard key={q.key} q={q} flipped={flipped} onFlip={() => setFlipped(true)} onRate={onRate} />
      ) : (
        <section key={q.key} className="mt-6">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 text-center dark:border-stone-800 dark:bg-stone-900">
            <p className="text-xs font-medium text-stone-400">{promptLabel(q)}</p>

            {q.type === "mc_en_ko" && (
              <div className="mt-3 flex items-center justify-center gap-3">
                <span className="text-3xl font-bold">{q.word}</span>
                <Speaker text={q.word} size="sm" />
              </div>
            )}
            {q.type === "mc_ko_en" && (
              <div className="mt-3">
                <p className="text-3xl font-bold">{q.primaryMeaning}</p>
                {q.meaning.trim() !== q.primaryMeaning && (
                  <p className="mt-1 text-sm text-stone-400">({q.meaning})</p>
                )}
              </div>
            )}
            {q.type === "cloze_mc" && q.cloze && (
              <>
                <p className="mt-3 text-xl font-semibold leading-relaxed">
                  <Cloze text={q.cloze} filled={answered ? q.word : null} />
                </p>
                <p className="mt-3 inline-block rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  빈칸의 뜻: {q.primaryMeaning}
                </p>
              </>
            )}
            {q.type === "build_sentence" && (
              <div className="mt-3 flex flex-col items-center gap-3">
                {speechOk ? (
                  <>
                    <Speaker text={q.answer} size="lg" />
                    {!answered && (
                      <p className="text-xs text-stone-400">
                        버튼을 눌러 문장을 듣고, 들은 대로 완성해 보세요
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-lg font-semibold">{q.answer}</p>
                )}
                <p className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  핵심 단어: {q.word} ({q.primaryMeaning})
                </p>
              </div>
            )}
            {isListen && (
              <div className="mt-3 flex flex-col items-center gap-3">
                {speechOk ? (
                  <Speaker text={q.word} size="lg" />
                ) : (
                  <p className="text-3xl font-bold">{q.word}</p>
                )}
                {speechOk && !answered && (
                  <p className="text-xs text-stone-400">버튼을 눌러 발음을 들어 보세요</p>
                )}
              </div>
            )}
          </div>

          {q.type === "build_sentence" && q.sentenceTokens && q.tiles && (
            <SentenceBuilder
              key={q.key}
              answer={q.sentenceTokens}
              tiles={q.tiles}
              onChecked={onBuilt}
            />
          )}

          <div className="mt-4 grid gap-2.5">
            {q.options.map((opt) => (
              <OptionButton
                key={opt}
                label={opt}
                state={optionState(opt, q.answer, answered)}
                disabled={Boolean(answered)}
                onClick={() => onPick(opt)}
              />
            ))}
          </div>

          {answered && (
            <div className="mt-4">
              <div
                className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                  answered.correct
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                }`}
              >
                {answered.correct ? "정답이에요!" : `아쉬워요. 정답은 “${q.answer}”`}
              </div>
              <Reveal q={q} />
              <button
                type="button"
                onClick={advance}
                className="mt-3 w-full rounded-xl bg-indigo-600 py-3.5 text-base font-semibold text-white active:bg-indigo-700"
              >
                {index + 1 < queue.length ? "다음" : phase === "main" && wrongWords.length > 0 ? "틀린 문제 다시 풀기" : "결과 보기"}
              </button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function promptLabel(q: Question): string {
  switch (q.type) {
    case "mc_en_ko":
      return "뜻을 고르세요";
    case "mc_ko_en":
      return "알맞은 영어를 고르세요";
    case "cloze_mc":
      return "빈칸에 들어갈 말을 고르세요";
    case "listen_meaning":
      return "듣고 뜻을 고르세요";
    case "listen_word":
      return "듣고 알맞은 단어를 고르세요";
    case "build_sentence":
      return "듣고 문장을 완성하세요";
    default:
      return "";
  }
}

function optionState(opt: string, answer: string, answered: Answered): "idle" | "correct" | "wrong" | "dim" {
  if (!answered) return "idle";
  if (opt === answer) return "correct";
  if (opt === answered.picked) return "wrong";
  return "dim";
}

function OptionButton({
  label,
  state,
  disabled,
  onClick,
}: {
  label: string;
  state: "idle" | "correct" | "wrong" | "dim";
  disabled: boolean;
  onClick: () => void;
}) {
  const style = {
    idle: "border-stone-300 bg-white active:bg-indigo-50 dark:border-stone-700 dark:bg-stone-900",
    correct: "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    wrong: "border-red-400 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200",
    dim: "border-stone-200 bg-white text-stone-400 dark:border-stone-800 dark:bg-stone-900",
  }[state];
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full rounded-2xl border-2 px-4 py-4 text-left text-lg font-medium transition-colors ${style}`}
    >
      {label}
    </button>
  );
}

/** 빈칸(____)이 들어간 예문. 정답을 풀면 빈칸에 단어를 채워 보여 줌 */
function Cloze({ text, filled }: { text: string; filled: string | null }) {
  const parts = text.split("____");
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 &&
            (filled ? (
              <span className="text-indigo-600 dark:text-indigo-300">{filled}</span>
            ) : (
              <span className="mx-1 inline-block w-16 border-b-2 border-stone-400 align-baseline">&nbsp;</span>
            ))}
        </span>
      ))}
    </>
  );
}

/** 문제를 푼 뒤 보여 주는 단어 정보 */
function Reveal({ q }: { q: Question }) {
  return (
    <div className="mt-3 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold">{q.word}</span>
        <Speaker text={q.word} size="sm" />
      </div>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{q.meaning}</p>
      {q.example && (
        <div className="mt-2 flex items-start gap-2">
          <p className="flex-1 text-sm italic text-stone-500">{q.example}</p>
          <Speaker text={q.example} size="sm" label="예문 듣기" />
        </div>
      )}
      {q.example && <SpeakingPractice target={q.example} />}
    </div>
  );
}

function FlashCard({
  q,
  flipped,
  onFlip,
  onRate,
}: {
  q: Question;
  flipped: boolean;
  onFlip: () => void;
  onRate: (correct: boolean) => void;
}) {
  return (
    <section className="mt-6">
      <div
        role="button"
        tabIndex={0}
        onClick={onFlip}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onFlip()}
        className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-3xl border border-stone-200 bg-white p-6 text-center dark:border-stone-800 dark:bg-stone-900"
      >
        <div className="flex items-center gap-3">
          <span className="text-4xl font-bold">{q.word}</span>
          <Speaker text={q.word} size="md" />
        </div>
        {flipped ? (
          <div className="mt-5">
            <p className="text-2xl font-semibold text-indigo-600 dark:text-indigo-300">{q.meaning}</p>
            {q.example && (
              <div className="mt-3 flex items-start justify-center gap-2">
                <p className="text-sm italic text-stone-500">{q.example}</p>
                <Speaker text={q.example} size="sm" label="예문 듣기" />
              </div>
            )}
          </div>
        ) : (
          <p className="mt-6 text-sm text-stone-400">탭해서 뜻 보기</p>
        )}
      </div>

      {flipped && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onRate(false)}
            className="rounded-2xl bg-red-50 py-4 text-lg font-semibold text-red-700 active:bg-red-100 dark:bg-red-950 dark:text-red-300"
          >
            몰라요
          </button>
          <button
            type="button"
            onClick={() => onRate(true)}
            className="rounded-2xl bg-emerald-50 py-4 text-lg font-semibold text-emerald-700 active:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300"
          >
            알아요
          </button>
        </div>
      )}
    </section>
  );
}

function Result({
  total,
  correct,
  wrong,
  saveError,
  onRetry,
  onNextSession,
}: {
  total: number;
  correct: number;
  wrong: Question[];
  saveError: boolean;
  onRetry: () => void;
  onNextSession: () => void;
}) {
  const perfect = total > 0 && correct === total;
  return (
    <main>
      <div className="pt-6 text-center">
        <p className="text-5xl">{perfect ? "🎉" : "👏"}</p>
        <h1 className="mt-3 text-2xl font-bold">
          {total}개 중 {correct}개 맞혔어요
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          {perfect ? "하나도 안 틀렸어요!" : "틀린 단어는 내일 다시 나와요. 단어장의 ‘틀린 단어’에서 따로 볼 수 있어요."}
        </p>
      </div>

      {saveError && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          일부 기록이 저장되지 않았을 수 있어요.
        </p>
      )}

      {wrong.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-stone-500">틀린 단어</h2>
          <ul className="mt-2 space-y-2">
            {wrong.map((w) => (
              <li
                key={w.key}
                className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold">{w.word}</span>
                  <Speaker text={w.word} size="sm" />
                </div>
                <p className="mt-0.5 text-sm text-stone-600 dark:text-stone-300">{w.meaning}</p>
                {w.example && <p className="mt-1 text-sm italic text-stone-400">{w.example}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 grid gap-2.5">
        {wrong.length > 0 && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-xl bg-indigo-600 py-3.5 text-base font-semibold text-white active:bg-indigo-700"
          >
            틀린 단어만 다시
          </button>
        )}
        <button
          type="button"
          onClick={onNextSession}
          className="rounded-xl border border-stone-300 py-3.5 text-base font-medium active:bg-stone-100 dark:border-stone-700 dark:active:bg-stone-900"
        >
          한 세션 더
        </button>
        <Link
          href="/"
          className="rounded-xl py-3 text-center text-sm text-stone-500"
        >
          홈으로
        </Link>
      </div>
    </main>
  );
}
