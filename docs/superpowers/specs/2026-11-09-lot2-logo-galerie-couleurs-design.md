# Lot 2 : logo, galerie des créations, couleurs du site

Demandes de l'utilisateur du 09/11/2026, choix faits par questionnaire le même jour.

## Logo

Même logo, mais le visage souriant (rouge) passe devant, à droite ; le visage triste (bleu) passe derrière, à gauche. Chaque visage garde sa couleur. Remplacé partout : logo avec texte (en-tête, accueil, planning imprimable), visages de l'admin, icône d'onglet (`favicon.ico`, `icon.svg`, `icon.png`) et icône d'écran d'accueil (`apple-icon.png`). Fait au commit 3795d72.

## Galerie des créations

Note de l'association : « Oui mais sera désactivé dans un premier temps le temps de sélectionner les œuvres ».

- Interrupteur `gallery_enabled` dans Réglages, **désactivé par défaut**. Tant qu'il est coupé : la page `/galerie` répond 404, aucun lien n'y mène, et la base ne donne pas les créations aux visiteurs (RLS).
- Chaque création : photo (JPEG, PNG ou WebP, 4 Mo au plus, signature du fichier vérifiée), titre (obligatoire, 120 caractères), auteur (prénom ou pseudo, facultatif, 80), atelier (facultatif, 80), et la case « L'auteur a donné son accord pour la publication », obligatoire (refusée en base si fausse).
- Admin `/admin/galerie` : ajouter, lister, supprimer (la photo est supprimée du stockage). Ouvert aux éditeurs, gestionnaires et administrateurs, comme les documents.
- Page publique `/galerie` : grille de photos avec titre, auteur et atelier, plus récentes d'abord. Liens quand elle est activée : pied de page (plan du site) et page Activités.
- Stockage : bucket public `gallery`, URL de la photo autorisée par la CSP (`img-src`).

## Couleurs du site

- Dans Réglages (administrateur seulement) : cinq couleurs modifiables, le vert principal, le corail des actions, le jaune des repères, le fond et le texte. Un aperçu en direct (bouton, titre, encadré) et un bouton « Revenir aux couleurs d'origine ».
- Les nuances dérivées (vert foncé, vert pâle, corail foncé, corail pâle, jaune pâle) sont calculées à partir de ces cinq couleurs.
- Lisibilité vérifiée à l'enregistrement : texte sur fond, blanc sur vert et blanc sur corail doivent atteindre un contraste de 4,5:1 (WCAG AA). Sinon l'enregistrement est refusé avec le couple en cause.
- Stockage : colonne `theme` (jsonb, null = couleurs d'origine) de `site_settings`, couleurs au format `#rrggbb` vérifié en base et dans l'action. Le site les applique par une balise `<style>` qui redéfinit les variables CSS de `:root`.
- Non retenu : polices, dépôt d'un logo (choix « couleurs seules »).

## Approches

- Couleurs : variables CSS redéfinies (retenu) plutôt que des feuilles de style par thème, parce que tout le site lit déjà ces variables (`globals.css`).
- Galerie : table et bucket dédiés (retenu) plutôt que de réutiliser les documents, parce que les champs (auteur, atelier, accord) et le type de fichier diffèrent.

## Hors périmètre

Lettre de la semaine, conférences, Facile à lire, bascule DNS.
