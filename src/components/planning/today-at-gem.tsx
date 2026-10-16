import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { JSX } from "react";
import type { Planning } from "@/content/types";
import { dayDateLabel, nextOpenDay, parisDate } from "@/lib/planning/week";
import { fr } from "@/lib/text/french";
import { dayNames, formatRange } from "./planning-format";
import { PlanningSlot } from "./planning-slot";

export function TodayAtGem({ planning, now }: { planning: Planning; now: string }): JSX.Element | null {
  const next = nextOpenDay(planning, now);
  if (!next) return null;
  const { day, closedToday } = next;

  const title = day.date === parisDate(now) ? "Aujourd'hui au GEM" : `${dayNames[day.day]} au GEM`;

  return (
    <section className="today-at-gem" aria-labelledby="today-title">
      <div className="content-container today-at-gem__inner">
        <div className="today-at-gem__heading">
          <p className="eyebrow eyebrow--dark">{dayNames[day.day]} {dayDateLabel(day.date)}</p>
          <h2 id="today-title">{title}</h2>
          {closedToday !== null ? (
            <p className="today-at-gem__closed">
              {fr(closedToday ? `Le GEM est fermé aujourd’hui : ${closedToday}.` : "Le GEM est fermé aujourd’hui.")}
            </p>
          ) : null}
          <p>
            Ouvert {formatRange(day.opensAt, day.closesAt)}
            {day.team ? ` · ${day.team}` : ""}
          </p>
          <Link className="text-link" href="/actualites#planning">
            Tout le planning de la semaine
            <ArrowRight aria-hidden="true" size={20} />
          </Link>
        </div>
        <ul className="planning-day__slots today-at-gem__slots">
          {day.slots.map((slot) => <PlanningSlot key={slot.id} slot={slot} />)}
        </ul>
      </div>
    </section>
  );
}
