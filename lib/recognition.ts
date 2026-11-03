"use client";

// 브라우저 음성 인식(Web Speech API). 크롬/엣지/사파리(iOS 14.5+)에서 되고, 파이어폭스는 안 돼요.
// TypeScript 기본 타입에 없어서 필요한 부분만 직접 선언합니다.

interface RecEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
interface RecErrorEvent {
  error: string;
}
interface Rec {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((e: RecEvent) => void) | null;
  onerror: ((e: RecErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecCtor = new () => Rec;

function getCtor(): RecCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecCtor; webkitSpeechRecognition?: RecCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function recognitionSupported(): boolean {
  return getCtor() !== null;
}

export interface ListenHandlers {
  /** 인식된 후보 문장들 (정확도 높은 순) */
  onResult: (transcripts: string[]) => void;
  /** 오류 코드: not-allowed(마이크 거부), no-speech(소리 없음), audio-capture(마이크 없음), network 등 */
  onError: (code: string) => void;
  onEnd: () => void;
}

/** 한 문장을 듣고 끝냅니다. 반환된 함수로 중간에 멈출 수 있어요. */
export function listenOnce(h: ListenHandlers): () => void {
  const Ctor = getCtor();
  if (!Ctor) {
    h.onError("unsupported");
    h.onEnd();
    return () => {};
  }
  const rec = new Ctor();
  rec.lang = "en-US";
  rec.interimResults = false;
  rec.continuous = false;
  rec.maxAlternatives = 3;
  let gotResult = false;
  rec.onresult = (e) => {
    gotResult = true;
    const first = e.results[0];
    const list: string[] = [];
    for (let i = 0; i < first.length; i++) list.push(first[i].transcript);
    h.onResult(list);
  };
  rec.onerror = (e) => {
    if (e.error !== "aborted") h.onError(e.error);
  };
  rec.onend = () => {
    if (!gotResult) {
      /* 오류가 이미 보고됐거나 아무것도 못 들은 경우 */
    }
    h.onEnd();
  };
  try {
    rec.start();
  } catch {
    h.onError("start-failed");
    h.onEnd();
  }
  return () => {
    rec.onresult = rec.onerror = rec.onend = null;
    try {
      rec.abort();
    } catch {
      /* 이미 끝남 */
    }
  };
}
