import { ArrowLeft, ArrowRight, CalendarDays, CalendarPlus, Printer } from "lucide-react";
import Link from "next/link";
import type { JSX } from "react";
import type { Planning, PlanningFamily } from "@/content/types";
import { formatPublicDate } from "@/lib/date/public-date";
import { buildWeek, dayDateLabel, weekRangeLabel } from "@/lib/planning/week";
import { fr } from "@/lib/text/french";
import { dayNames, familyLabels, formatRange } from "./planning-format";
import { PlanningSlot } from "./planning-slot";

type WeekPlanningProps = {
  planning: Planning;
  monday: string;
  today?: string;
  navigation?: { previous?: string; next?: string };
  printable?: boolean;
  /** Host of the site, for the calendar subscription links; none on the printed planning. */
  calendarHost?: string;
};

export function WeekPlanning({ planning, monday, today, navigation, printable = false, calendarHost }: WeekPlanningProps): JSX.Element {
  const week = buildWeek(planning, monday);
  // Only a week other than the current one has a previous week to go back to.
  const printHref = navigation?.previous ? `/planning/imprimer?semaine=${monday}` : "/planning/imprimer";

  return (
    <section className={`week-planning${printable ? " week-planning--print" : ""}`} id="planning" aria-labelledby="planning-title">
      <div className="content-container">
        <header className="week-planning__header">
          <div>
            <p className="eyebrow eyebrow--dark">Chaque semaine au GEM</p>
            <h2 id="planning-title">{printable ? "Planning d'activités Janus34" : "Le planning des activités"}</h2>
            <p className="week-planning__range">{weekRangeLabel(monday)}</p>
            <p>
              En vigueur depuis le {formatPublicDate(planning.effectiveFrom)}.
              {planning.note ? <> {fr(planning.note)}</> : null}
            </p>
          </div>
          {printable ? null : (
            <Link className="button button--dark" href={printHref}>
              <Printer aria-hidden="true" size={20} />
              Version imprimable (PDF)
            </Link>
          )}
        </header>

        {navigation && !printable ? (
          <nav className="week-planning__nav" aria-label="Autres semaines">
            {navigation.previous ? (
              <Link className="text-link" href={`/actualites?semaine=${navigation.previous}#planning`}>
                <ArrowLeft aria-hidden="true" size={18} />
                Semaine précédente
              </Link>
            ) : <span />}
            {navigation.next ? (
              <Link className="text-link" href={`/actualites?semaine=${navigation.next}#planning`}>
                Semaine suivante
                <ArrowRight aria-hidden="true" size={18} />
              </Link>
            ) : null}
          </nav>
        ) : null}

        <ul className="planning-legend" aria-label="Familles d'activités">
          {(Object.keys(familyLabels) as PlanningFamily[]).map((family) => (
            <li key={family} className={`planning-legend__item planning-legend__item--${family}`}>
              {familyLabels[family]}
            </li>
          ))}
        </ul>

        <ol className="planning-week">
          {week.days.map((day) => {
            const isToday = day.date === today;
            const closed = day.closedReason !== null;
            return (
              <li key={day.day}>
                <section
                  className={`planning-day${isToday ? " planning-day--today" : ""}${closed ? " planning-day--closed" : ""}`}
                  aria-labelledby={`planning-day-${day.day}`}
                >
                  <header className="planning-day__header">
                    <h3 id={`planning-day-${day.day}`}>
                      {dayNames[day.day]} <span className="planning-day__date">{dayDateLabel(day.date)}</span>
                      {isToday ? <span className="planning-day__today">Aujourd&apos;hui</span> : null}
                    </h3>
                    <p>
                      <CalendarDays aria-hidden="true" size={16} />
                      {closed ? "GEM fermé" : formatRange(day.opensAt, day.closesAt) || "Fermé"}
                    </p>
                    {closed ? (
                      day.closedReason ? <p className="planning-day__closed">{fr(day.closedReason)}</p> : null
                    ) : day.team ? (
                      <p className="planning-day__team">{day.team}</p>
                    ) : null}
                  </header>
                  {day.slots.length > 0 ? (
                    <ul className="planning-day__slots">
                      {day.slots.map((slot) => <PlanningSlot key={slot.id} slot={slot} interactive={!printable} />)}
                    </ul>
                  ) : closed ? null : (
                    <p className="planning-day__empty">Accueil et temps libre</p>
                  )}
                </section>
              </li>
            );
          })}
        </ol>

        {calendarHost && !printable ? <CalendarSubscribe host={calendarHost} /> : null}
      </div>
    </section>
  );
}

function CalendarSubscribe({ host }: { host: string }): JSX.Element {
  const feed = `webcal://${host}/planning.ics`;
  return (
    <section className="calendar-subscribe" aria-labelledby="calendar-subscribe-title">
      <h3 id="calendar-subscribe-title">Ajouter le planning à mon agenda</h3>
      <p>Le planning se met à jour tout seul dans votre agenda, annulations comprises.</p>
      <p className="calendar-subscribe__links">
        <a className="button button--dark" href={feed}>
          <CalendarPlus aria-hidden="true" size={20} />
          Agenda du téléphone
        </a>
        <a className="button button--light" href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(feed)}`} target="_blank" rel="noopener noreferrer">
          <CalendarPlus aria-hidden="true" size={20} />
          Google Agenda<span className="sr-only"> (nouvel onglet)</span>
        </a>
      </p>
    </section>
  );
}
