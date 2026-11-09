# Lot 2 : galerie et couleurs - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Galerie des créations activable (coupée par défaut) et interface de couleurs du site dans Réglages.

**Architecture:** Galerie = table `gallery_items` + bucket public `gallery`, lecture publique conditionnée par `site_settings.gallery_enabled` en RLS. Couleurs = colonne `site_settings.theme` (jsonb) ; le layout injecte une balise `<style>` qui redéfinit cinq variables de base et recalcule les nuances avec `color-mix()`. Les nuances écrites en dur dans `globals.css` deviennent des variables qui gardent leur valeur d'origine.

**Tech Stack:** Next.js 16, Supabase (RLS, Storage, pgTAP), zod 4, Vitest, Playwright, npm.

**Spec:** `docs/superpowers/specs/2026-11-09-lot2-logo-galerie-couleurs-design.md` (le logo y est déjà fait).

## Global Constraints

- npm, jamais pnpm ; tests unitaires sans `NEXT_PUBLIC_SUPABASE_*` dans l'environnement.
- Chaque migration liste ses `grant`.
- Aucune dépendance nouvelle. Textes en français, sans tiret cadratin.
- Couleurs au format `#rrggbb` uniquement (vérifié en SQL et en zod) : c'est ce qui rend l'injection dans `<style>` sûre.
- Contraste minimal 4,5:1 pour texte/fond, blanc/vert, blanc/corail.

## Review Focus

- Galerie coupée : un visiteur ne lit aucune création, même par l'API publique (test pgTAP).
- Une création sans accord de l'auteur est refusée en base (test pgTAP).
- Un fichier renommé en `.jpg` qui n'est pas une image est refusé (test de l'analyse du formulaire).
- Un thème illisible (texte clair sur fond clair) est refusé avec le couple en cause (test de `validateTheme`).
- Thème illisible en base (écrit à la main) ou valeur hors format : le site garde les couleurs d'origine (test de `themeStyle`).

---

### Task 1: Galerie en base

**Files:** Create `supabase/migrations/20261109120000_gallery.sql`, `supabase/tests/gallery_test.sql` ; Modify `src/lib/database.types.ts`.

- [ ] Test pgTAP (RED) : `gallery_items` existe ; anon lit 0 ligne quand `gallery_enabled` est faux, 1 quand vrai ; éditeur insère une création avec `consent = true` ; `consent = false` → `23514` ; anon n'insère pas (`42501`) ; éditeur supprime ; bucket `gallery` public, 4 Mo, types `image/jpeg,image/png,image/webp`.
- [ ] Migration : `alter table site_settings add column gallery_enabled boolean not null default false` (+ grant update de la colonne) ; table `gallery_items (id uuid pk, title text 1-120, author text null <=80, workshop text null <=80, image_path text not null, image_url text not null, consent boolean not null check (consent), created_by uuid not null references profiles, created_at timestamptz default now())` ; RLS : select anon/authenticated `using ((select gallery_enabled from public.site_settings) or public.is_active_editor())`, insert `with check (is_active_editor() and created_by = auth.uid())`, delete `using (is_active_editor())` ; grants select/insert/delete ; bucket + policies storage comme `documents`.
- [ ] `supabase db reset && supabase test db` → PASS. Commit `feat: gallery table and bucket behind a switch`.

### Task 2: Galerie dans l'admin

**Files:** Create `src/lib/admin/gallery-input.ts`, `src/app/admin/galerie/{page.tsx,actions.ts}`, `src/components/admin/gallery-upload-form.tsx` ; Modify `admin-shell.tsx` (entrée « Galerie », icône `Images`), `settings-form.tsx` + `reglages/actions.ts` (case « Afficher la galerie »), `site-settings.ts` (`galleryEnabled`, défaut false).

**Interfaces:** `parseGalleryFormData(formData): Promise<{success:true,data:{title,author,workshop,file}}|{success:false,fieldErrors}>` ; actions `uploadGalleryItem`, `deleteGalleryItem` ; `SiteSettings.galleryEnabled: boolean`.

- [ ] Tests (RED) : signature JPEG (`FF D8 FF`), PNG (`89 50 4E 47`), WebP (`RIFF....WEBP`) acceptées, PDF renommé `.jpg` refusé, plus de 4 Mo refusé, accord non coché refusé, auteur et atelier vides → null ; action : envoi puis insertion, suppression de la photo si l'insertion échoue ; suppression : ligne puis fichier ; réglages : `galleryEnabled` lu et enregistré.
- [ ] Implémenter sur le modèle de `documents` (chemin `gallery/<slug>-<base36>.<ext>`). `npx vitest run` → PASS. Commit `feat: gallery admin`.

### Task 3: Galerie publique

**Files:** Create `src/app/galerie/page.tsx`, test ; Modify `site-footer.tsx` + `layout.tsx` (lien si activée), `src/app/activites/page.tsx` (lien), `next.config.ts` (`img-src` + origine du stockage).

- [ ] Tests (RED) : galerie coupée → `notFound()` ; activée → une figure par création avec photo (alt = titre), titre, « par <auteur> », atelier ; lien « Galerie » dans le pied de page seulement si activée.
- [ ] Implémenter (`<Image unoptimized>`), `npx vitest run` → PASS. Commit `feat: public gallery page`.

### Task 4: Couleurs du site

**Files:** Create `src/lib/settings/theme.ts`, test ; Create `supabase/migrations/20261109120100_site_theme.sql` + test pgTAP ; Modify `globals.css` (nuances en dur → variables à valeur d'origine), `layout.tsx` (style injecté), `site-settings.ts` (`theme`), `reglages/actions.ts` (`saveTheme`, `resetTheme`), `settings-form.tsx` ou `theme-form.tsx` (cinq sélecteurs + aperçu + réinitialiser).

**Interfaces:** `type Theme = { forest; coral; sun; background; text }` (chaînes `#rrggbb`) ; `defaultTheme` (valeurs actuelles de `:root`) ; `contrastRatio(a, b): number` ; `validateTheme(theme): { ok: true } | { ok: false; problems: string[] }` ; `themeStyle(theme: unknown): string | null` (null si thème absent, mal formé ou illisible ; sinon `:root{--forest:…;--forest-dark:color-mix(…)…}`).

- [ ] Test pgTAP (RED) : `theme` accepte `{"forest":"#112233",…}`, refuse une valeur `red` ou `#12345` (`23514`) ; seul l'admin écrit.
- [ ] Tests vitest (RED) : `contrastRatio("#000000","#ffffff") ≈ 21` ; `validateTheme(defaultTheme).ok` ; texte `#dddddd` sur fond `#ffffff` refusé avec « texte » dans le problème ; `themeStyle(null) === null`, `themeStyle({forest:"red"}) === null`, `themeStyle(thème valide)` contient `--forest:#…` et `color-mix` ; action : non-admin refusé, illisible refusé, valide enregistré, réinitialiser met `theme` à null.
- [ ] Refactor CSS : chaque nuance en dur devient une variable de `:root` à sa valeur exacte ; captures avant/après à 375 et 1280 px identiques.
- [ ] Implémenter ; `npx vitest run`, `supabase test db` → PASS. Commit `feat: site colors from the settings`.

### Task 5: Vérification et déploiement

- [ ] vitest, lint, typecheck, `supabase test db`, build (relancer si l'alerte sécurité Next bloque), Playwright, captures des nouvelles pages.
- [ ] Revue de la branche par un relecteur neuf, corrections.
- [ ] Sauvegarde prod, migrations prod, fusion dans main, push, vérification en ligne.
