"use server";

import { assertAuth } from "@/lib/auth";
import { getScenario, myLineCount } from "@/lib/scenarios";
import { getSupabase } from "@/lib/supabase";

/**
 * 회화 연습을 끝냈을 때 결과를 기록합니다.
 * 기록 실패(예: scenario_runs 테이블을 아직 안 만든 경우)로 화면이 깨지지 않게 ok 만 돌려줍니다.
 */
export async function recordScenarioRun(input: {
  scenarioId: string;
  correct: number;
}): Promise<{ ok: boolean }> {
  await assertAuth();
  const scenario = getScenario(input.scenarioId);
  if (!scenario) return { ok: false };
  const total = myLineCount(scenario);
  const correct = Math.max(0, Math.min(Math.trunc(Number(input.correct)) || 0, total));

  const { error } = await getSupabase().from("scenario_runs").insert({
    scenario_id: scenario.id,
    correct,
    total,
  });
  return { ok: !error };
}
