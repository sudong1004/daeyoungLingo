import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** .env 에 따옴표/공백이 섞여 들어와도 동작하게 정리 */
function clean(v: string | undefined): string {
  return (v ?? "").trim().replace(/^["']|["']$/g, "").trim();
}

/** https://xxxx.supabase.co/rest/v1/ 같은 값을 붙여넣어도 origin 만 사용 */
function normalizeUrl(raw: string): string {
  try {
    return new URL(raw).origin;
  } catch {
    throw new Error(
      `SUPABASE_URL 형식이 올바르지 않아요. https://<프로젝트ID>.supabase.co 형태여야 해요. (현재 값: "${raw}")`,
    );
  }
}

function hintFor(status: number): string {
  if (status === 401 || status === 403)
    return "키가 잘못됐거나 다른 프로젝트의 키예요. SUPABASE_URL 과 같은 프로젝트의 service_role(또는 secret) 키인지 확인하세요. sb_secret_ 키가 안 되면 Legacy API Keys 탭의 service_role 키(eyJ... 로 시작)를 써보세요.";
  if (status === 404)
    return "주소(SUPABASE_URL)가 틀렸거나 프로젝트가 없어요. 또는 schema.sql 을 아직 실행하지 않았을 수 있어요.";
  if (status === 521 || status === 522 || status === 523 || status === 540)
    return "Supabase 프로젝트가 일시정지(paused)됐을 수 있어요. 대시보드에서 Restore 하세요.";
  return "SUPABASE_URL, 키, schema.sql 실행 여부를 확인하세요.";
}

/**
 * supabase-js 는 본문이 빈 오류 응답(예: 401)을 {"message":""} 로만 보여줘서
 * 원인을 알 수 없어요. 빈 본문일 때 상태 코드와 힌트를 담아 돌려줍니다.
 */
const diagnosticFetch: typeof fetch = async (input, init) => {
  const res = await fetch(input, init);
  if (res.ok) return res;
  const text = await res.clone().text();
  if (text.trim() !== "") return res;
  const body = JSON.stringify({
    message: `Supabase 요청 실패 (HTTP ${res.status} ${res.statusText}). ${hintFor(res.status)}`,
    code: `HTTP_${res.status}`,
  });
  return new Response(body, {
    status: res.status,
    statusText: res.statusText,
    headers: { "content-type": "application/json" },
  });
};

export function getSupabase(): SupabaseClient {
  if (client) return client;
  const rawUrl = clean(process.env.SUPABASE_URL);
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!rawUrl || !key) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았어요. .env.local 을 확인하고 dev 서버를 다시 시작하세요.",
    );
  }
  client = createClient(normalizeUrl(rawUrl), key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: diagnosticFetch },
  });
  return client;
}
