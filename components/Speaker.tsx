"use client";

import { speak } from "@/lib/speech";

/** 스피커 버튼: 눌렀을 때 영어 발음을 재생합니다. */
export default function Speaker({
  text,
  size = "md",
  label = "발음 듣기",
}: {
  text: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  const dim =
    size === "lg" ? "h-20 w-20 text-4xl" : size === "sm" ? "h-9 w-9 text-lg" : "h-11 w-11 text-2xl";
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}
      className={`${dim} inline-flex shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 active:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300`}
    >
      🔊
    </button>
  );
}
