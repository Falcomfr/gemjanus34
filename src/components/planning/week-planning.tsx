import { CalendarDays, Printer } from "lucide-react";
import Link from "next/link";
import type { JSX } from "react";
import type { Planning, PlanningFamily } from "@/content/types";
import { formatPublicDate } from "@/lib/date/public-date";
import { fr } from "@/lib/text/french";
import { dayNames, familyLabels, formatRange } from "./planning-format";
import { PlanningSlot } from "./planning-slot";

type WeekPlanningProps = {
  planning: Planning;
  today?: number;
  printable?: boolean;
};

export function WeekPlanning({ planning, today, printable = false }: WeekPlanningProps): JSX.Element {
  return (
    <section className={`week-planning${printable ? " week-planning--print" : ""}`} id="planning" aria-labelledby="planning-title">
      <div className="content-container">
        <header className="week-planning__header">
          <div>
            <p className="eyebrow eyebrow--dark">Chaque semaine au GEM</p>
            <h2 id="planning-title">{printable ? "Planning d'activités Janus34" : "Le planning des activités"}</h2>
            <p>
              En vigueur depuis le {formatPublicDate(planning.effectiveFrom)}.
              {planning.note ? <> {fr(planning.note)}</> : null}
            </p>
          </div>
          {printable ? null : (
            <Link className="button button--dark" href="/planning/imprimer">
              <Printer aria-hidden="true" size={20} />
              Version imprimable (PDF)
            </Link>
          )}
        </header>

        <ul className="planning-legend" aria-label="Familles d'activités">
          {(Object.keys(familyLabels) as PlanningFamily[]).map((family) => (
            <li key={family} className={`planning-legend__item planning-legend__item--${family}`}>
              {familyLabels[family]}
            </li>
          ))}
        </ul>

        <ol className="planning-week">
          {planning.days.map((day) => {
            const slots = planning.slots.filter((slot) => slot.day === day.day);
            const isToday = day.day === today;
            return (
              <li key={day.day}>
                <section
                  className={`planning-day${isToday ? " planning-day--today" : ""}`}
                  aria-labelledby={`planning-day-${day.day}`}
                >
                  <header className="planning-day__header">
                    <h3 id={`planning-day-${day.day}`}>
                      {dayNames[day.day]}
                      {isToday ? <span className="planning-day__today">Aujourd&apos;hui</span> : null}
                    </h3>
                    <p>
                      <CalendarDays aria-hidden="true" size={16} />
                      {formatRange(day.opensAt, day.closesAt) || "Fermé"}
                      {day.team ? <span> · {day.team}</span> : null}
                    </p>
                  </header>
                  {slots.length > 0 ? (
                    <ul className="planning-day__slots">
                      {slots.map((slot) => <PlanningSlot key={slot.id} slot={slot} />)}
                    </ul>
                  ) : (
                    <p className="planning-day__empty">Accueil et temps libre</p>
                  )}
                </section>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
