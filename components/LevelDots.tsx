/** 숙련도 0~5를 점 5개로 표시. 5는 졸업. */
export default function LevelDots({ level }: { level: number }) {
  if (level >= 5) {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
        외움
      </span>
    );
  }
  return (
    <span className="inline-flex gap-1" title={`숙련도 ${level}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${
            i < level ? "bg-indigo-500" : "bg-stone-300 dark:bg-stone-700"
          }`}
        />
      ))}
    </span>
  );
}
