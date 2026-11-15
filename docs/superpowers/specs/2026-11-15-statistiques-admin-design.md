# Page Statistiques de l'admin - design

Date : 15/11/2026. Demande : « fais tout ce que tu recommandes, la page stats accessible qu'à l'admin et contiendra toutes ces stats + Cloudflare ». Recommandation validée : A (statistiques tirées des données du site), B (4 compteurs de gestes sans cookie : appel, carte/itinéraire, PDF, HelloAsso), C (chiffres Cloudflare dans l'admin). D (Search Console) se fait hors code après la bascule DNS.

## Intention

Donner à l'administrateur une page qui dit si le site sert (visites, et surtout gestes qui mènent à un contact), ce que l'équipe a reçu et traité, et ce qu'il faut mettre à jour. Public concerné par des troubles psychiques : rien d'individuel, seulement des totaux.

## Objectifs

- `/admin/statistiques`, dans le menu pour le rôle admin seulement ; un autre rôle voit « réservée aux administrateurs » (même modèle que Réglages).
- Visites (Cloudflare, 30 jours) : vues, visites, visites par jour, pages les plus lues, provenances, appareils ; visites exactes des 7 derniers jours. Sans configuration : un encadré dit quelles variables poser.
- Gestes des visiteurs : appels, carte, PDF, HelloAsso, sur 30 jours et 12 mois.
- Messages : par mois sur 12 mois (messages et demandes de rappel), à traiter, délai moyen de traitement.
- Conférences : par conférence, places prises / jauge et taux de remplissage.
- Planning : séances annulées, exceptionnelles et jours de fermeture par mois (12 mois).
- Contenu : pages publiées triées de la plus ancienne mise à jour, celles de plus de 6 mois signalées.
- Équipe : publications et modifications par personne sur 90 jours (journal `audit_log`).
- Galerie : créations par atelier et par type.

## Non-objectifs

Pas de suivi individuel, pas d'adresse IP, pas de cookie, pas de comptage des vidéos, pas d'export, pas de graphique interactif (valeurs écrites en clair).

## Approches

1. **Compteurs par jour en base + page serveur (choisie).** Table `site_events (day, event, count)`, fonction `count_site_event` appelable par les visiteurs, lecture admin seule ; le navigateur envoie un `sendBeacon` vers `/api/stat`, qui appelle la fonction. Les totaux restent exacts et dans la sauvegarde.
2. Événements personnalisés Cloudflare : Web Analytics n'en a pas. Écarté.
3. Une ligne par clic avec horodatage : plus de données que nécessaire, et plus proche d'un suivi. Écarté.

## Design

- Migration : `site_events` (événement limité à phone, map, pdf, helloasso), RLS lecture `is_admin()`, fonction `security definer` qui incrémente le total du jour ; `audit_log` lisible par l'admin ; phrase ajoutée à la page Confidentialité (paragraphe « Navigation sur le site », remplacement ciblé de la phrase existante, sans effet si l'association l'a réécrite).
- `/api/stat` : POST, corps = nom de l'événement, refuse le reste (400), répond 204.
- Traceur client dans la mise en page publique : un écouteur de clic délégué ; `tel:` → phone, lien Google Maps ou bouton « Afficher la carte » → map, lien `.pdf`, ouverture d'un aperçu de document ou bouton d'impression → pdf, lien helloasso.com → helloasso. Rien dans l'admin.
- Cloudflare : version réduite du module de Clos Saint Conti (mêmes pièges : `site_tag` et non le jeton du navigateur, ne jamais multiplier par `sampleInterval`, jours vides complétés, aucun commentaire dans la requête). Variables `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_WEB_ANALYTICS_SITE_TAG`. Pas de cache : page rarement ouverte.
- Calculs dans des fonctions pures testées (`src/lib/admin/site-stats.ts`), la page ne fait que charger et afficher.
- Visuels : chiffres clés et barres horizontales d'une seule couleur avec la valeur écrite, tableaux pour le reste.

## Limites assumées

Les compteurs peuvent être gonflés par quelqu'un qui appelle `/api/stat` à la main : sans enjeu pour des totaux internes. Un clic n'est pas un appel abouti.
