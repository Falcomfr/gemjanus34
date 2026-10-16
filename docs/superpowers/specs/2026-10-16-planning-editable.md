# Planning des activités modifiable

## Demande

Le 16/10/2026, l'utilisateur demande de remplacer le planning PDF par un planning géré dans l'admin : rempli à partir du PDF actuel, modifiable, exportable en PDF et soigné.

## Données (semaine type)

- **Paramètres** : date d'entrée en vigueur (22/06/2026 pour le planning actuel), note de bas de planning.
- **Jours** (lundi à samedi) : horaires d'ouverture (« 13 h – 18 h ») et équipe présente (« Mona et Elif », « Adhérent ou animatrice »).
- **Créneaux** : jour, heure de début et de fin, titre, animateur ou animatrice (facultatif), précision (facultatif : « 1 fois par mois », « sur inscription »…), famille (créer, bouger, échanger) pour la couleur.
- Les données initiales reprennent exactement le PDF `Planning-19-06-2026.pdf` (planning à partir du 22/06/2026), y compris les prénoms qu'il publie déjà.
- Lecture publique ; écriture réservée aux éditeurs actifs.

## Site public

- `/actualites#planning` affiche la semaine : une colonne par jour sur grand écran, une liste par jour sur téléphone, jour courant mis en avant, couleurs des trois familles, légende.
- L'accueil affiche « Aujourd'hui au GEM » : horaires du jour et créneaux du jour (ou le prochain jour d'ouverture le dimanche).
- Lien « Version imprimable (PDF) » vers `/planning/imprimer` : une page A4 paysage fidèle à l'affichage, avec un bouton qui ouvre l'impression du navigateur (« Enregistrer en PDF »).
- Si aucun créneau n'existe, l'ancien comportement (PDF du planning ou repli téléphone) reste en place.

## Admin

- Page `/admin/planning` : paramètres, horaires et équipe de chaque jour, créneaux par jour avec ajout, modification et suppression, lien vers la version imprimable.
- Lien dans la barre latérale et sur le tableau de bord.

## Hors périmètre

Exceptions datées (annulation d'un atelier un jour précis : elles passent par les actualités), inscriptions, export iCal.
