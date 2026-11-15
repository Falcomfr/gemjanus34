# Galerie : écrits (texte ou PDF) et filtres - design

Date : 15/11/2026. Demande de l'utilisateur : « qu'on puisse ajouter des textes, PDF, qui seraient affichés, et qu'on puisse filtrer ». Précision : des écrits de l'atelier d'écriture et des poèmes, apportés soit en PDF soit en texte copié-collé ; « prends les cas possibles en compte, go le faire » (pas d'autre question).

## Intention

La galerie montre aujourd'hui les créations visuelles des ateliers (photos). Les écrits de l'atelier d'écriture y ont aussi leur place. Le visiteur doit pouvoir lire un écrit sur la page et ne regarder qu'un type de création ou qu'un atelier.

## Objectifs

- Trois sortes de création : photo (existant), texte collé, PDF.
- Un texte collé s'affiche en entier, retours à la ligne gardés (poèmes).
- Un PDF s'affiche avec le panneau déjà utilisé ailleurs (« Afficher le document », « Ouvrir en grand », « Télécharger »).
- Filtres publics : par type (Tout, Œuvres, Écrits) et par atelier (ateliers présents dans la galerie).
- Même règle d'accord de l'auteur pour toutes les sortes.

## Non-objectifs

- Pas de mise en forme riche dans un texte (gras, titres) : texte brut, lignes gardées.
- Pas de filtre par auteur, pas de recherche plein texte, pas de modification d'une création existante (on la retire et on la remet, comme aujourd'hui).

## Approches envisagées

1. **Colonne `kind` sur `gallery_items` (choisie).** `kind` = image | text | pdf, `body` pour le texte, `image_path`/`image_url` deviennent facultatifs et portent la photo ou le PDF. Rétrocompatible : les lignes existantes prennent `image` par défaut, l'ancien code continue de marcher entre la migration et le déploiement.
2. Renommer `image_*` en `file_*` : plus propre à lire, mais casse le site en ligne entre la migration et le déploiement. Écarté.
3. Table séparée pour les écrits : deux listes à fusionner et trier, deux jeux de policies. Écarté.

## Design

- Migration : `kind` (défaut `image`), `body` (1 à 20 000 caractères), contrainte de cohérence (texte = `body` seul ; photo/PDF = fichier seul), `grant insert (kind, body)`, bucket `gallery` accepte aussi `application/pdf` (4 Mo inchangé).
- Saisie admin : choix « Photo / Texte / PDF » ; le formulaire montre la zone de texte ou le champ fichier qui correspond. Fichier vérifié par sa signature (photo : `imageKind`, PDF : `isPdf`). Taille vérifiée dans le navigateur avant envoi (Vercel coupe à 4,5 Mo).
- Suppression : un texte n'a pas de fichier à effacer.
- Liste admin : vignette pour une photo, icône pour un texte ou un PDF.
- Page publique : filtres en liens (`?type=oeuvres|ecrits&atelier=…`), filtrage côté serveur sur la liste chargée ; le filtre atelier n'apparaît que s'il y a au moins deux ateliers. Les écrits occupent toute la largeur de la grille. Choix de Claude : texte affiché en entier, sans « Lire la suite ».

## Laissé à l'implémentation

Libellés exacts, styles des filtres.
