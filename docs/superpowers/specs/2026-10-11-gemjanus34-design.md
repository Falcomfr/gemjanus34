# Refonte Gem Janus34 - Spécification fonctionnelle et technique

## Objectif

Remplacer complètement le site WordPress existant par un site public moderne et un mini-CMS sur mesure, simples à utiliser par une équipe de quatre à cinq personnes. Le projet doit préserver les contenus utiles, les documents et les anciennes adresses importantes, tout en supprimant la complexité et les doublons hérités de WordPress.

Le dépôt de code sera privé sur GitHub. L'application sera déployée sur Vercel et utilisera Supabase pour l'authentification, la base de données et le stockage des fichiers.

## Publics et besoins

### Visiteurs

- Comprendre rapidement ce qu'est Janus34 et à qui s'adresse l'association.
- Trouver les horaires, l'adresse, le téléphone et les modalités d'accueil.
- Consulter le planning, les actualités et les événements.
- Découvrir les activités, les objectifs et les partenaires.
- Consulter ou télécharger les ressources et documents publics.
- Contacter l'association sans exposer directement ses adresses aux robots.
- Utiliser confortablement le site sur téléphone, tablette ou ordinateur.

### Équipe éditoriale

- Se connecter avec un compte personnel.
- Modifier les textes sans connaître HTML.
- Créer, organiser, prévisualiser et publier des pages.
- Téléverser, télécharger, remplacer et archiver des documents.
- Mettre à jour rapidement le planning et les annonces.
- Retrouver l'auteur et la date d'une modification.
- Restaurer une version antérieure en cas d'erreur.

## Architecture de l'information

Le menu public sera volontairement court :

1. Accueil
2. Qui sommes-nous ?
3. Activités
4. Planning et actualités
5. Nous rejoindre
6. Ressources
7. Contact

Les documents institutionnels, partenaires, mentions légales et politique de confidentialité seront accessibles depuis les pages concernées et le pied de page.

### Accueil

- Présentation courte de Janus34.
- Prochaine information importante.
- Planning actuel avec bouton de consultation et téléchargement.
- Prochains événements ou activités.
- Coordonnées et appel à rejoindre l'association.

### Qui sommes-nous ?

- Présentation du Groupe d'Entraide Mutuelle.
- Histoire et fonctionnement de Janus34.
- Objectifs : rompre l'isolement, entraide, autonomie et insertion.
- Équipe, gouvernance et partenaires.
- Documents institutionnels : statuts, règlement intérieur, règles de vie et rapports d'activité.

### Activités

- Soutien face aux troubles psychiques.
- Créativité, expression et réflexion.
- Mobilisation corporelle.
- Sorties culturelles et sportives.
- Informations pratiques sur la participation.

### Planning et actualités

- Planning en cours mis en avant.
- Liste chronologique d'annonces courtes.
- Événements et conférences à venir.
- Archives consultables sans encombrer la page principale.

### Nous rejoindre

- Déroulement du premier accueil.
- Modalités d'adhésion.
- Horaires et téléphone.
- Adresse, carte et transports en commun.

### Ressources

- Présentation accessible du trouble bipolaire.
- Documents d'information téléchargeables.
- Vidéos et liens externes sélectionnés.
- Message clair indiquant que le GEM n'est pas une structure de soins.

### Contact

- Coordonnées directes.
- Formulaire avec nom, adresse e-mail, objet, message et consentement.
- Protection anti-spam invisible ou légère.
- Message de confirmation sans divulguer d'information sensible.

## Mini-CMS

L'administration sera disponible sous `/admin` et ne cherchera pas à reproduire WordPress.

### Tableau de bord

- Accès direct aux pages, actualités, documents et messages.
- Affichage des contenus récemment modifiés.
- Signalement des brouillons et éléments archivés.

### Éditeur de contenu

- Titre, résumé, corps et image principale.
- Gras, italique, souligné, listes, liens, couleurs limitées et tailles prédéfinies.
- Insertion d'images et de documents depuis la médiathèque.
- Blocs contrôlés : texte, image, document, boutons et encadré d'information.
- Aperçu avant publication.
- États brouillon, publié et archivé.
- Ordre des pages et navigation modifiables sans permettre de casser la mise en page générale.

### Médiathèque documentaire

- Formats initiaux : PDF, DOC, DOCX, ODT, JPG, PNG et WebP.
- Vidéos désactivées au lancement ; les vidéos externes sont intégrées par lien.
- Métadonnées : titre, description, catégorie, date, visibilité et fichier.
- Téléchargement du fichier original pour modification hors ligne.
- Remplacement d'un fichier en conservant son lien public stable.
- Archivage sans suppression immédiate.
- Recherche et filtres par catégorie, type et état.
- Limite de taille configurable, fixée initialement à 25 Mo par fichier.

### Liens documentaires

- Les fichiers publics disposent d'une URL stable sur `lien.gemjanus34.fr`.
- Une URL stable pointe vers la version active du fichier et reste valide après remplacement.
- Les documents existants sont publics par défaut, conformément au fonctionnement actuel.
- Le modèle de données prévoit une visibilité privée, sans construire un espace adhérent complet au lancement.

## Comptes et autorisations

Chaque membre de l'équipe dispose de son propre compte Supabase Auth.

### Administrateur

- Gère les comptes et les rôles.
- Modifie la structure, le menu et toutes les pages.
- Publie, archive et restaure les contenus.
- Gère les documents et consulte les messages.

### Éditeur

- Crée et modifie pages, actualités et documents.
- Enregistre des brouillons et publie les contenus autorisés.
- Ne gère ni les comptes, ni les paramètres techniques, ni la suppression définitive.

Toutes les autorisations seront appliquées côté serveur et dans les règles Row Level Security de Supabase, pas uniquement dans l'interface.

## Historique et sauvegardes

- Chaque publication crée une révision avec auteur, date et contenu précédent.
- Un administrateur peut restaurer une révision.
- Les suppressions éditoriales utilisent d'abord un archivage récupérable.
- Les sauvegardes automatiques Supabase disponibles sur l'offre retenue sont activées.
- Un export programmé de la base et un inventaire des fichiers sont conservés hors de la base principale.
- La procédure de restauration est documentée et testée avant la mise en production.

## Notifications

- Le formulaire de contact envoie un e-mail à l'adresse configurée et stocke le message dans l'administration.
- Une notification de publication peut être envoyée aux administrateurs.
- Les simples sauvegardes de brouillon ne déclenchent pas d'e-mail.
- Les préférences de notification sont configurables par utilisateur.

## Modèle de données

### `profiles`

Profil lié à Supabase Auth : nom affiché, rôle, état et préférences de notification.

### `pages`

Page éditoriale : titre, slug stable, résumé, contenu structuré, état, position de navigation, parent éventuel, auteur et dates.

### `page_revisions`

Copie immuable d'une version publiée ou restaurée, liée à la page et à son auteur.

### `news`

Annonce ou événement : titre, contenu, dates de début et fin, état et mise en avant.

### `documents`

Document logique : titre, slug stable, description, catégorie, visibilité, version active, état et métadonnées.

### `document_versions`

Versions physiques : chemin Supabase Storage, nom original, type MIME, taille, auteur et date.

### `contact_messages`

Message reçu : coordonnées, objet, contenu, consentement, état de traitement, date et informations minimales de lutte contre les abus.

### `audit_log`

Journal append-only des actions sensibles : publication, restauration, remplacement de fichier, changement de rôle et archivage.

## Architecture technique

- Next.js avec App Router et TypeScript strict.
- React Server Components pour les pages publiques et actions serveur pour les mutations.
- Tailwind CSS pour le système visuel, avec composants accessibles et cohérents.
- Tiptap pour l'éditeur riche, configuré avec un ensemble d'outils limité.
- Supabase PostgreSQL, Auth et Storage.
- Politiques RLS et bucket privé ; les documents publics sont servis par une route contrôlée utilisant leur slug stable.
- Vercel pour les déploiements de prévisualisation et de production.
- Resend pour les e-mails transactionnels, sous réserve de validation du domaine.
- Vitest et Testing Library pour les tests unitaires et de composants.
- Playwright pour les parcours critiques sur bureau et mobile.

## Sécurité et confidentialité

- Aucune clé de service Supabase n'est exposée au navigateur.
- Cookies d'authentification sécurisés, `httpOnly` et `sameSite` approprié.
- Validation des entrées côté serveur avec Zod.
- Vérification du type MIME, de l'extension et de la taille des fichiers.
- Limitation du débit du formulaire et champ leurre anti-spam ; ajout de Turnstile seulement si nécessaire.
- Messages de contact réservés aux utilisateurs autorisés.
- Collecte minimale de données et politique de conservation documentée.
- En-têtes de sécurité, journalisation des actions sensibles et dépendances maintenues.

## Migration

- Import des contenus réellement utiles depuis les 37 pages WordPress recensées.
- Import des documents et images encore pertinents, après contrôle des doublons et des versions périmées.
- Réécriture légère des textes pour corriger les erreurs et harmoniser la présentation, sans modifier le fond associatif.
- Table de redirections permanentes pour les anciennes URL importantes.
- Conservation de l'ancien site pendant la recette, puis bascule DNS vers Vercel.
- Aucune donnée ou configuration de l'ancien WordPress n'est détruite pendant la migration.

## Direction visuelle et accessibilité

- Identité chaleureuse, digne et rassurante, sans codes médicaux froids ni effets décoratifs gratuits.
- Palette équilibrée inspirée du logo existant, avec contrastes conformes WCAG AA.
- Typographie lisible, tailles stables et espaces généreux sans devenir une page marketing.
- Navigation courte, appels à l'action explicites et coordonnées faciles à trouver.
- Mise en page mobile prioritaire, clavier complet, focus visible et prise en charge de la réduction des animations.
- Les contenus importants restent lisibles sans JavaScript côté client.

## Hors périmètre initial

- Réseau social ou forum entre adhérents.
- Espace membre complet avec documents personnels.
- Paiement ou adhésion en ligne.
- Hébergement et transcodage de vidéos lourdes.
- Liberté totale de construction de pages ou installation d'extensions tierces.
- Application mobile native.

## Critères d'acceptation

- Le visiteur trouve adresse, téléphone, planning et modalités d'accueil en moins de deux actions depuis l'accueil.
- Le site est utilisable à 320 px de large sans défilement horizontal ni chevauchement.
- Un éditeur peut mettre à jour le planning et publier une annonce sans aide technique.
- Un document peut être remplacé sans changer son URL publique.
- Les rôles empêchent réellement un éditeur de gérer les comptes ou les paramètres.
- Chaque publication et remplacement de document apparaît dans l'historique.
- Une restauration de page et une restauration de sauvegarde sont démontrées avant lancement.
- Les anciennes URL prioritaires redirigent vers leur nouvel équivalent.
- Les parcours publics et administratifs critiques disposent de tests automatisés.

