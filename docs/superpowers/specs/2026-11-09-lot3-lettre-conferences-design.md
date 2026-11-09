# Lot 3 : lettre de la semaine et conférences

Note de l'association du 08/11/2026, choix de l'utilisateur du 09/11/2026 (questionnaire).

## Lettre de la semaine

« Un "Quoi de neuf" imprimable et envoyable aux adhérents qui le souhaitent. » Choix : page et PDF, l'équipe l'envoie elle-même (aucune liste d'adresses).

- Page publique `/lettre` (paramètre `?semaine=AAAA-MM-JJ` comme le planning), mise en page A4 portrait à l'impression, bouton « Imprimer ou enregistrer en PDF ».
- Contenu, dans l'ordre :
  - en-tête (logo, adresse, téléphone) et « Quoi de neuf au GEM, semaine du … au … » ;
  - le mot de l'équipe, s'il est rempli ;
  - les changements de la semaine : jours de fermeture, séances annulées (avec motif), séances exceptionnelles ;
  - le planning de la semaine, jour par jour (horaires et activités, sans les séances annulées) ;
  - les rendez-vous à venir (actualités des 4 semaines suivantes) ;
  - les conférences à venir, si la page Conférences est activée.
- Admin `/admin/lettre` (éditeurs, gestionnaires, administrateurs) : le mot de l'équipe (1 500 caractères au plus), un lien vers la lettre de la semaine et un bouton « Envoyer par e-mail » (lien `mailto:` avec objet et lien de la lettre, que l'équipe complète avec ses destinataires).
- Lien vers la lettre depuis la page Planning et actualités.
- Stockage : table `weekly_letter` à une ligne (`note`, `updated_at`, `updated_by`), lisible par tous, modifiable par l'équipe.

## Conférences

« Page Conférences : le programme du cycle 2026-2027 et l'inscription. Oui (D), en attente. » « Prévoir que toutes les fonctionnalités (D), notamment les inscriptions, puissent être désactivées. » Choix : inscription avec nom et téléphone ou e-mail.

- Deux interrupteurs dans Réglages, coupés par défaut : `conferences_enabled` (la page et ses liens) et `registrations_enabled` (le formulaire d'inscription).
- Conférence : titre (160), intervenant (120, facultatif), date et heure, lieu (160, par défaut l'adresse du GEM), description (2 000, facultative), nombre de places (facultatif : sans limite si vide).
- Page publique `/conferences` (404 si coupée) : conférences à venir puis passées du cycle, chacune avec date, intervenant, lieu, description et places restantes. Formulaire d'inscription sous chaque conférence à venir quand les inscriptions sont ouvertes et qu'il reste de la place : nom (2-100), téléphone ou e-mail (5-254), nombre de places (1 à 4), consentement, piège à robots.
- Inscription par la fonction SQL `register_for_conference` (security definer) : refuse si la page ou les inscriptions sont coupées, si la conférence est passée, ou s'il ne reste pas assez de places. La ligne de la conférence est verrouillée pendant le calcul, pour que deux inscriptions simultanées ne dépassent pas la jauge. Les visiteurs ne lisent jamais les inscriptions ; ils voient seulement les places restantes (fonction `conference_seats_taken`).
- Admin `/admin/conferences` (équipe) : ajouter, supprimer une conférence (ses inscriptions partent avec elle), voir les inscrits (nom, contact, places, date) et en retirer un. Une conférence passée depuis plus de 3 mois est signalée « à supprimer ».
- Liens quand la page est activée : pied de page, page Planning et actualités, lettre de la semaine.
- Confidentialité : section « Inscriptions aux conférences » (nom, contact, nombre de places ; vus par l'équipe seulement ; supprimés avec la conférence, au plus tard 3 mois après), ajoutée par migration seulement si le texte de la page est celui du lot 1.

## Approches

- Conférences : tables dédiées plutôt qu'un type d'actualité, parce que la jauge, les inscriptions et l'interrupteur propre ne rentrent pas dans le modèle des actualités.
- Jauge : contrôlée en base par une fonction qui verrouille la conférence, plutôt que dans l'action Next, seule façon d'empêcher un dépassement entre deux requêtes.
- Lettre : page générée à partir du planning et des actualités existants, plus un seul texte libre, plutôt qu'un éditeur de lettre complet.

## Hors périmètre

Envoi automatique de la lettre, alerte mail des inscriptions, modification d'une conférence existante (la supprimer et la recréer), Facile à lire.
