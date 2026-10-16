import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { JSX } from "react";
import type { Planning } from "@/content/types";
import { dayNames, formatRange, parisWeekday } from "./planning-format";
import { PlanningSlot } from "./planning-slot";

export function TodayAtGem({ planning, now }: { planning: Planning; now: string }): JSX.Element | null {
  const weekday = parisWeekday(now);
  const day =
    planning.days.find((candidate) => candidate.day === weekday && candidate.opensAt) ??
    planning.days.find((candidate) => candidate.day > weekday && candidate.opensAt) ??
    planning.days.find((candidate) => candidate.opensAt);
  if (!day) return null;

  const title = day.day === weekday ? "Aujourd'hui au GEM" : `${dayNames[day.day]} au GEM`;
  const slots = planning.slots.filter((slot) => slot.day === day.day);

  return (
    <section className="today-at-gem" aria-labelledby="today-title">
      <div className="content-container today-at-gem__inner">
        <div className="today-at-gem__heading">
          <p className="eyebrow eyebrow--dark">{dayNames[day.day]}</p>
          <h2 id="today-title">{title}</h2>
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
          {slots.map((slot) => <PlanningSlot key={slot.id} slot={slot} />)}
        </ul>
      </div>
    </section>
  );
}
