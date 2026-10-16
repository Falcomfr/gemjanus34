# Finitions après recette - Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans.

**Goal:** Corriger tous les défauts relevés par la recette du 16/10/2026 et appliquer les deux décisions de l'utilisateur : modification en direct des contenus en ligne, pages du site modifiables dans l'admin.

**Sources:** rapport de recette (agent QA, commit c44a756), réponses de l'utilisateur du 16/10/2026, spec `docs/superpowers/specs/2026-10-16-admin-documents-messages.md`.

## Constraints

- Aucune perte silencieuse de saisie : toute erreur est visible.
- Le contenu riche saisi dans l'éditeur s'affiche à l'identique sur le site (gras, italique, souligné, couleur de la palette, liens, H2/H3, listes imbriquées, ordre des blocs).
- Les routes fixes gardent leur mise en page ; images et encadré santé restent dans le code.
- Pas de nouvelle dépendance.

## Tasks

1. **Collage coloré** : l'éditeur ramène toute couleur hors palette à « sans couleur » et les liens dangereux sont retirés avant sérialisation ; une erreur de sérialisation restante est affichée et bloque l'enregistrement. Test : coller du rouge garde le texte.
2. **Rendu riche public** : `RichContent` rend le document Tiptap validé ; `ContentPage` découpe aux H2 pour la mise en page éditoriale. Le dépôt Supabase transmet `content` validé. Tests : marques, H3, listes imbriquées, ordre.
3. **Pages du site en base** : migration qui insère les six pages fixes publiées (conversion du seed en Tiptap), surtitre porté par la route, slug des pages fixes verrouillé, slugs réservés refusés (`admin`, `contact`, `actualites`, `documents`, `images`). Images en en-tête de page (Janus, peinture).
4. **Modification en direct** : migration qui autorise l'édition d'une page ou d'une actualité publiée par un éditeur actif et enregistre une révision de page à chaque modification publiée ; formulaires et messages adaptés. pgTAP + e2e.
5. **Admin** : un seul message de résultat pour publier/archiver/restaurer, confirmations, révisions à la seconde, identifiant invalide = 404, 404 dans l'admin, tableaux lisibles sur mobile avec titres cliquables, listes visibles dans l'éditeur, fond de la barre latérale, connexion redirigée si déjà connecté, aide sur le slug.
6. **Public** : titres de page, 404 en français, `aria-current`, téléphone insécable, heure et fin des actualités, archives vides masquées, anneaux à 768 px, résumé vide, liste de documents en tablette, `favicon.ico`, contenu et mise en avant des actualités, pages de la base dans le plan du site et le sitemap.
7. **Vérification** : suites unitaires, SQL, e2e, captures, revue finale indépendante.
