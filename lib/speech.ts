"use client";

/** 브라우저 음성 합성(Web Speech API)이 되는지 */
export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function pickEnglishVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === "en-US" && /samantha|google|aaron|nicky|natural/i.test(v.name)) ??
    voices.find((v) => v.lang === "en-US") ??
    voices.find((v) => v.lang.startsWith("en"))
  );
}

/**
 * 영어 발음 재생. iOS 사파리는 사용자가 버튼을 직접 눌렀을 때만 소리가 나므로
 * 문제가 열릴 때 자동으로 부르지 말고 버튼 클릭 핸들러에서만 호출하세요.
 */
export function speak(text: string, rate = 0.9): void {
  if (!canSpeak()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = rate;
  const voice = pickEnglishVoice();
  if (voice) u.voice = voice;
  synth.speak(u);
}
