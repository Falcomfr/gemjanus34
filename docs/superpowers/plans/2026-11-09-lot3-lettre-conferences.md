# Lot 3 : lettre de la semaine et conférences - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Lettre de la semaine imprimable (mot de l'équipe modifiable) et page Conférences avec inscriptions à jauge, toutes deux pilotées comme le reste.

**Architecture:** Lettre = page serveur assemblée depuis `buildWeek` et les actualités, plus une table `weekly_letter` à une ligne. Conférences = tables `conferences` et `conference_registrations`, interrupteurs dans `site_settings`, inscription et places restantes par fonctions SQL `security definer`.

**Tech Stack:** Next.js 16, Supabase (RLS, pgTAP), zod 4, Vitest, Playwright, npm.

**Spec:** `docs/superpowers/specs/2026-11-09-lot3-lettre-conferences-design.md`

## Global Constraints

- npm ; tests unitaires sans `NEXT_PUBLIC_SUPABASE_*` ; grants explicites ; aucune dépendance ; français sans tiret cadratin.
- Interrupteurs `conferences_enabled` et `registrations_enabled` coupés par défaut.

## Review Focus

- Deux inscriptions simultanées ne dépassent pas la jauge (verrou `for update` testé en pgTAP par une inscription qui dépasse).
- Un visiteur ne lit aucune inscription, même par l'API publique (pgTAP).
- Inscriptions ou page coupées, conférence passée : `register_for_conference` refuse (pgTAP).
- La lettre d'une semaine sans planning en base s'affiche quand même (sans section planning) (vitest).
- Une conférence sans limite de places accepte toujours (pgTAP).

---

### Task 1: Lettre de la semaine

**Files:** `supabase/migrations/20261109140000_weekly_letter.sql` + `supabase/tests/weekly_letter_test.sql` ; `src/lib/letter/week-changes.ts` + test ; `src/app/lettre/page.tsx` + test ; `src/app/admin/lettre/{page.tsx,actions.ts}` + tests ; `src/components/admin/letter-form.tsx` ; `admin-shell.tsx` (entrée « Lettre », icône `Mail` déjà prise : `ScrollText`) ; `src/app/actualites/page.tsx` (lien) ; `globals.css` (impression A4 portrait de `.letter`).

**Interfaces:** `weekChanges(week: PlanningWeek): { closures: Array<{date, reason}>; cancelled: PlanningWeekSlot[]; extras: PlanningWeekSlot[] }` ; action `saveLetterNote(prev, formData)`.

- [ ] pgTAP (RED) : ligne unique, anon lit, anon ne modifie pas, éditeur modifie `note`, note de plus de 1 500 caractères refusée (`23514`).
- [ ] vitest (RED) : `weekChanges` sépare fermetures, annulations (non masquées et masquées ? seulement celles visibles : statut `cancelled`) et séances exceptionnelles ; page `/lettre` : titre « Quoi de neuf au GEM », mot de l'équipe affiché s'il existe, section changements, planning sans séance annulée, à venir ; sans planning en base : la page s'affiche sans section planning ; action : note trop longue refusée, enregistrement + `revalidatePath("/lettre")`.
- [ ] Implémenter, `npx vitest run` + `supabase test db` → PASS. Commit `feat: weekly letter`.

### Task 2: Conférences en base

**Files:** `supabase/migrations/20261109140100_conferences.sql`, `supabase/tests/conferences_test.sql`, `src/lib/database.types.ts`.

**Interfaces:** `register_for_conference(conference_id uuid, name text, contact text, seats int) returns text` (`'ok' | 'closed' | 'past' | 'full'`) ; `conference_seats_taken() returns table(conference_id uuid, seats bigint)`.

- [ ] pgTAP (RED) : interrupteurs coupés par défaut ; anon ne lit pas les conférences tant que la page est coupée, les lit une fois activée ; anon ne lit jamais les inscriptions ; `register_for_conference` → `closed` si coupé, `ok` puis `full` sur une jauge de 3 (2 + 2), `past` pour une conférence passée, `ok` sans limite ; consentement implicite, `seats` 1..4, nom 2..100, contact 5..254 (`23514` ou retour `invalid`) ; éditeur lit et supprime les inscriptions ; suppression d'une conférence → inscriptions supprimées.
- [ ] Migration, `supabase db reset && supabase test db` → PASS. Commit `feat: conferences and registrations in the database`.

### Task 3: Conférences dans l'admin et sur le site

**Files:** `src/lib/admin/conference-input.ts` + test ; `src/app/admin/conferences/{page.tsx,actions.ts}` + tests ; `src/components/admin/conference-forms.tsx` ; `src/app/conferences/{page.tsx,actions.ts}` + tests ; `src/components/conferences/registration-form.tsx` ; `site-settings.ts`, `settings-form.tsx`, `reglages/actions.ts` (deux cases) ; `site-footer.tsx`, `layout.tsx`, `actualites/page.tsx`, `lettre/page.tsx` (liens et section) ; `admin-shell.tsx` (« Conférences », icône `Mic`).

- [ ] Tests (RED) : saisie (date future facultative ? non : date obligatoire ; places vides → null ; lieu vide → adresse du GEM) ; actions admin créer/supprimer/retirer un inscrit ; page publique : 404 coupée, places restantes, formulaire seulement si inscriptions ouvertes, à venir et places > 0 ; action d'inscription : piège à robots, résultats `full`/`closed`/`past` traduits en messages ; réglages : deux interrupteurs ; pied de page : lien si activée.
- [ ] Implémenter, suites vertes. Commit `feat: conferences page with registrations`.

### Task 4: Confidentialité et vérification

- [ ] Migration conditionnelle ajoutant la section « Inscriptions aux conférences » à la page `confidentialite` (si le texte est celui du lot 1) ; `seed.ts` et `seed.sql` alignés ; tests pgTAP et vitest du contenu.
- [ ] vitest, lint, typecheck, `supabase test db`, build, Playwright, captures 375/1280 de `/lettre`, `/lettre` imprimé, `/conferences`, admin.
- [ ] Relecture de la branche, corrections, sauvegarde, migrations prod, push, vérification en ligne.
