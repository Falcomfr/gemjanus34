# Refonte éditoriale du site public - Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le site public sommaire par la direction « histoire et identité » validée, avec un contenu substantiel et vérifié sur chaque page principale.

**Architecture:** On garde Next.js, le mini-CMS et le dépôt de contenu. Le modèle `PublicPage` gagne des champs optionnels (listes, liens) que le mappage Supabase sait produire ; `ContentPage` les affiche. Les pages principales restent servies par leur route dédiée, avec un repli sur le contenu embarqué quand Supabase n'a pas la page (cause des 404 actuels en production).

**Tech Stack:** Next.js 16, React 19, TypeScript, CSS global (`src/app/globals.css`), Vitest + Testing Library, Playwright 1.64.

**Spec:** `docs/superpowers/specs/2026-10-16-public-site-content-redesign.md` (maquette : `.superpowers/brainstorm/1991118-1792150795/content/homepage-editorial-v2.html`).

## Constat préalable (vérifié le 16/10/2026)

- En production, `/qui-sommes-nous`, `/activites`, `/nous-rejoindre`, `/ressources`, `/mentions-legales`, `/confidentialite` répondent 404 : le dépôt Supabase renvoie `null` pour un slug absent de la base.
- Tous les liens `/documents/*` répondent 404 : aucun fichier n'existe. Deux documents « santé » du seed sont inventés.
- Le planning officiel `Planning-19-06-2026.pdf` (site WordPress) est un planning hebdomadaire « à partir de 22/06/2026 » : ouverture du GEM à 13 h, du lundi au samedi.

## Global Constraints

- Titre d'accueil exact : « Rompre les solitudes, créer des liens ».
- Actions du premier écran exactes : « Découvrir Janus34 » → `/qui-sommes-nous`, « Préparer une première visite » → `/nous-rejoindre`.
- Navigation exacte et ordonnée : Le GEM, Activités, Planning et actualités, Première visite, Ressources, Contact. Les URL existantes sont conservées (redirections héritées et sitemap inchangés).
- Téléphone `04 67 04 87 68` / `tel:+33467048768` ; adresse `405 rue des Grèzes, 34070 Montpellier` ; bus 11, arrêt La Martelle.
- Formulations interdites sur tout le site public : « importé », « ancien site », « mise à jour éditoriale », « contenu provisoire », « en attente de validation ».
- Aucune invention : pas de nom de salarié, de tarif, de condition d'adhésion ni d'information médicale absents des sources officielles. Pas d'adresse e-mail publiée (deux adresses contradictoires sur l'ancien site).
- Couleurs : vert `#174f43`, jaune `#f2c14e`, corail `#c84f3b` (texte corail : `#9f392a`). Contraste AA pour tout texte.
- Corps ≥ 16 px ; tailles de titres fixes par point de rupture (pas de `vw` dans les `font-size` publics).
- Aucun débordement horizontal à 320, 768 et 1440 px.
- Aucune nouvelle dépendance.

## Review Focus

1. **Supabase sans la page** : une route principale doit afficher le contenu embarqué au lieu d'un 404 (test dans la tâche 1).
2. **Section Supabase avec une liste** : un `bulletList` saisi dans l'éditeur ne doit plus faire planter la page publique (test dans la tâche 1).
3. **Aucune actualité, ou seulement des anciennes** : l'accueil ne doit jamais présenter une archive comme récente (test dans la tâche 4).
4. **Menu mobile après un clic** : le menu se referme, même si on clique le lien de la page courante (test dans la tâche 3).
5. **Lien de document mort** : chaque `downloadUrl` du seed correspond à un fichier de `public/` (test dans la tâche 2).

---

### Task 1: Modèle de contenu et dépôt Supabase

**Files:**
- Modify: `src/content/types.ts`, `src/lib/content/supabase-public-content-repository.ts`, `src/lib/content/local-public-content-repository.ts` (clone profond des nouveaux champs)
- Test: `src/lib/content/__tests__/public-repository.test.ts` (fichier existant des tests Supabase)

**Interfaces:**
- Produces:
  ```ts
  export type PageLink = { label: string; href: string };
  export type PageSection = {
    id: string; title: string; body: string;
    items?: string[]; ordered?: boolean; links?: PageLink[];
  };
  // PublicPage.sections: PageSection[]
  ```

- [ ] **Step 1: Tests en échec**
  - `falls back to the bundled page when Supabase has no published row` : client qui renvoie `[]`, `getPage("activites")` → page dont `title` vaut celui du seed.
  - `maps bullet and ordered lists to section items` : `heading` + `bulletList` de deux `listItem` → `items` = textes des deux éléments ; `heading` + `orderedList` → `ordered: true`. Une liste s'ajoute à la section courante (section « Contenu » créée si aucune) ; une seconde liste dans la même section ajoute ses éléments, `ordered` reste celui de la première.
  - `keeps paragraphs separated by blank lines` (déjà le comportement, à figer).
- [ ] **Step 2: `npx vitest run src/lib/content` → FAIL**
- [ ] **Step 3: Implémenter** : repli `rows[0] ? mapPage(rows[0]) : localRepository.getPage(slug)` ; listes : texte de chaque `listItem` = concaténation de ses paragraphes.
- [ ] **Step 4: `npx vitest run src/lib/content` → PASS**
- [ ] **Step 5: Commit** `fix: serve bundled pages when Supabase has none`

### Task 2: Coordonnées partagées et vrais documents

**Files:**
- Create: `src/content/contact.ts`, `public/documents/*.pdf` (copiés depuis gemjanus34.fr)
- Modify: `src/content/seed.ts` (`publicDocuments`, `newsItems`), `src/content/__tests__/public-content.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export const contact = {
    phone: "04 67 04 87 68", phoneHref: "tel:+33467048768",
    street: "405 rue des Grèzes", city: "34070 Montpellier",
    transport: "Bus 11, arrêt La Martelle",
    openingHours: "Le GEM ouvre à 13 h, du lundi au samedi.",
  } as const;
  ```
- Documents (slug → fichier) : `planning-des-activites` (`Planning-19-06-2026.pdf`, `updatedAt` `2026-06-22`, catégorie planning), `statuts-association` (2009), `reglement-interieur` (mai 2021), `regles-de-vie` (2019), `compte-rendu-ag-2025` (institutional) ; santé : `questions-reponses-troubles-bipolaires`, `connaitre-trouble-bipolaire`, `vivre-avec-troubles-bipolaires`, `conseils-entourage`, `diagramme-humeur`. `downloadUrl` = `/documents/<slug>.pdf`.

- [ ] **Step 1: Tests en échec** : `every document download points to a bundled file` (`fs.existsSync(path.join("public", url))`) ; mise à jour du test de catégories avec les slugs ci-dessus.
- [ ] **Step 2: `npx vitest run src/content` → FAIL**
- [ ] **Step 3: Copier les PDF, réécrire `publicDocuments`, retirer l'actualité « Planning 19 06 2026 » (c'est un document), créer `contact.ts`.**
- [ ] **Step 4: `npx vitest run src/content` → PASS**
- [ ] **Step 5: Commit** `feat: publish the association's official documents`

### Task 3: En-tête, navigation et menu mobile

**Files:**
- Create: `src/components/mobile-navigation.tsx` (client)
- Modify: `src/content/navigation.ts`, `src/components/site-header.tsx`, `src/components/__tests__/site-header.test.tsx`

**Interfaces:**
- Consumes: `contact` (tâche 2).
- Produces: `MobileNavigation({ children }: { children: ReactNode })` : `<details>` qui se ferme au clic sur tout lien qu'il contient.

- [ ] **Step 1: Tests en échec**
  - navigation exacte : `[["Le GEM","/qui-sommes-nous"],["Activités","/activites"],["Planning et actualités","/actualites"],["Première visite","/nous-rejoindre"],["Ressources","/ressources"],["Contact","/contact"]]` (bureau et mobile).
  - `closes the mobile menu after choosing a link` : ouvrir `details`, cliquer « Contact » → `details.open === false`.
  - `keeps the phone number inside the mobile menu` : lien `tel:+33467048768` dans la navigation mobile.
  - le logo (`img` alt vide, lien « Janus34, accueil ») remplace le monogramme « J34 ».
- [ ] **Step 2: `npx vitest run src/components/__tests__/site-header.test.tsx` → FAIL**
- [ ] **Step 3: Implémenter** (« Première visite » `prominent`).
- [ ] **Step 4: → PASS**
- [ ] **Step 5: Commit** `feat: visitor-oriented navigation`

### Task 4: Regroupement des actualités et planning public

**Files:**
- Create: `src/lib/content/group-news.ts`
- Modify: `src/components/news/news-list.tsx`, `src/components/home/current-planning.tsx`, `src/components/home/upcoming-news.tsx`, `src/app/actualites/page.tsx`
- Test: `src/lib/content/__tests__/group-news.test.ts`, `src/components/news/__tests__/news-list.test.tsx`

**Interfaces:**
- Produces: `groupNews(items: NewsItem[], now: string): { upcoming: NewsItem[]; recent: NewsItem[]; archived: NewsItem[] }` : publiées seulement ; `upcoming` = fin (`endsAt ?? startsAt`) aujourd'hui ou après, tri croissant ; `recent` = terminées depuis 60 jours au plus, tri décroissant ; `archived` = le reste, tri décroissant.
- Produces: `UpcomingNews({ items, now }: { items: NewsItem[]; now: string })` : affiche `upcoming` puis `recent` (3 au plus) avec un statut « À venir » / « Passé » ; jamais les archives ; sinon « Aucun rendez-vous n'est annoncé pour le moment. » ; lien « Toutes les actualités » → `/actualites`.
- Produces: `CurrentPlanning({ document })` : section `id="planning"`, titre « Le planning des activités », « En vigueur depuis le <date> », lien « Consulter le planning (PDF) » ; sans document : « Le planning est disponible auprès de l'équipe » + lien téléphone.

- [ ] **Step 1: Tests en échec** : bornes des 60 jours (59 → recent, 61 → archived), date seule du jour → upcoming ; `NewsList` expose trois régions « À venir », « Informations récentes », « Archives » ; accueil avec une seule actualité de 2025 → pas de carte, message vide ; `CurrentPlanning` sans le mot « import ».
- [ ] **Step 2: `npx vitest run src/lib/content src/components/news` → FAIL**
- [ ] **Step 3: Implémenter** (`NewsList` délègue à `groupNews`).
- [ ] **Step 4: → PASS**
- [ ] **Step 5: Commit** `feat: separate upcoming, recent and archived news`

### Task 5: Accueil

**Files:**
- Create: `src/components/home/quick-access.tsx`, `src/components/home/mission.tsx`
- Modify: `src/app/page.tsx`, `src/components/home/hero.tsx`, `src/components/home/visit-panel.tsx`, `src/app/__tests__/home-page.test.tsx`

**Interfaces:**
- Consumes: `contact`, `groupNews` via `UpcomingNews`, `CurrentPlanning`.
- `Hero()` sans props ; `QuickAccess()` : « Le planning » → `/actualites#planning`, « Venir au GEM » → `/nous-rejoindre`, « Nous appeler » → `tel:` ; `Mission()` : « Un espace d'entraide, pas un lieu de soins » + trois familles « Créer et s'exprimer », « Bouger et prendre l'air », « Échanger et agir ensemble » avec leurs ateliers du planning.

- [ ] **Step 1: Tests en échec** (réécriture de `home-page.test.tsx`) : h1 exact ; deux actions du premier écran ; trois accès rapides et leurs `href` ; avec et sans planning ; aucune formulation interdite dans `document.body.textContent`.
- [ ] **Step 2: `npx vitest run src/app/__tests__/home-page.test.tsx` → FAIL**
- [ ] **Step 3: Implémenter** dans l'ordre : Hero, QuickAccess, Mission, CurrentPlanning, UpcomingNews, VisitPanel (« Préparer une première visite », « Écrire à l'équipe » → `/contact`).
- [ ] **Step 4: → PASS**
- [ ] **Step 5: Commit** `feat: rebuild the home page hierarchy`

### Task 6: Pages intérieures et contenu

**Files:**
- Modify: `src/components/content/content-page.tsx`, `src/content/seed.ts` (`publicPages`), `src/app/{qui-sommes-nous,activites,nous-rejoindre,ressources,contact}/page.tsx`, `src/components/contact/contact-form.tsx`, `src/components/site-footer.tsx`
- Create: `src/components/content/practical-info.tsx`
- Test: `src/components/content/__tests__/content-page.test.tsx`, `src/content/__tests__/public-content.test.ts`, `src/app/__tests__/content-routes.test.tsx`

**Interfaces:**
- `ContentPage({ page, documents?, children? })` : `body` découpé en paragraphes sur `\n\n` ; `items` en `ul` (ou `ol` si `ordered`) ; `links` en liste de liens (`target="_blank" rel="noopener"` si externe) ; `children` affiché en tête du corps.
- `PracticalInfo()` : adresse, téléphone, horaires, transport, lien Contact.

Contenu (sources : pages WordPress et planning officiels) :
- `qui-sommes-nous` titre « Le GEM Janus34 » : GEM, histoire 2006 (« fondée par des personnes et des proches concernés par des troubles bipolaires »), ce qu'on partage, CA composé d'adhérents, équipe d'animation salariée et intervenants (sans noms), entretien d'accueil et période de visiteur (« une dizaine de venues », adhésion validée par le CA), pas un lieu de soins ; documents institutionnels.
- `activites` : trois familles avec ateliers, « Soutien face à la maladie » (groupes de parole, conférences sur inscription), programme qui évolue, participation non obligatoire, lien planning.
- `nous-rejoindre` titre « Préparer une première visite » : étapes ordonnées appeler → entretien d'accueil avec une animatrice → découvrir comme visiteur → décider librement ; `PracticalInfo` en tête.
- `ressources` : encadré permanent (rendu par la route) « ces informations ne remplacent pas l'avis d'un professionnel de santé » ; repères bipolaires, vidéos, sites (liens repris de l'ancien site, en HTTPS quand le site le permet), sorties culture et sport (Culture et Sport Solidaires 34) ; documents santé.
- `mentions-legales` : éditeur, responsable de publication « la présidence de l'association Janus34 », hébergeur Vercel Inc. (440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis), propriété intellectuelle, limites de responsabilité.
- `confidentialite` : le formulaire n'envoie rien aujourd'hui donc aucune donnée n'est collectée ; journaux techniques de l'hébergeur ; cookies uniquement pour l'administration ; droits RGPD et CNIL.
- Contact : texte du formulaire désactivé « Le formulaire en ligne n'est pas encore ouvert : aucun message ne peut être envoyé depuis cette page. » + horaires.

- [ ] **Step 1: Tests en échec** : `ContentPage` rend listes, liens externes et enfants ; chaque page principale ≥ 4 sections et ≥ 1 200 caractères ; aucune page ne contient une formulation interdite ; disclaimer santé présent via la route `ressources` même si la page Supabase n'a qu'un paragraphe ; mentions légales citent « Vercel Inc. ».
- [ ] **Step 2: `npx vitest run` → FAIL sur ces tests**
- [ ] **Step 3: Implémenter**
- [ ] **Step 4: `npx vitest run` → PASS**
- [ ] **Step 5: Commit** `feat: substantial content for every public page`

### Task 7: Habillage visuel

**Files:**
- Modify: `src/app/globals.css` (partie publique), `src/app/layout.tsx` (police de titres `Source_Serif_4` 600/700 en `--font-display`)

- [ ] **Step 1:** Réécrire les styles publics selon la maquette : en-tête blanc avec logo, premier écran vert avec mot « JANUS » en filigrane et logo incliné, bande d'accès rapides qui chevauche le premier écran, sections éditoriales en deux colonnes ≥ 56rem, cartes réservées aux actualités, bande finale corail foncé. Titres : tailles fixes par point de rupture.
- [ ] **Step 2:** `npm run build` → succès ; captures Playwright 320/768/1440 de chaque page examinées à l'œil.
- [ ] **Step 3: Commit** `style: editorial identity for the public site`

### Task 8: Parcours Playwright

**Files:**
- Modify: `tests/public-site.spec.ts`

- [ ] **Step 1: Tests** : h1 attendus mis à jour ; pas de débordement à 320/768/1440 sur chaque route ; parcours « comprendre le GEM » (accueil → Découvrir Janus34 → h1 « Le GEM Janus34 »), « trouver le planning » (accès rapide → `#planning` visible, lien PDF répond 200), « appeler » (lien `tel:` visible sans ouvrir de menu à 320 px), « préparer une visite » (menu mobile → Première visite → menu fermé, adresse visible) ; aucune formulation interdite sur chaque route.
- [ ] **Step 2: `npm run build && npx playwright test` → PASS**
- [ ] **Step 3: Commit** `test: cover visitor journeys end to end`

### Task 9: Vérification finale et revue

- [ ] `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npx playwright test` : tout au vert, journaux lus.
- [ ] Revue de code de la branche entière (superpowers:requesting-code-review), corrections, puis rapport à l'utilisateur avec les points à faire valider par l'association.

---

## Phase 2 : plus d'images, de chaleur, d'impact et de vie (demande du 16/10/2026)

L'utilisateur a choisi les quatre axes. Seules images disponibles : celles de la médiathèque du site d'origine (peinture « expo » 2013, logo 512 px), le buste de Janus et les logos partenaires.

Constraints : couleurs du logo rouge `#b9282d` et bleu `#2e3675` en accents ; aucune nouvelle dépendance ; animations en CSS seul, sous `prefers-reduced-motion: no-preference` et `@supports (animation-timeline: view())` ; chiffres uniquement tirés des sources.

### Task 10: Images et favicon
- `logo-janus34-favicon.png` (logo complet 512 px) remplace `public/images/janus34-logo.png` ; `favicon-gem-janus34.png` (visages seuls) devient `src/app/icon.png` ; la peinture va dans `public/images/peinture-gem.jpg`.
- Test : le premier écran contient l'image `peinture-gem` avec un texte alternatif descriptif.
- Test : la section « Créer et s'exprimer » de la page Activités porte la peinture.

### Task 11: Chiffres clés et citation
- `KeyFigures()` sur l'accueil après les accès rapides : « 2006 » (création), « Lundi → samedi » (ouverture à 13 h), « 100 % » (Conseil d'Administration composé d'adhérents).
- `Quote()` : « Rompre les solitudes, favoriser l'entraide, la solidarité et le partage entre les membres. », attribuée aux objectifs de l'association.
- Tests : trois chiffres et leurs légendes ; la citation est un `blockquote`.

### Task 12: Chaleur et vie (CSS)
- Pictos lucide par famille d'activités (Palette, Footprints, MessagesCircle), couleur propre à chaque famille.
- Anneaux rouge et bleu en filigrane (rappel des deux visages), soulignement jaune dessiné sous « créer des liens ».
- Apparition au défilement, survol des cartes et des accès rapides.
- Vérification : captures 320/768/1440, Playwright vert.
