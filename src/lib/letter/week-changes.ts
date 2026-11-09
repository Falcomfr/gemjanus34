import type { PlanningWeek, PlanningWeekSlot } from "@/lib/planning/week";

export type WeekChanges = {
  closures: Array<{ date: string; reason: string }>;
  cancelled: PlanningWeekSlot[];
  extras: PlanningWeekSlot[];
};

/** What differs from the usual week: closed days, cancelled sessions still shown, extra sessions. */
export function weekChanges(week: PlanningWeek): WeekChanges {
  const slots = week.days.flatMap((day) => day.slots);
  return {
    closures: week.days.filter((day) => day.closedReason !== null).map((day) => ({ date: day.date, reason: day.closedReason! })),
    cancelled: slots.filter((slot) => slot.status === "cancelled"),
    extras: slots.filter((slot) => slot.status === "extra"),
  };
}
