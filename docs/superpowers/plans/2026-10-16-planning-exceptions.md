# Planning daté : plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans.

**Goal:** semaine datée avec récurrences mensuelles, annulations (barrées ou masquées), fermetures et séances exceptionnelles, gérées dans l'admin.
**Architecture:** la semaine type et les exceptions sont lues en base et rassemblées dans `Planning`. Une fonction pure, `buildWeek`, rend la semaine datée que les vues affichent. Les dates sont des chaînes `AAAA-MM-JJ`, calculées en UTC sans heure.
**Tech Stack:** Next.js 16, React 19, Supabase (RLS, pgTAP), zod 4, Vitest, Playwright.
**Spec:** docs/superpowers/specs/2026-10-16-planning-exceptions-design.md

## Global Constraints

- Projet sous npm. Les tests unitaires tournent sans `NEXT_PUBLIC_SUPABASE_*` dans l'environnement.
- Grants explicites dans la migration (le Supabase hébergé n'accorde rien par défaut).
- Textes en français passés par `fr()`, pas de tiret cadratin.
- « Aujourd'hui » est le jour à Paris.

## Review Focus

- Dernier jeudi d'un mois qui en compte 4, puis d'un mois qui en compte 5 (octobre 2026 en a 5 : le 29 est le dernier, le 22 est le 4e).
- Fermeture à cheval sur deux semaines, ou qui commence un dimanche.
- Semaine qui change de mois ou d'année, pour le libellé et le calcul de `month_weeks`.
- `?semaine=` invalide, pas un lundi, ou hors plage : on affiche la semaine courante.
- Le changement d'heure d'octobre (25/10/2026) ne décale aucune date.

### Task 1 : base de données

- Migration `20261016230000_planning_exceptions.sql` :
  - colonnes `recurrence text not null default 'weekly' check (recurrence in ('weekly','only','except'))` et `month_weeks smallint[] not null default '{}'`, avec une contrainte de cohérence (valeurs dans {-1,1,2,3,4,5}, vide si et seulement si `weekly`) ;
  - réglage des trois créneaux, par titre ;
  - précisions des deux créneaux, seulement si leur texte d'origine n'a pas changé ;
  - table `planning_exceptions` : contraintes par sorte, `isodow` de 1 à 6 pour `cancel` et `extra`, RLS, grants.
- `supabase/tests/planning_exceptions_test.sql` : récurrences importées, lecture anonyme, écriture anonyme refusée, écriture par un éditeur, contraintes de chaque sorte, cascade à la suppression d'un créneau.
- `src/lib/database.types.ts` mis à jour.

### Task 2 : types et lecture

- `types.ts` : `PlanningSlot` gagne `recurrence: "weekly" | "only" | "except"` et `monthWeeks: number[]`. Ajouter `PlanningException`, une union discriminée sur `kind`, et `Planning.exceptions`.
- `mapPlanning` lit `exceptions` ; la requête publique lit les exceptions dont `end_date` tombe au plus tôt 7 jours avant aujourd'hui. Le planning embarqué reçoit ses récurrences et `exceptions: []`.
- Tests : `planning-repository.test.ts`.

### Task 3 : calcul de la semaine (`src/lib/planning/week.ts`)

- `parisDate(instant: string): string`, `addDays(date, n)`, `weekday(date): 1..7`, `currentMonday(now: string): string` (le dimanche, le lendemain).
- `occursOn(slot, date): boolean`, `buildWeek(planning, monday): PlanningWeek`, `nextOpenDay(planning, now): { day: PlanningWeekDay; closedToday?: string } | null`.
- `weekRangeLabel(monday): string`, `recurrenceLabel(slot): string`, `resolveWeek(param: string | undefined, now): { monday, previous?, next? }`.
- Tests : `src/lib/planning/__tests__/week.test.ts`, qui couvrent toute la Review Focus.

### Task 4 : vues publiques

- `WeekPlanning({ week, effectiveFrom, note, todayDate?, navigation?, printable? })`, `PlanningSlot({ slot: PlanningWeekSlot, ... })` (états annulé et exceptionnel, date réelle dans la fenêtre), `TodayAtGem({ planning, now })`.
- `actualites/page.tsx` et `planning/imprimer/page.tsx` lisent `searchParams.semaine`.
- Tests : `planning.test.tsx` et les tests des pages, adaptés.

### Task 5 : admin

- `planning-input.ts` : `parsePlanningException(formData, today)` selon `kind`, et la récurrence dans `parsePlanningSlot`.
- `actions.ts` : `addPlanningException` (vérifie que le jour du créneau correspond à la date de l'annulation), `deletePlanningException`.
- `planning-forms.tsx` : `PlanningExceptionForms`, `PlanningExceptionList`, champ Récurrence. `page.tsx` : section « Changements à venir ».
- Tests : `planning-input.test.ts`, `actions.test.ts`, `page.test.tsx`.

### Task 6 : styles, parcours, production

- CSS des états, de la navigation et des formulaires.
- Playwright : annuler une séance barrée puis masquée, fermer un jour, ajouter une séance, naviguer de semaine en semaine, imprimer la semaine choisie. Chaque test nettoie ce qu'il crée.
- Production : migration puis push de `main`, puis vérification en ligne.
