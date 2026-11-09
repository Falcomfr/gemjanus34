import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { dayNames, formatHour, formatRange } from "@/components/planning/planning-format";
import { PrintButton } from "@/components/planning/print-button";
import { contact } from "@/content/contact";
import { getPublicContentRepository } from "@/lib/content/public-repository";
import { groupNews } from "@/lib/content/group-news";
import { formatPublicDateRange } from "@/lib/date/public-date";
import { getLetterNote } from "@/lib/letter/letter-note";
import { getSiteSettings } from "@/lib/settings/site-settings";
import { createServerClient } from "@/lib/supabase/server";
import { weekChanges } from "@/lib/letter/week-changes";
import { addDays, buildWeek, dayDateLabel, resolveWeek, weekRangeLabel } from "@/lib/planning/week";
import { fr } from "@/lib/text/french";

export const metadata: Metadata = {
  title: "Lettre de la semaine",
  description: "Quoi de neuf au GEM Janus34 cette semaine : changements, planning et rendez-vous à venir.",
};

const UPCOMING_DAYS = 35;

async function upcomingConferences(now: string) {
  try {
    const supabase = await createServerClient();
    const { data } = await supabase.from("conferences").select("id, title, speaker, starts_at, place").gte("starts_at", now).order("starts_at");
    return (data ?? []).slice(0, 3);
  } catch {
    return [];
  }
}

const dayTitle = (date: string, weekday: number) => `${dayNames[weekday]} ${dayDateLabel(date)}`;

type LetterPageProps = { searchParams?: Promise<{ semaine?: string | string[] }> };

export default async function LetterPage({ searchParams }: LetterPageProps = {}) {
  const repository = getPublicContentRepository();
  const [planning, news, note, settings] = await Promise.all([repository.getPlanning(), repository.getNews(), getLetterNote(), getSiteSettings()]);
  const now = new Date().toISOString();
  const conferences = settings.conferencesEnabled ? await upcomingConferences(now) : [];
  const requested = (await searchParams)?.semaine;
  const { monday } = resolveWeek(typeof requested === "string" ? requested : undefined, now);
  const week = planning?.slots.length ? buildWeek(planning, monday) : null;
  const changes = week ? weekChanges(week) : null;
  const hasChanges = Boolean(changes && changes.closures.length + changes.cancelled.length + changes.extras.length > 0);
  const horizon = `${addDays(monday, UPCOMING_DAYS)}T23:59:59Z`;
  const upcoming = groupNews(news, now).upcoming.filter((item) => item.startsAt <= horizon);

  return (
    <article className="letter">
      <div className="content-container letter__actions">
        <Link className="text-link" href="/actualites">
          <ArrowLeft aria-hidden="true" size={20} />
          Planning et actualités
        </Link>
        <PrintButton />
        <p>Dans la fenêtre d’impression, choisissez « Enregistrer en PDF » pour l’envoyer par e-mail.</p>
      </div>

      <div className="letter__sheet">
        <header className="letter__brand">
          <Image src="/images/janus34-logo.png" alt="" width={64} height={64} />
          <p>
            <strong>Janus34</strong> · Groupe d’Entraide Mutuelle · {contact.street}, {contact.city} · {contact.phone}
          </p>
        </header>
        <h1>
          Quoi de neuf au GEM <span>{weekRangeLabel(monday)}</span>
        </h1>

        {note.trim() ? (
          <section aria-labelledby="letter-note">
            <h2 id="letter-note">Le mot de l&apos;équipe</h2>
            {note.split(/\n{2,}/).map((paragraph) => <p key={paragraph}>{fr(paragraph)}</p>)}
          </section>
        ) : null}

        {changes && hasChanges ? (
          <section aria-labelledby="letter-changes">
            <h2 id="letter-changes">Cette semaine, ça change</h2>
            <ul>
              {changes.closures.map((closure) => (
                <li key={`closure-${closure.date}`}>
                  <strong>GEM fermé {dayTitle(closure.date, week!.days.find((day) => day.date === closure.date)!.day).toLowerCase()}</strong>
                  {closure.reason ? ` : ${fr(closure.reason)}` : ""}
                </li>
              ))}
              {changes.cancelled.map((session) => (
                <li key={`cancel-${session.date}-${session.id}`}>
                  {dayTitle(session.date, session.day)}, {formatHour(session.startsAt)} : <strong>{session.title} annulé</strong>
                  {session.reason ? ` (${fr(session.reason)})` : ""}
                </li>
              ))}
              {changes.extras.map((session) => (
                <li key={`extra-${session.date}-${session.id}`}>
                  En plus, {dayTitle(session.date, session.day)}, {formatRange(session.startsAt, session.endsAt)} : <strong>{session.title}</strong>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {week ? (
          <section aria-labelledby="letter-planning">
            <h2 id="letter-planning">Le planning de la semaine</h2>
            <ul className="letter__days">
              {week.days.map((day) => {
                const sessions = day.slots.filter((slot) => slot.status !== "cancelled");
                return (
                  <li key={day.date}>
                    <h3>{dayTitle(day.date, day.day)}</h3>
                    {day.closedReason !== null ? (
                      <p>GEM fermé</p>
                    ) : sessions.length ? (
                      <ul>
                        {sessions.map((slot) => (
                          <li key={slot.id}>
                            {formatRange(slot.startsAt, slot.endsAt)} · {slot.title}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>Accueil et temps libre</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="letter-next">
          <h2 id="letter-next">À venir</h2>
          {upcoming.length ? (
            <ul>
              {upcoming.map((item) => (
                <li key={item.id}>
                  <strong>{formatPublicDateRange(item.startsAt, item.endsAt)} : {fr(item.title)}</strong>
                  <br />
                  {fr(item.excerpt)}
                </li>
              ))}
            </ul>
          ) : (
            <p>Rien d&apos;autre n&apos;est annoncé pour le moment.</p>
          )}
        </section>

        {conferences.length ? (
          <section aria-labelledby="letter-conferences">
            <h2 id="letter-conferences">Conférences à venir</h2>
            <ul>
              {conferences.map((conference) => (
                <li key={conference.id}>
                  <strong>{formatPublicDateRange(conference.starts_at, null)} : {fr(conference.title)}</strong>
                  {conference.speaker ? `, avec ${conference.speaker}` : ""} ({conference.place})
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <footer className="letter__footer">
          Pour venir ou poser une question : {contact.phone}. {contact.openingHours}
        </footer>
      </div>
    </article>
  );
}
