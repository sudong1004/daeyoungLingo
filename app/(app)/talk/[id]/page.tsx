import { notFound } from "next/navigation";
import { getScenario } from "@/lib/scenarios";
import { buildPractice } from "@/lib/talk";
import TalkClient from "./TalkClient";

export default async function TalkScenarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scenario = getScenario(id);
  if (!scenario) notFound();

  const { id: sid, title, emoji, intro } = scenario;
  return (
    <TalkClient
      key={sid}
      scenarioId={sid}
      title={title}
      emoji={emoji}
      intro={intro}
      lines={buildPractice(scenario)}
    />
  );
}
