# Vidéos, carte et aperçu des PDF : plan

**Goal:** lecteurs vidéo et carte chargés au clic, aperçu des PDF dans un volet.
**Architecture:** une fonction pure reconnaît les liens vidéo ; un composant client `ClickToLoad` sert aux vidéos et à la carte ; un composant client `DocumentPreview` monte l'iframe du PDF à l'ouverture d'un `<details>`. La CSP de `next.config.ts` s'ouvre aux seuls domaines nécessaires.
**Spec:** docs/superpowers/specs/2026-10-16-videos-carte-apercu-pdf.md

## Global Constraints

- Rien de tiers chargé avant le clic, sauf la vignette YouTube.
- Textes en français, typographie par `fr()`, pas de tiret cadratin.
- Projet sous npm : `npm run typecheck`, `npx vitest run`, `npm run lint`, `npx playwright test`.

## Review Focus

- Lien YouTube avec paramètres en plus (`&t=42s`, `&list=`) : l'identifiant seul est gardé.
- Lien vers une chaîne ou une playlist YouTube : reste un lien.
- Lien vidéo au milieu d'une phrase : reste un lien.
- PDF du site affiché en iframe malgré `frame-ancestors` : vérifié par Playwright.
- PDF du stockage Supabase : `frame-src` construit depuis `NEXT_PUBLIC_SUPABASE_URL`.

### Task 1 : reconnaître les vidéos

- `src/lib/content/embeds.ts` : `videoEmbed(href: string): VideoEmbed | null` avec `VideoEmbed = { provider: "YouTube" | "Vimeo"; src: string; thumbnail?: string }`.
- Test `src/lib/content/__tests__/embeds.test.ts` : formes watch, youtu.be, shorts, embed, paramètres en plus, Vimeo, chaîne et playlist refusées, autre site refusé.

### Task 2 : `ClickToLoad` et lecteur dans le contenu riche

- `src/components/content/click-to-load.tsx` (client) : `{ title, src, actionLabel, notice, thumbnail?, linkHref, linkLabel, variant: "video" | "map" }`. Pas d'iframe avant le clic ; après, iframe `title` = titre, `allow` plein écran et lecture auto.
- `rich-blocks.tsx` : paragraphe d'un seul nœud texte lié à une vidéo, rendu par `ClickToLoad`.
- Tests : `click-to-load.test.tsx`, cas ajoutés dans `content-page.test.tsx`.

### Task 3 : carte sur Contact

- `contact.mapEmbedSrc` dans `src/content/contact.ts` ; `ClickToLoad` variante carte sur `src/app/contact/page.tsx`.
- Test : `src/app/__tests__/contact-page.test.tsx`.

### Task 4 : aperçu des PDF

- `src/components/content/document-preview.tsx` (client) dans `document-list.tsx` : `<details>`, iframe montée au premier `toggle` ouvert, « Ouvrir en grand », « Télécharger » (`?download=` pour une adresse http).
- Tests : `content-page.test.tsx` adapté.

### Task 5 : CSP, confidentialité, parcours

- `next.config.ts` : `frame-src`, `img-src`, `frame-ancestors 'self'`, `X-Frame-Options: SAMEORIGIN`.
- Migration `20261016220000_privacy_embeds.sql` (section ajoutée si absente) + `seed.sql` + `seed.ts` ; test pgTAP dans `fixed_pages_test.sql`.
- Playwright : vidéo de Ressources au clic, PDF affiché dans le volet, carte au clic.
