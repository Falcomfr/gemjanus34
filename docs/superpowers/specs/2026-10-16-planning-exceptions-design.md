# Planning daté : annulations, fermetures, séances exceptionnelles, récurrences

Demande du 16/10/2026 : pouvoir annuler des séances du planning, et améliorer le planning. Design validé en conversation le 16/10/2026 (les cinq propositions retenues, affichage barré ou masqué au choix pour chaque annulation).

## Objectif

Un adhérent qui consulte le planning voit ce qui a vraiment lieu la semaine qui le concerne. L'équipe le tient à jour elle-même depuis l'admin, sans retoucher la semaine type, et les changements disparaissent d'eux-mêmes une fois passés.

## Modèle

La semaine type reste la référence (`planning_days`, `planning_slots`). On ajoute :

- **Récurrence d'un créneau** : `recurrence` vaut `weekly` (chaque semaine, par défaut), `only` (seulement certaines semaines du mois) ou `except` (toutes les semaines sauf certaines). `month_weeks` liste les semaines concernées : 1 à 5 pour le n-ième jour du mois, -1 pour le dernier. Il est vide pour `weekly` et non vide sinon. Une date est en semaine n quand son jour du mois est compris entre 7n-6 et 7n. Elle est la dernière quand il n'y a plus d'autre même jour de la semaine dans le mois.
- **Exceptions datées** (`planning_exceptions`), de trois sortes :
  - `cancel` : un créneau (`slot_id`), une date, un motif facultatif (200 caractères au plus) et `hidden` (barrée par défaut, masquée si vrai). Supprimer le créneau supprime ses annulations.
  - `closure` : le GEM est fermé du `date` au `end_date` inclus, avec un motif.
  - `extra` : une séance unique à une date, avec horaire, titre, animateur, description et famille, comme un créneau.
- Les dates d'annulation et de séance exceptionnelle tombent du lundi au samedi. Le jour d'une annulation est celui de son créneau ; l'admin le vérifie.
- Lecture publique ; écriture réservée aux éditeurs actifs ; grants explicites.

Réglages initiaux : Soupe au caillou le dernier jeudi, GEM « Hors les murs » tous les jeudis sauf le dernier, Collage le 1er samedi. Les précisions devenues redondantes changent seulement si elles n'ont pas été modifiées depuis l'import : Collage perd « Une fois par mois », et Soupe au caillou devient « À la place du GEM « Hors les murs ». Sur inscription. »

## Calcul d'une semaine

Une fonction pure prend le planning, ses exceptions et le lundi de la semaine. Elle rend la semaine datée : pour chaque jour du lundi au samedi, sa date, ses horaires, l'équipe, une fermeture éventuelle avec son motif, et ses séances triées par heure. Chaque séance est normale, annulée (avec son motif) ou exceptionnelle. Elle applique, dans l'ordre :

1. les créneaux du jour dont la récurrence couvre la date ;
2. les séances exceptionnelles de la date ;
3. les annulations : la séance est marquée annulée, ou retirée si elle est masquée ;
4. une fermeture qui couvre la date : le jour est fermé et n'a plus de séances.

Les dates se calculent en jours civils, sans heure, et « aujourd'hui » est le jour à Paris. Le dimanche, la semaine courante est celle qui commence le lendemain.

## Site public

- `/actualites#planning` affiche la semaine courante, avec le titre « Semaine du 19 au 24 octobre 2026 ». Le libellé couvre aussi un changement de mois ou d'année.
- Des liens « Semaine précédente » et « Semaine suivante » passent par `?semaine=AAAA-MM-JJ` (un lundi). La plage va de la semaine courante à 8 semaines plus loin. Une valeur invalide ou hors plage affiche la semaine courante.
- Chaque jour affiche sa date (« Jeudi 23 octobre »). Le jour courant reste mis en avant.
- Une séance annulée et barrée est grisée, barrée, avec « Annulé » et le motif. Une séance masquée n'apparaît pas. Une séance exceptionnelle porte « Exceptionnel ». Un jour fermé affiche « GEM fermé » et le motif.
- La fenêtre d'une activité donne la date réelle, l'annulation et son motif, et la récurrence en clair (« Le dernier jeudi du mois »).
- Aujourd'hui au GEM (accueil) prend le premier jour ouvert et non fermé à partir d'aujourd'hui, dans la semaine courante ou la suivante. Si le GEM est fermé aujourd'hui, la page le dit avec le motif avant d'afficher le prochain jour d'ouverture.
- La version imprimable reprend la semaine demandée (`?semaine=`) avec ses dates. Le lien d'impression du planning garde la semaine affichée.

## Admin (`/admin/planning`)

- Une section « Changements à venir », en tête, liste les exceptions dont la fin est aujourd'hui ou plus tard, dans l'ordre des dates, chacune avec « Supprimer ». On les ajoute avec trois formulaires repliables :
  - **Annuler une séance** : créneau, date, motif, affichage barré ou masqué ;
  - **Fermer le GEM** : du, au (facultatif, un seul jour sinon), motif ;
  - **Ajouter une séance exceptionnelle** : date, début, fin, activité, animée par, famille, description.
- Validation : aucune date passée (pour une fermeture, sa fin), la fin d'une fermeture n'est pas avant son début, la date d'une annulation tombe le jour de son créneau, aucune séance le dimanche. Un message en français s'affiche à côté du champ.
- Chaque créneau reçoit un champ Récurrence : « Chaque semaine », « Seulement… » ou « Toutes les semaines sauf… », avec les cases 1re, 2e, 3e, 4e, 5e et Dernière.
- Le motif est visible sur le site, et le formulaire le dit.

## Hors périmètre

Export iCal, inscriptions, notifications, historique des exceptions passées dans l'admin.
