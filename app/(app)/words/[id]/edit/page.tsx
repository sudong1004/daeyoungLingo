import Link from "next/link";
import { notFound } from "next/navigation";
import WordForm from "@/components/WordForm";
import { getSupabase } from "@/lib/supabase";
import type { Word } from "@/lib/types";
import { deleteWord, updateWord } from "../../actions";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditWordPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  if (!UUID_RE.test(id)) notFound();

  const { data } = await getSupabase().from("words").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const w = data as Word;

  return (
    <main>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">단어 수정</h1>
        <Link href="/words" className="text-sm text-indigo-600">
          ← 단어장
        </Link>
      </div>

      {error === "duplicate" && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          같은 단어가 이미 단어장에 있어요.
        </p>
      )}
      {error === "empty" && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          단어와 뜻을 모두 입력해 주세요.
        </p>
      )}

      <div className="mt-5">
        <WordForm
          action={updateWord}
          submitLabel="수정 저장"
          id={w.id}
          defaults={{ word: w.word, meaning: w.meaning, example: w.example }}
        />
      </div>

      <form action={deleteWord} className="mt-8 border-t border-stone-200 pt-6 dark:border-stone-800">
        <input type="hidden" name="id" value={w.id} />
        <button
          type="submit"
          className="w-full rounded-xl border border-red-200 py-3 text-sm font-medium text-red-600 active:bg-red-50 dark:border-red-900 dark:active:bg-red-950"
        >
          이 단어 삭제
        </button>
      </form>
    </main>
  );
}
