const input =
  "mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-stone-700 dark:bg-stone-900";

/** 단어 추가/수정에 같이 쓰는 입력 폼 (서버 액션을 action 으로 받음) */
export default function WordForm({
  action,
  submitLabel,
  defaults,
  id,
  autoFocus,
}: {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  defaults?: { word: string; meaning: string; example: string | null };
  id?: string;
  autoFocus?: boolean;
}) {
  return (
    <form action={action} className="space-y-4">
      {id && <input type="hidden" name="id" value={id} />}

      <label className="block text-sm font-medium">
        단어 또는 표현
        <input
          name="word"
          required
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect="off"
          defaultValue={defaults?.word}
          placeholder="reluctant, How much is it?"
          className={input}
        />
      </label>

      <label className="block text-sm font-medium">
        뜻
        <input
          name="meaning"
          required
          defaultValue={defaults?.meaning}
          placeholder="꺼리는 (여러 개면 쉼표로, 첫 번째가 대표 뜻)"
          className={input}
        />
      </label>

      <label className="block text-sm font-medium">
        예문 <span className="font-normal text-stone-400">(없어도 돼요)</span>
        <input
          name="example"
          defaultValue={defaults?.example ?? ""}
          autoCapitalize="sentences"
          placeholder="He was reluctant to leave."
          className={input}
        />
      </label>

      <button
        type="submit"
        className="w-full rounded-xl bg-indigo-600 py-3.5 text-base font-semibold text-white active:bg-indigo-700"
      >
        {submitLabel}
      </button>
    </form>
  );
}
