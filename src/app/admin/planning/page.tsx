import { Printer } from "lucide-react";
import { PlanningDayForm, PlanningSettingsForm, PlanningSlotForm } from "@/components/admin/planning-forms";
import { dayNames } from "@/components/planning/planning-format";
import { requireProfile } from "@/lib/auth/require-profile";
import { mapPlanning } from "@/lib/content/supabase-public-content-repository";
import { createServerClient } from "@/lib/supabase/server";

export default async function AdminPlanningPage() {
  await requireProfile();
  const supabase = await createServerClient();
  const [settings, days, slots] = await Promise.all([
    supabase.from("planning_settings").select("effective_from, note").limit(1),
    supabase.from("planning_days").select("day, opens_at, closes_at, team"),
    supabase.from("planning_slots").select("id, day, starts_at, ends_at, title, leader, note, description, family"),
  ]);
  const planning = mapPlanning({ settings, days, slots } as Parameters<typeof mapPlanning>[0]);

  return (
    <div className="admin-pages-index planning-admin">
      <header className="admin-page-header admin-page-header--actions">
        <div>
          <p className="eyebrow eyebrow--dark">Contenu</p>
          <h1>Planning</h1>
          <p>La semaine type affichée sur le site. Chaque modification est visible dès l’enregistrement.</p>
        </div>
        <a className="button button--dark" href="/planning/imprimer" target="_blank" rel="noopener noreferrer">
          <Printer aria-hidden="true" size={18} />
          Version imprimable (PDF)
        </a>
      </header>

      {planning ? (
        <>
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
                  .map((slot) => <PlanningSlotForm key={slot.id} day={day.day} slot={slot} />)}
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
