import { Printer } from "lucide-react";
import {
  PlanningDayForm,
  PlanningExceptionForms,
  PlanningExceptionList,
  PlanningSettingsForm,
  PlanningSlotForm,
} from "@/components/admin/planning-forms";
import { dayNames, formatRange } from "@/components/planning/planning-format";
import { requireProfile } from "@/lib/auth/require-profile";
import { mapPlanning } from "@/lib/content/supabase-public-content-repository";
import { parisDate } from "@/lib/planning/week";
import { createServerClient } from "@/lib/supabase/server";

export default async function AdminPlanningPage() {
  await requireProfile();
  const supabase = await createServerClient();
  const [settings, days, slots, exceptions] = await Promise.all([
    supabase.from("planning_settings").select("effective_from, note").limit(1),
    supabase.from("planning_days").select("day, opens_at, closes_at, team"),
    supabase.from("planning_slots").select("id, day, starts_at, ends_at, title, leader, note, description, family, recurrence, month_weeks"),
    // Only what is still to come: past changes leave the admin.
    supabase
      .from("planning_exceptions")
      .select("id, kind, date, end_date, slot_id, hidden, reason, starts_at, ends_at, title, leader, description, family")
      .gte("last_date", parisDate(new Date().toISOString())),
  ]);
  const planning = mapPlanning({ settings, days, slots, exceptions } as Parameters<typeof mapPlanning>[0]);

  return (
    <div className="admin-pages-index planning-admin">
      <header className="admin-page-header admin-page-header--actions">
        <div>
          <p className="eyebrow eyebrow--dark">Contenu</p>
          <h1>Planning</h1>
          <p>La semaine type et ses changements datés. Chaque modification est visible sur le site dès l’enregistrement.</p>
        </div>
        <a className="button button--dark" href="/planning/imprimer" target="_blank" rel="noopener noreferrer">
          <Printer aria-hidden="true" size={18} />
          Version imprimable (PDF)
        </a>
      </header>

      {planning ? (
        <>
          <section className="admin-form-section planning-changes" aria-labelledby="planning-changes-title">
            <h2 id="planning-changes-title">Changements à venir</h2>
            <p>Annulations, fermetures et séances exceptionnelles : ils s’affichent sur le site à leur date, puis disparaissent une fois passés.</p>
            <PlanningExceptionList exceptions={planning.exceptions} slots={planning.slots} />
            <PlanningExceptionForms slots={planning.slots} />
          </section>

          <section className="admin-form-section planning-admin__settings" aria-labelledby="planning-settings-title">
            <h2 id="planning-settings-title">Informations générales</h2>
            <PlanningSettingsForm effectiveFrom={planning.effectiveFrom} note={planning.note} />
          </section>

          {planning.days.map((day) => (
            <section className="planning-admin__day" key={day.day} aria-labelledby={`admin-day-${day.day}`}>
              <h2 id={`admin-day-${day.day}`}>{dayNames[day.day]}</h2>
              <PlanningDayForm day={day} />
              <div className="planning-admin__slots">
                {planning.slots
                  .filter((slot) => slot.day === day.day)
                  .map((slot) => (
                    // Folded to one line: the week stays readable, one click opens the slot to edit it.
                    <details className="planning-admin__add planning-admin__slot-line" key={slot.id}>
                      <summary>{formatRange(slot.startsAt, slot.endsAt)} · {slot.title}</summary>
                      <PlanningSlotForm day={day.day} slot={slot} />
                    </details>
                  ))}
              </div>
              <details className="planning-admin__add">
                <summary>Ajouter un créneau le {dayNames[day.day].toLowerCase()}</summary>
                <PlanningSlotForm day={day.day} />
              </details>
            </section>
          ))}
        </>
      ) : (
        <p className="form-status form-status--error">Le planning n’a pas pu être chargé.</p>
      )}
    </div>
  );
}
