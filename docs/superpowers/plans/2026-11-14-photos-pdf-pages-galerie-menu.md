# Photos et PDF dans les pages, Galerie dans le menu : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** boutons « Insérer une photo » et « Joindre un PDF » dans l'éditeur, rendu public correspondant, Galerie dans le menu.

**Architecture:** nouveau bloc `image` validé en zod et en SQL ; PDF = paragraphe-lien rendu par `DocumentPreview` ; fichiers dans un bucket public `page-media` via une action serveur.

**Tech Stack:** Next 16, Tiptap 3, Supabase (Postgres + Storage), zod, vitest, pgTAP.

**Spec:** `docs/superpowers/specs/2026-11-14-photos-pdf-pages-galerie-menu-design.md`

## Global Constraints

- npm, jamais pnpm : `npm run typecheck`, `npx vitest run`, `npx eslint`.
- Ne pas exporter `NEXT_PUBLIC_SUPABASE_*` dans le shell pour les tests unitaires.
- Fichiers à 4 Mo au plus (4194304 octets). Photo réduite à 1600 px, JPEG 0,85.
- `alt` de 1 à 300 caractères ; `src` = `^https?://[^/\s]+/storage/v1/object/public/page-media/[a-z0-9][a-z0-9-]*\.(jpg|png|webp)$`.
- Textes en français, sans tiret cadratin.

## Review Focus

- Image collée depuis un autre site : l'éditeur ne la reconnaît pas (pas de `data-page-media`), rien d'externe n'est enregistré. Test : schéma refuse une `src` externe.
- Lien PDF externe seul dans un paragraphe : reste un simple lien (la CSP bloquerait l'aperçu). Test dans Task 3.
- Annulation de la description de la photo : rien n'est envoyé ni inséré. Vérifié au navigateur (Task 4).
- PDF de plus de 4 Mo : message clair, rien d'inséré. Test dans Task 2.
- Galerie coupée : absente du menu. Test dans Task 5.

---

### Task 1: bloc image dans le schéma (zod + SQL) et bucket

**Files:**
- Modify: `src/lib/content/rich-content-schema.ts`
- Create: `supabase/migrations/20261114120000_page_media.sql`
- Test: `src/lib/content/__tests__/rich-content-schema.test.ts`, `supabase/tests/page_media_test.sql`

**Interfaces:**
- Produces: `RichBlock` gagne `{ type: "image"; attrs: { src: string; alt: string } }` ; `isPageMediaImageSrc(src: string): boolean` exporté.

- [ ] Tests zod : accepte `{type:"image",attrs:{src:"https://x.supabase.co/storage/v1/object/public/page-media/photo-abc.jpg",alt:"Un atelier"}}` au niveau doc et dans un listItem ; refuse `src` externe (`https://example.com/a.jpg`), `alt` vide ; `serializeRichContent` retire `title`, `width`, `height` des attrs image. Le test existant « rejects a image node » est remplacé par « rejects an image from another site ».
- [ ] Les voir échouer, implémenter, les voir passer.
- [ ] Migration : `create or replace function public.is_valid_rich_content` = schéma actuel + définition `image` ajoutée à `block` et aux items de `listItem` ; bucket `page-media` (public, 4194304, jpeg/png/webp/pdf) ; policies storage select/insert/delete `is_active_editor()` comme `gallery`.
- [ ] Test pgTAP : bucket configuré ; fonction accepte l'image du bucket, refuse une image externe. Appliquer en local (`docker exec … psql`), lancer `npx supabase test db`.
- [ ] Commit.

### Task 2: envoi des fichiers

**Files:**
- Modify: `src/lib/admin/gallery-input.ts` (exporter `imageKind`), `src/lib/admin/document-input.ts` (exporter `isPdf(file: File): Promise<boolean>`)
- Create: `src/lib/admin/page-media-input.ts`, `src/app/admin/page-media-actions.ts`
- Test: `src/lib/admin/__tests__/page-media-input.test.ts`

**Interfaces:**
- Produces: `parsePageMedia(file: unknown, kind: "photo" | "pdf"): Promise<{ ok: true; extension: string; contentType: string } | { ok: false; error: string }>` ; action `uploadPageMedia(formData: FormData): Promise<{ url: string } | { error: string }>` avec champs `kind`, `file`, `title` (PDF).

- [ ] Tests : photo JPEG acceptée (`jpg`, `image/jpeg`) ; PDF passé en photo refusé ; PDF accepté ; fichier vide refusé ; fichier de 4194305 octets refusé avec « Le fichier dépasse 4 Mo. ».
- [ ] Échec, implémentation, succès.
- [ ] Action : `requireProfile()`, upload dans `page-media`, chemin `photo-<base36>.<ext>` ou `<slug du titre>-<base36>.pdf`, renvoie `getPublicUrl`. Commentaire `shortcut:` sur les fichiers orphelins.
- [ ] Commit.

### Task 3: rendu public

**Files:**
- Modify: `src/components/content/rich-blocks.tsx`, `src/app/globals.css`
- Test: `src/components/__tests__/rich-blocks.test.tsx` (ou le test existant du rendu)

- [ ] Tests : un bloc image rend `figure.content-figure img[alt="Un atelier"][loading="lazy"]` ; un paragraphe-lien seul vers `…/page-media/compte-rendu-x.pdf` rend le titre et le bouton « Afficher le document » ; un lien seul vers `https://example.com/a.pdf` reste un lien.
- [ ] Échec, implémentation, succès. CSS : image pleine largeur, coins arrondis comme les autres encarts.
- [ ] Commit.

### Task 4: boutons de l'éditeur

**Files:**
- Create: `src/components/admin/page-image-node.ts`, `src/lib/admin/shrink-photo.ts`
- Modify: `src/components/admin/rich-text-editor.tsx` (extension), `src/components/admin/editor-toolbar.tsx`
- Test: `src/components/admin/__tests__/editor-toolbar.test.tsx` (existant ou nouveau)

**Interfaces:**
- Consumes: `uploadPageMedia` (Task 2).
- Produces: `PageImage` (nœud Tiptap `image`, attrs `src`/`alt`, parse `img[data-page-media]`) ; `shrinkPhoto(file: File): Promise<Blob>`.

- [ ] Test : la barre montre « Insérer une photo » et « Joindre un PDF » ; le nœud `PageImage` fait l'aller-retour JSON d'une image (editor.getJSON).
- [ ] Échec, implémentation, succès. Flux : input fichier caché → description (photo, obligatoire, annulation = abandon) ou titre (PDF, défaut = nom sans extension) → « Envoi en cours… » → insertion ou message d'erreur dans la zone d'erreur existante.
- [ ] Vérification navigateur en local : photo et PDF insérés dans une page, enregistrés, page publique correcte.
- [ ] Commit.

### Task 5: Galerie dans le menu

**Files:**
- Modify: `src/components/navigation-links.tsx`, `src/components/site-header.tsx`, `src/components/mobile-navigation.tsx` (si elle relaie les props), `src/app/layout.tsx`, `src/components/admin/page-form.tsx` (aide)
- Test: `src/components/__tests__/site-header.test.tsx`

- [ ] Tests : avec `galleryEnabled` et deux pages, ordre `/…, /nous-rejoindre, /sorties, /galerie, /ils-ont-parle, /ressources, /contact` ; sans page, `/galerie` avant `/ressources` ; coupée, pas de `/galerie`.
- [ ] Échec, implémentation, succès ; contrôle visuel 1200 px (le menu tient).
- [ ] Commit.

### Task 6: mise en ligne

- [ ] Suite complète, typecheck, lint, build.
- [ ] Migration prod par l'API `/database/query` en transaction + ligne dans `supabase_migrations.schema_migrations`, AVANT le push.
- [ ] Push sur main, vérification sur gemjanus34.vercel.app.
