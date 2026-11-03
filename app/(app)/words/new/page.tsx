import Link from "next/link";
import WordForm from "@/components/WordForm";
import { addWord } from "../actions";

export default async function NewWordPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; word?: string }>;
}) {
  const { saved, error, word } = await searchParams;

  return (
    <main>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">단어 추가</h1>
        <Link href="/words/import" className="text-sm text-indigo-600">
          여러 개 한 번에 →
        </Link>
      </div>

      {saved && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          “{saved}” 저장했어요. 이어서 추가하세요.
        </p>
      )}
      {error === "duplicate" && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          {word ? `“${word}”` : "이 단어"}는 이미 단어장에 있어요.
        </p>
      )}
      {error === "empty" && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          단어와 뜻을 모두 입력해 주세요.
        </p>
      )}

      <div className="mt-5">
        <WordForm action={addWord} submitLabel="저장" autoFocus />
      </div>
    </main>
  );
}
