"use server";

import { redirect } from "next/navigation";
import { assertUser } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { parseBulk } from "@/lib/bulk";

const UNIQUE_VIOLATION = "23505";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function clean(v: FormDataEntryValue | null): string {
  return String(v ?? "").trim();
}

export async function addWord(formData: FormData) {
  await assertUser();
  const word = clean(formData.get("word"));
  const meaning = clean(formData.get("meaning"));
  const example = clean(formData.get("example"));
  if (!word || !meaning) redirect("/words/new?error=empty");

  const { error } = await getSupabase()
    .from("words")
    .insert({ word, meaning, example: example || null });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      redirect(`/words/new?error=duplicate&word=${encodeURIComponent(word)}`);
    }
    throw new Error(error.message);
  }
  redirect(`/words/new?saved=${encodeURIComponent(word)}`);
}

export async function updateWord(formData: FormData) {
  await assertUser();
  const id = clean(formData.get("id"));
  const word = clean(formData.get("word"));
  const meaning = clean(formData.get("meaning"));
  const example = clean(formData.get("example"));
  if (!UUID_RE.test(id)) redirect("/words");
  if (!word || !meaning) redirect(`/words/${id}/edit?error=empty`);

  const { error } = await getSupabase()
    .from("words")
    .update({ word, meaning, example: example || null })
    .eq("id", id);

  if (error) {
    if (error.code === UNIQUE_VIOLATION) redirect(`/words/${id}/edit?error=duplicate`);
    throw new Error(error.message);
  }
  redirect("/words");
}

export async function deleteWord(formData: FormData) {
  await assertUser();
  const id = clean(formData.get("id"));
  if (!UUID_RE.test(id)) redirect("/words");
  const { error } = await getSupabase().from("words").delete().eq("id", id);
  if (error) throw new Error(error.message);
  redirect("/words");
}

export async function importWords(formData: FormData) {
  await assertUser();
  const rows = parseBulk(String(formData.get("text") ?? ""));
  if (rows.length === 0) redirect("/words/import?error=empty");

  const sb = getSupabase();

  // 입력 안에서 중복 제거 (대소문자 무시)
  const seen = new Set<string>();
  const unique = rows.filter((r) => {
    const k = r.word.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  // 이미 있는 단어 제외
  const existing = await sb.from("words").select("word").limit(5000);
  if (existing.error) throw new Error(existing.error.message);
  const have = new Set((existing.data ?? []).map((w: { word: string }) => w.word.toLowerCase()));
  const toInsert = unique.filter((r) => !have.has(r.word.toLowerCase()));

  let added = 0;
  if (toInsert.length > 0) {
    const batch = await sb.from("words").insert(toInsert);
    if (!batch.error) {
      added = toInsert.length;
    } else if (batch.error.code === UNIQUE_VIOLATION) {
      // 목록을 못 불러온 중복이 끼어 있으면 한 줄씩 넣어서 건너뜀
      for (const r of toInsert) {
        const one = await sb.from("words").insert(r);
        if (!one.error) added++;
        else if (one.error.code !== UNIQUE_VIOLATION) throw new Error(one.error.message);
      }
    } else {
      throw new Error(batch.error.message);
    }
  }

  const skipped = rows.length - added;
  redirect(`/words/import?added=${added}&skipped=${skipped}`);
}
