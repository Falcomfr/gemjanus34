import type { Planning } from "@/content/types";
import { getPublicContentRepository } from "@/lib/content/public-repository";
import { buildPlanningCalendar } from "@/lib/planning/ics";

const emptyPlanning: Planning = { effectiveFrom: "", note: "", days: [], slots: [], exceptions: [] };

export async function GET(): Promise<Response> {
  const planning = await getPublicContentRepository().getPlanning();
  return new Response(buildPlanningCalendar(planning ?? emptyPlanning, new Date().toISOString()), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="planning-janus34.ics"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
