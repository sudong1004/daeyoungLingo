"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { listenOnce, recognitionSupported } from "@/lib/recognition";
import { bestScore, type SpeechScore } from "@/lib/speakscore";

type State =
  | { kind: "idle" }
  | { kind: "listening" }
  | { kind: "done"; result: SpeechScore & { heard: string } }
  | { kind: "error"; message: string };

const noopSubscribe = () => () => {};

const ERROR_TEXT: Record<string, string> = {
  "not-allowed": "마이크 사용을 허용해 주세요. (주소창의 자물쇠 아이콘 → 마이크 허용)",
  "service-not-allowed": "마이크 사용을 허용해 주세요.",
  "no-speech": "소리가 들리지 않았어요. 다시 눌러서 말해 보세요.",
  "audio-capture": "마이크를 찾지 못했어요.",
  network: "음성 인식 서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.",
};

/**
 * 따라 말하기: 마이크로 말하면 목표 문장과 비교해서 단어별로 맞았는지 보여 줍니다.
 * 소리는 브라우저의 음성 인식 기능으로만 처리되고 앱 서버에는 저장되지 않아요.
 */
export default function SpeakingPractice({ target }: { target: string }) {
  const supported = useSyncExternalStore(noopSubscribe, recognitionSupported, () => true);
  const [state, setState] = useState<State>({ kind: "idle" });
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => () => stopRef.current?.(), []);

  if (!supported) {
    return (
      <p className="mt-3 text-xs text-stone-400">
        🎤 이 브라우저에서는 말하기 연습을 쓸 수 없어요. 크롬이나 사파리(최신)에서 열어 보세요.
      </p>
    );
  }

  function start() {
    stopRef.current?.();
    let failed = false;
    setState({ kind: "listening" });
    stopRef.current = listenOnce({
      onResult: (list) => setState({ kind: "done", result: bestScore(target, list) }),
      onError: (code) => {
        failed = true;
        setState({ kind: "error", message: ERROR_TEXT[code] ?? `음성 인식에 실패했어요 (${code}).` });
      },
      onEnd: () =>
        setState((s) =>
          s.kind === "listening" && !failed
            ? { kind: "error", message: ERROR_TEXT["no-speech"] }
            : s,
        ),
    });
  }

  const listening = state.kind === "listening";

  return (
    <div className="mt-3 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={start}
          disabled={listening}
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl text-white ${
            listening ? "animate-pulse bg-red-500" : "bg-indigo-600 active:bg-indigo-700"
          }`}
          aria-label={listening ? "듣는 중" : "따라 말하기"}
        >
          🎤
        </button>
        <p className="text-sm text-stone-600 dark:text-stone-300">
          {listening
            ? "듣고 있어요… 문장을 말해 보세요"
            : state.kind === "done"
              ? state.result.pass
                ? "발음이 좋아요! 👏"
                : "조금만 더! 빨간 단어를 다시 말해 보세요"
              : "버튼을 누르고 위 문장을 따라 말해 보세요"}
        </p>
      </div>

      {state.kind === "done" && (
        <div className="mt-3">
          <p className="text-base leading-relaxed">
            {state.result.words.map((w, i) => (
              <span
                key={i}
                className={`mr-1.5 inline-block font-medium ${
                  w.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 underline decoration-wavy"
                }`}
              >
                {w.text}
              </span>
            ))}
          </p>
          <p className="mt-1 text-xs text-stone-400">
            인식된 말: “{state.result.heard || "…"}” · {Math.round(state.result.score * 100)}%
          </p>
        </div>
      )}
      {state.kind === "error" && (
        <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">{state.message}</p>
      )}
    </div>
  );
}
