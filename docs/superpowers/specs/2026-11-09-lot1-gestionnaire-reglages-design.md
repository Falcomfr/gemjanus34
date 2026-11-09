# Lot 1 : gestionnaire, réglages, sauvegarde et petites fonctions

Demande de l'association (note du 08/11/2026), arbitrée avec l'utilisateur le 09/11/2026 : « fais ce que tu recommandes ».

## Pourquoi

L'association prépare la bascule de gemjanus34.fr vers le nouveau site. Elle veut trois niveaux d'accès, une sauvegarde, et une série de nouveautés dont certaines, marquées (D), doivent pouvoir être coupées à tout moment.

Ce lot pose les fondations (rôles, interrupteurs, sauvegarde) et livre les petites fonctions. Lettre de la semaine, conférences et galerie viendront dans des lots suivants. Le « Facile à lire » attend la réponse de l'association.

## Découpage retenu (approches)

- **Un lot par groupe de fonctions** (retenu) : fondations et petites fonctions d'abord, puisqu'elles ne dépendent d'aucune réponse de l'association.
- Tout en une fois : trop gros pour être relu et déployé sans risque.
- Une fonction à la fois : multiplie les migrations en production et les allers-retours.

## 1. Rôle gestionnaire

Nouvelle valeur `manager` dans l'enum `app_role`, libellée « Gestionnaire ». Trois rôles au total :

| | Éditeur | Gestionnaire | Administrateur |
|---|---|---|---|
| Brouillons de pages et d'actualités, planning, documents, messages | oui | oui | oui |
| Publier une actualité, la modifier en ligne | oui (déjà le cas) | oui | oui |
| Archiver ou restaurer une actualité | non | **oui** | oui |
| Modifier une page en ligne (texte, images, liens) | non | **oui** | oui |
| Republier une page déjà publiée une fois | non | **oui** | oui |
| Lire et restaurer les révisions d'une page | non | **oui** | oui |
| Publier une page jamais publiée (nouvelle page visible) | non | non | oui |
| Adresse, menu, page parente, archivage d'une page | non | non | oui |
| Comptes, réglages | non | non | oui |

Règle : le gestionnaire change le contenu de ce qui existe, l'administrateur change la structure du site. La règle est appliquée en base (fonctions et triggers SQL) et reflétée dans l'interface.

Technique : une fonction `public.is_manager()` (admin ou gestionnaire actif) remplace `is_admin()` là où le tableau dit « oui » au gestionnaire. `publish_page` exige l'administrateur si la page n'a aucune révision publiée. La valeur d'enum est ajoutée dans une migration à part, car Postgres refuse d'utiliser une valeur d'enum dans la transaction qui l'a créée.

## 2. Réglages (administrateur seulement)

Table `public.site_settings` à une seule ligne, lisible par tous, modifiable par l'administrateur :

- `callback_enabled` (défaut **activé**) : formulaire « Rappelez-moi » ;
- `membership_enabled` (défaut désactivé) et `helloasso_url` (vide, doit commencer par `https://www.helloasso.com/`) : bouton d'adhésion et de dons.

Page `/admin/reglages`, absente du menu pour les autres rôles. Chaque lot suivant ajoute ses interrupteurs (conférences, inscriptions, galerie) dans cette table.

## 3. Alerte des nouveaux messages

À chaque message du formulaire de contact ou demande de rappel, un e-mail part vers l'adresse de l'équipe : nom, e-mail ou téléphone, objet, message et lien vers `/admin/messages`. La réponse va directement à l'expéditeur (Reply-To).

Envoi par l'API HTTP de Resend, sans dépendance, comme sur Clos Saint Conti. Trois variables serveur : `RESEND_API_KEY`, `ALERT_FROM_EMAIL`, `CONTACT_ALERT_EMAIL`. Si l'une manque, rien n'est envoyé. Un échec d'envoi ne fait jamais échouer le formulaire, puisque le message est déjà enregistré.

À régler plus tard (réponse de l'utilisateur : « on verra plus tard ») : la vraie adresse de destination (« contact@gmail.org » n'existe pas), et un expéditeur vérifié chez Resend, possible seulement une fois le domaine gemjanus34.fr accessible.

## 4. « Rappelez-moi »

Sur la page Première visite (`/nous-rejoindre`), quand `callback_enabled` est vrai : un formulaire court avec prénom ou nom, téléphone, moment préféré (facultatif, 100 caractères), consentement et piège à robots, comme le formulaire de contact.

Stockage dans `contact_messages` avec une colonne `kind` (`message` ou `callback`) et une colonne `phone`. Pour une demande de rappel, l'e-mail et l'objet sont vides et le message contient le moment préféré. Les contraintes SQL vérifient chaque forme. Dans l'admin Messages, une demande s'affiche « À rappeler » avec un lien d'appel.

## 5. Adhésion et dons

Quand `membership_enabled` est vrai et que l'URL est renseignée : un bouton « Adhérer ou faire un don » apparaît sur `/nous-rejoindre` et dans le pied de page. C'est un lien externe vers HelloAsso.

## 6. Planning dans l'agenda

Flux `/planning.ics` couvrant les 8 semaines à venir, calculé avec `buildWeek`. Il contient les séances normales et exceptionnelles, sans les séances annulées ni les jours de fermeture. Chaque événement a un UID stable (date et créneau), l'heure de Paris, le titre de l'activité, l'adresse du GEM et la description.

Sur la page Planning, « Ajouter le planning à mon agenda » propose deux liens : `webcal://` (agendas du téléphone) et Google Agenda (abonnement par URL). Un abonnement se met à jour tout seul, annulations comprises, avec un délai qui dépend de l'agenda (jusqu'à un jour pour Google).

## 7. Statistiques sans cookie

Cloudflare Web Analytics (sans cookie, gratuit), déjà utilisé par l'utilisateur. Le script n'est chargé que si `NEXT_PUBLIC_CF_ANALYTICS_TOKEN` est défini. La CSP autorise alors `static.cloudflareinsights.com` (script) et `cloudflareinsights.com` (envoi).

Limite assumée : les chiffres sont dans le tableau de bord Cloudflare de l'utilisateur, l'association n'y a pas accès. Une page de statistiques dans l'admin est un ajout possible plus tard.

## 8. Sauvegarde

`scripts/backup.mjs`, adapté de Clos Saint Conti : toutes les tables `public`, les comptes `auth.users` (sans mots de passe) et les PDF du bucket public `documents`. Il passe par l'API Management (jeton projet) et les URL publiques du stockage, sans mot de passe Postgres.

Une GitHub Action quotidienne le lance et garde le résultat 90 jours en artefact du dépôt privé. Secrets attendus : `SUPABASE_ACCESS_TOKEN` et `SUPABASE_PROJECT_REF`. La procédure de restauration figure en tête du script.

## Hors périmètre

Lettre de la semaine, conférences et inscriptions, galerie, Facile à lire, bascule DNS, page de statistiques dans l'admin.
