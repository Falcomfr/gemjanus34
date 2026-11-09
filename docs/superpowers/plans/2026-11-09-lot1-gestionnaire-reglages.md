# Lot 1 : gestionnaire, réglages, sauvegarde et petites fonctions - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter le rôle gestionnaire, une page Réglages avec interrupteurs, l'alerte mail des messages, « Rappelez-moi », le lien HelloAsso, l'abonnement agenda au planning, des statistiques sans cookie et une sauvegarde quotidienne.

**Architecture:** Les droits sont appliqués en SQL (fonctions `security definer`, triggers, RLS) et reflétés dans l'interface Next.js. Les interrupteurs vivent dans une table `site_settings` à une ligne. Les fonctions externes (Resend, Cloudflare) s'activent par variables d'environnement et restent inertes sans elles.

**Tech Stack:** Next.js 16 (App Router, server actions), Supabase (Postgres, RLS, pgTAP), zod 4, Vitest, Playwright, npm.

**Spec:** `docs/superpowers/specs/2026-11-09-lot1-gestionnaire-reglages-design.md`

## Global Constraints

- Projet sous **npm** : `npm run typecheck`, `npx vitest run`, `npm run lint`, `npm run build` ; jamais `pnpm`.
- Ne pas exporter `NEXT_PUBLIC_SUPABASE_*` dans le shell pour les tests unitaires (19 échecs sinon).
- Chaque migration liste ses `grant` explicitement (le Supabase hébergé n'accorde rien par défaut).
- Une valeur d'enum ajoutée ne s'utilise pas dans la même migration : `manager` est ajouté dans un fichier à part.
- Textes publics en français, sans tiret cadratin.
- Aucune nouvelle dépendance npm.
- Variables : `RESEND_API_KEY`, `ALERT_FROM_EMAIL`, `CONTACT_ALERT_EMAIL`, `NEXT_PUBLIC_CF_ANALYTICS_TOKEN` ; secrets GitHub `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`.

## Review Focus

- Un gestionnaire qui publie une page **jamais publiée** doit être refusé en base, même en appelant le RPC directement (test pgTAP, tâche 1).
- Un éditeur qui envoie `role=manager` au formulaire de comptes ne passe pas : seul l'admin gère les comptes (déjà couvert par `requireAdmin`, test conservé, tâche 2).
- Resend en panne ou mal configuré : le message est quand même enregistré et le visiteur voit le succès (test, tâche 4).
- Réglages illisibles (Supabase indisponible) : le site public s'affiche avec les valeurs par défaut au lieu de planter (test, tâche 3).
- Une séance annulée ou un jour de fermeture n'apparaît pas dans le flux agenda (test, tâche 7).

---

### Task 1: Rôle gestionnaire en base

**Files:**
- Create: `supabase/migrations/20261109090000_manager_role_enum.sql`
- Create: `supabase/migrations/20261109090100_manager_role_rights.sql`
- Create: `supabase/tests/manager_role_test.sql`

**Interfaces:**
- Produces: enum `app_role` = `admin | editor | manager` ; `public.is_manager() returns boolean` (rôle admin ou manager, compte actif) ; `is_active_editor()` inclut aussi `manager`.

- [ ] **Step 1: Migration enum** : `alter type public.app_role add value if not exists 'manager';`
- [ ] **Step 2: Test pgTAP qui échoue** `manager_role_test.sql`, avec un gestionnaire, un éditeur, une page publiée (déjà révisionnée) et une page brouillon jamais publiée :
  - `is_manager()` vrai pour le gestionnaire, faux pour l'éditeur ;
  - gestionnaire : `lives_ok update_published_page(...)`, `lives_ok publish_page(<page déjà publiée puis archivée par l'admin>)`, `throws_ok publish_page(<brouillon jamais publié>, '42501')` ;
  - gestionnaire : `throws_ok` changer `slug`, `navigation_position` ou `parent_id` (`42501`) ;
  - gestionnaire : `lives_ok restore_page_revision(...)`, lit `page_revisions` (count > 0) ;
  - gestionnaire : `lives_ok archive_news`, `lives_ok restore_news` ;
  - éditeur : `throws_ok update_published_page` (`42501`) ;
  - gestionnaire : `throws_ok` mettre à jour `profiles` d'un autre compte (aucune ligne modifiée, donc `is(... , 0)`).
- [ ] **Step 3: Lancer** `supabase test db` → FAIL (`is_manager` inexistant).
- [ ] **Step 4: Migration droits** : `create function public.is_manager()` (même forme que `is_admin`, `current_app_role() in ('admin','manager')`). `create or replace` de :
  - `is_active_editor()` : ajoute `'manager'` ;
  - `enforce_page_write_boundaries()` : les contrôles « non-draft » et « status » utilisent `is_manager()` ; les contrôles de structure (`slug`, `navigation_position`, `parent_id`, insertion avec structure) restent sur `is_admin()` ;
  - `publish_page(uuid)` : exige `is_manager()`, puis exige `is_admin()` si `not exists (select 1 from public.page_revisions where page_id = $1 and status = 'published')` ;
  - `update_published_page`, `restore_page_revision`, `archive_news`, `restore_news` : `is_admin()` → `is_manager()` ; le trigger des actualités suit la même règle (non-draft et statut : `is_manager()`) ;
  - policy `page_revisions_admin_read` remplacée par une lecture `is_manager()`.
  Recopier chaque corps de fonction depuis sa dernière migration en ne changeant que ces tests. `revoke`/`grant execute` de `is_manager()` comme `is_admin()`.
- [ ] **Step 5: Lancer** `supabase db reset` puis `supabase test db` → toute la suite PASS.
- [ ] **Step 6: Commit** `feat: manager role edits live content, structure stays admin-only`

### Task 2: Rôle gestionnaire dans l'interface

**Files:**
- Create: `src/lib/auth/roles.ts`
- Modify: `src/lib/admin/account-input.ts:9`, `src/components/admin/account-forms.tsx` (RoleSelect), `src/components/admin/admin-shell.tsx:26,52,78`, `src/app/admin/mon-compte/page.tsx:13`, `src/lib/admin/page-lifecycle-actions.ts:33-37`, `src/app/admin/pages/actions.ts:133`, `src/app/admin/actualites/actions.ts:134,153`, `src/components/admin/page-form.tsx:105-130,277-330`, `src/lib/database.types.ts` (enum)
- Test: `src/lib/auth/__tests__/roles.test.ts`, tests existants de `page-lifecycle-actions`, `pages/update-published`, `comptes/actions`

**Interfaces:**
- Produces: `roleLabels: Record<AppRole, string>` (`admin: "Administrateur"`, `manager: "Gestionnaire"`, `editor: "Éditeur"`) ; `canManageContent(role: AppRole): boolean` (admin ou manager) ; `AppRole = Database["public"]["Enums"]["app_role"]`.

- [ ] **Step 1: Tests qui échouent**
  - `roles.test.ts` : `canManageContent("manager") === true`, `canManageContent("editor") === false`, `roleLabels.manager === "Gestionnaire"`.
  - lifecycle : un profil `manager` peut publier (`publish` appelé) et restaurer une révision ; il ne peut **pas** archiver une page (`formError` « réservée aux administrateurs »).
  - `pages/update-published` : un `manager` modifie une page en ligne (RPC `update_published_page` appelé) ; ses champs `slug`, `navigationPosition`, `parentId` sont ignorés (valeurs existantes conservées).
  - `account-input` : `role: "manager"` est accepté.
- [ ] **Step 2: Lancer** `npx vitest run src/lib/auth src/lib/admin src/app/admin` → FAIL.
- [ ] **Step 3: Implémenter** : `roles.ts` ; enum zod `["admin","manager","editor"]` ; option « Gestionnaire » dans `RoleSelect` ; libellés via `roleLabels` ; `requireAdmin` de publish et restore remplacé par `canManageContent`, archive reste admin ; `pages/actions.ts:133` utilise `canManageContent` ; `buildPageUpdate` garde la structure admin-only (inchangé) ; `actualites` archive/restore via `canManageContent` ; `page-form` : `canEditContent = canManageContent(role)` pour l'édition en ligne, la publication et la restauration, `isAdmin` seulement pour slug, position, parent et archivage. Le bouton « Publier » d'un gestionnaire sur une page sans révision affiche « Un administrateur publie les nouvelles pages. » au lieu du bouton.
- [ ] **Step 4: Lancer** `npx vitest run` → PASS ; `npm run typecheck` → 0 erreur.
- [ ] **Step 5: Commit** `feat: manager role in the admin interface`

### Task 3: Réglages du site

**Files:**
- Create: `supabase/migrations/20261109090200_site_settings.sql`, `supabase/tests/site_settings_test.sql`
- Create: `src/lib/settings/site-settings.ts`, `src/app/admin/reglages/page.tsx`, `src/app/admin/reglages/actions.ts`, `src/components/admin/settings-form.tsx`
- Modify: `src/components/admin/admin-shell.tsx` (entrée « Réglages », icône `Settings`, `adminOnly`), `src/lib/database.types.ts`
- Test: `src/lib/settings/__tests__/site-settings.test.ts`, `src/app/admin/reglages/__tests__/actions.test.ts`

**Interfaces:**
- Produces: `type SiteSettings = { callbackEnabled: boolean; membershipEnabled: boolean; helloassoUrl: string | null }` ; `defaultSiteSettings` (`true, false, null`) ; `getSiteSettings(): Promise<SiteSettings>` (React `cache`, ne lève jamais, défauts si erreur ou sans Supabase) ; `membershipHref(settings): string | null` (URL si activé et renseigné) ; action `saveSiteSettings(prev, formData)`.

- [ ] **Step 1: Test pgTAP qui échoue** : table à une ligne (`id boolean primary key default true check (id)`), `anon` lit, `anon`/éditeur/gestionnaire ne modifient pas (0 ligne ou `42501`), admin modifie, `helloasso_url = 'https://evil.test/'` → `23514`, une seconde ligne → erreur.
- [ ] **Step 2: Migration** : table, `insert` de la ligne par défaut, RLS (lecture `anon, authenticated`, update `is_admin()`), check `helloasso_url is null or helloasso_url like 'https://www.helloasso.com/%'`, grants `select` à anon/authenticated, `update` à authenticated. `supabase test db` → PASS.
- [ ] **Step 3: Tests vitest qui échouent** : `getSiteSettings` renvoie `defaultSiteSettings` quand la requête lève ou renvoie une erreur ; `membershipHref` = null si désactivé ou URL vide ; `saveSiteSettings` refuse un non-admin (`formError`), refuse une URL hors HelloAsso (`fieldErrors.helloassoUrl`), enregistre et appelle `revalidatePath("/", "layout")`.
- [ ] **Step 4: Implémenter** (formulaire : deux cases, un champ URL, bouton « Enregistrer », même style que `account-forms.tsx`). `npx vitest run` → PASS.
- [ ] **Step 5: Commit** `feat: admin settings with feature switches`

### Task 4: Alerte e-mail des nouveaux messages

**Files:**
- Create: `src/lib/contact/alert-email.ts`, `src/lib/contact/__tests__/alert-email.test.ts`
- Modify: `src/app/contact/actions.ts`, test existant de l'action contact

**Interfaces:**
- Produces: `type ContactAlert = { kind: "message" | "callback"; name: string; email?: string; phone?: string; subject: string; message: string }` ; `sendContactAlert(alert, env = process.env, fetchFn = fetch): Promise<void>` (ne lève jamais).

- [ ] **Step 1: Tests qui échouent** : sans l'une des trois variables, `fetchFn` n'est pas appelé ; avec les trois, POST `https://api.resend.com/emails` avec `to: [CONTACT_ALERT_EMAIL]`, `from: ALERT_FROM_EMAIL`, `reply_to` = e-mail du visiteur (absent pour un rappel), sujet `Site Janus34 : <objet>` ou `Site Janus34 : demande de rappel`, texte contenant nom, message et `/admin/messages` ; `fetchFn` qui rejette ou répond 500 → la promesse se résout. Action contact : alerte appelée après l'insertion réussie, pas appelée si l'insertion échoue, succès renvoyé même si l'alerte échoue.
- [ ] **Step 2: Lancer** → FAIL. **Step 3: Implémenter** (texte brut, URL de l'admin depuis `NEXT_PUBLIC_SITE_URL` ou `https://gemjanus34.vercel.app`). **Step 4:** `npx vitest run` → PASS.
- [ ] **Step 5: Commit** `feat: e-mail the team when a message arrives`

### Task 5: « Rappelez-moi »

**Files:**
- Create: `supabase/migrations/20261109090300_callback_requests.sql`, test pgTAP ajouté à `supabase/tests/contact_messages_test.sql`
- Create: `src/lib/contact/callback-schema.ts`, `src/components/contact/callback-form.tsx`
- Modify: `src/app/contact/actions.ts` (action `sendCallbackRequest`), `src/app/nous-rejoindre/page.tsx`, `src/app/admin/messages/page.tsx`, `src/lib/database.types.ts`
- Test: `src/lib/contact/__tests__/callback-schema.test.ts`, test de l'action, test de la page admin messages

**Interfaces:**
- Consumes: `getSiteSettings()` (tâche 3), `sendContactAlert` (tâche 4).
- Produces: colonnes `contact_messages.kind text not null default 'message'` (`message|callback`) et `phone text` ; `callbackSchema` ; `sendCallbackRequest(prev, formData): Promise<ContactActionState>`.

- [ ] **Step 1: Migration** : `email`, `subject` deviennent nullables ; check `(kind = 'message' and email is not null and subject is not null and char_length(message) between 20 and 5000 and phone is null) or (kind = 'callback' and phone ~ '^\+?[0-9 .]{10,20}$' and email is null and subject is null and char_length(message) <= 100)`. L'ancien check de longueur du message est remplacé (`drop constraint` du check nommé automatiquement : lire son nom dans `pg_constraint`). Grant insert `(name, email, subject, message, kind, phone)`. Test pgTAP : anon insère un rappel valide ; un rappel avec e-mail, ou un téléphone `abc`, → `23514` ; un message classique sans e-mail → `23514`.
- [ ] **Step 2: Tests vitest qui échouent** : schéma accepte `"06 12 34 56 78"` et `"+33 6 12 34 56 78"`, refuse `"123"` ; action : piège à robots rempli → succès sans insertion ; réglage `callbackEnabled=false` → `formError` sans insertion ; insertion `{ kind: "callback", name, phone, message: moment }` puis alerte `kind: "callback"`. Page admin : un rappel affiche « À rappeler » et un lien `tel:`, pas de bouton « Répondre par e-mail ».
- [ ] **Step 3: Implémenter.** Formulaire : « Vous hésitez à appeler ? Laissez votre numéro, l'équipe vous rappelle. » ; champs « Votre prénom ou nom », « Votre téléphone », « Quand vous joindre ? (facultatif) », consentement « J'accepte que l'équipe me rappelle à ce numéro. ». Rendu sur `/nous-rejoindre` seulement si `callbackEnabled`. Le message de succès : « Merci, l'équipe vous rappellera. »
- [ ] **Step 4:** `npx vitest run` et `supabase test db` → PASS.
- [ ] **Step 5: Commit** `feat: call-me-back form on the first visit page`

### Task 6: Adhésion et dons

**Files:**
- Create: `src/components/contact/membership-link.tsx`
- Modify: `src/app/nous-rejoindre/page.tsx`, `src/components/site-footer.tsx`, `src/app/layout.tsx` (passe l'URL au pied de page)
- Test: `src/components/contact/__tests__/membership-link.test.tsx`

**Interfaces:**
- Consumes: `getSiteSettings()`, `membershipHref()` (tâche 3).
- Produces: `MembershipLink({ href }: { href: string | null })`, ne rend rien si `href` est null.

- [ ] **Step 1: Test qui échoue** : `href` null → rien ; sinon un lien « Adhérer ou faire un don » vers l'URL, `rel="noopener noreferrer"`, `target="_blank"`, avec la mention accessible « (nouvel onglet) ».
- [ ] **Step 2-4:** implémenter, intégrer aux deux endroits, `npx vitest run` → PASS.
- [ ] **Step 5: Commit** `feat: HelloAsso membership and donation link behind a switch`

### Task 7: Planning dans l'agenda

**Files:**
- Create: `src/lib/planning/ics.ts`, `src/app/planning.ics/route.ts`, `src/lib/planning/__tests__/ics.test.ts`
- Modify: `src/components/planning/week-planning.tsx` (liens d'abonnement, absents en version imprimable)

**Interfaces:**
- Consumes: `buildWeek`, `currentMonday`, `addDays` (`src/lib/planning/week.ts`), `contact` (`src/content/contact.ts`).
- Produces: `buildPlanningCalendar(planning: Planning, now: string, weeks = 8): string` (texte iCalendar, lignes en CRLF, pliées à 75 octets) ; route GET `/planning.ics` (`text/calendar; charset=utf-8`).

- [ ] **Step 1: Tests qui échouent** : commence par `BEGIN:VCALENDAR` et contient `VERSION:2.0`, `PRODID`, `X-WR-CALNAME:Planning Janus34` ; un `VTIMEZONE` Europe/Paris ; une séance normale donne `DTSTART;TZID=Europe/Paris:20261110T140000`, `SUMMARY`, `LOCATION:405 rue des Grèzes\, 34070 Montpellier` ; UID = `<date>-<slot.id>@gemjanus34.fr` ; séance annulée et jour de fermeture absents ; séance exceptionnelle présente ; virgules, points-virgules et retours ligne échappés ; aucune ligne de plus de 75 octets.
- [ ] **Step 2-3:** implémenter ; la route lit `getPlanning()`, renvoie un calendrier vide (sans événement) si pas de planning, `Cache-Control: public, max-age=3600`.
- [ ] **Step 4:** bloc « Ajouter le planning à mon agenda » : lien `webcal://<hôte>/planning.ics` (« Agenda du téléphone ») et `https://calendar.google.com/calendar/r?cid=<webcal encodé>` (« Google Agenda »), hôte tiré de `headers()` ; phrase « Le planning se met à jour tout seul, annulations comprises. ». `npx vitest run` → PASS.
- [ ] **Step 5: Commit** `feat: subscribe to the planning from a phone or Google calendar`

### Task 8: Statistiques sans cookie

**Files:**
- Modify: `src/app/layout.tsx`, `next.config.ts`

- [ ] **Step 1:** `layout.tsx` rend `<Script src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon={JSON.stringify({ token })} strategy="afterInteractive" />` seulement si `NEXT_PUBLIC_CF_ANALYTICS_TOKEN` est défini et hors `/admin` (le beacon n'a rien à mesurer dans l'admin : le placer dans le layout public suffit, l'admin a son propre layout).
- [ ] **Step 2:** CSP : `script-src` + `https://static.cloudflareinsights.com`, `connect-src` + `https://cloudflareinsights.com`, seulement si le jeton est défini.
- [ ] **Step 3:** `npm run build` → OK ; vérifier l'en-tête CSP produit avec et sans jeton (`next start` + `curl -I`).
- [ ] **Step 4: Commit** `feat: cookieless visit statistics with Cloudflare Web Analytics`

### Task 9: Sauvegarde quotidienne

**Files:**
- Create: `scripts/backup.mjs`, `.github/workflows/backup.yml`
- Modify: `.gitignore` (`backups/`)

- [ ] **Step 1:** `scripts/backup.mjs` d'après `clossaintconti/scripts/backup-db.mjs` : jeton depuis `SUPABASE_ACCESS_TOKEN` ou `~/.config/gemjanus34-supabase-token`, référence depuis `SUPABASE_PROJECT_REF` ou `knanpezmzadidyfhyxgf` ; tables `public` + `auth.users (id, email, created_at, last_sign_in_at, raw_user_meta_data)` dans `backups/<horodatage>/db.json` ; chaque objet `storage.objects` du bucket `documents` téléchargé depuis `https://<ref>.supabase.co/storage/v1/object/public/documents/<name>` dans `backups/<horodatage>/documents/`. Sort en erreur (code 1) si une table ou un fichier échoue. Restauration documentée en tête.
- [ ] **Step 2:** lancer `node scripts/backup.mjs` contre la production (lecture seule) → nombre de lignes par table et de fichiers, code 0.
- [ ] **Step 3:** `backup.yml` : `schedule: cron "17 2 * * *"` + `workflow_dispatch`, Node 22, `node scripts/backup.mjs`, `actions/upload-artifact` du dossier `backups/` avec `retention-days: 90`.
- [ ] **Step 4: Commit** `feat: daily database and documents backup`

### Task 10: Vérification complète

- [ ] `npx vitest run`, `npm run lint`, `npm run typecheck`, `supabase test db`, `npm run build`, `npx playwright test` (variables Supabase locales en ligne de commande) → tout vert.
- [ ] Revue de toute la branche par un relecteur neuf.
