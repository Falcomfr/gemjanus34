# Refonte éditoriale du site public Janus34

## Objectif

Remplacer l'actuelle présentation trop sommaire par un site public qui explique clairement ce qu'est Janus34, montre son identité associative et permet de trouver immédiatement les informations pratiques. La direction visuelle validée est la variante « histoire et identité », enrichie d'accès rapides au planning, à la première visite et au téléphone.

La refonte conserve l'architecture Next.js, Supabase et le mini-CMS existants. Elle porte sur la hiérarchie de l'information, le contenu public, les composants de présentation et la lisibilité responsive.

## Publics prioritaires

1. Une personne concernée par des troubles psychiques qui découvre le GEM et hésite à venir.
2. Un adhérent qui cherche rapidement le planning ou une actualité.
3. Un proche, un partenaire ou un professionnel qui souhaite comprendre le rôle de l'association.

Le langage doit rester accueillant, direct et non médicalisant. Le site explique que le GEM n'est pas un lieu de soins sans réduire Janus34 à cette distinction.

## Direction visuelle validée

- Une identité éditoriale chaleureuse, digne et associative.
- Un vert profond pour l'ancrage, un jaune lumineux pour les repères et un corail réservé aux actions importantes.
- Le nom et le logo Janus34 constituent un signal fort dès le premier écran.
- Les titres utilisent une typographie expressive mais lisible ; les textes courants restent sobres et suffisamment contrastés.
- Les sections sont des bandes pleine largeur ou des compositions ouvertes. Les cartes sont réservées aux actualités et aux éléments répétés.
- Aucun effet décoratif gratuit, dégradé, texte surchargé ou empilement de cartes.
- Le rendu mobile reprend la même hiérarchie, avec des actions pleine largeur et un contenu lisible dès 320 px.

## Accueil

### Premier écran

Le premier écran présente Janus34 comme un Groupe d'Entraide Mutuelle à Montpellier, fondé en 2006 et porté par ses adhérents. Le titre principal est : « Rompre les solitudes, créer des liens ».

Le texte précise que Janus34 accueille des personnes concernées par des troubles psychiques pour se retrouver, s'entraider et participer à des activités. Les deux actions sont :

- « Découvrir Janus34 », vers la présentation de l'association ;
- « Préparer une première visite », vers les modalités d'accueil.

### Accès pratiques

Une bande immédiatement visible après le premier écran donne accès à :

- la consultation du planning et des activités ;
- l'adresse et la préparation d'une visite ;
- l'appel téléphonique au 04 67 04 87 68.

Ces éléments doivent rester utilisables si aucun document de planning n'est actuellement disponible.

### Contenu de la page

L'accueil présente ensuite :

- le fonctionnement collectif du GEM et sa différence avec une structure de soins ;
- trois familles d'activités : créer et s'exprimer, bouger et prendre l'air, échanger et agir ensemble ;
- le planning actuel avec une formulation publique, sans mention technique d'import ou de migration ;
- les actualités récentes avec un lien vers toutes les actualités ;
- un dernier appel à prendre contact ou préparer une visite.

Les actualités anciennes ne doivent pas être décrites comme récentes. Une date et un statut compréhensibles doivent permettre de distinguer les annonces à venir des archives.

## Navigation

La navigation principale est raccourcie et formulée pour les visiteurs :

1. Le GEM
2. Activités
3. Planning et actualités
4. Première visite
5. Ressources
6. Contact

Le bouton visuellement prioritaire est « Première visite » ou « Contact » selon l'espace disponible. Sur mobile, le menu doit être explicite, fermer correctement après navigation et ne jamais masquer les coordonnées essentielles.

## Pages intérieures

### Le GEM

La page explique :

- ce qu'est un Groupe d'Entraide Mutuelle ;
- l'histoire de Janus34 depuis 2006 ;
- l'entraide, le lien social, l'autonomie et la participation des adhérents ;
- le fonctionnement associatif et le Conseil d'Administration composé d'adhérents ;
- le rôle de l'équipe d'animation et des intervenants ;
- la différence entre le GEM et une structure de soins.

Les documents institutionnels disponibles sont présentés à la fin de la page.

### Activités

La page ne se limite plus à deux paragraphes généraux. Elle présente des exemples concrets issus du fonctionnement de Janus34 : expression créatrice, écriture, écoute musicale, activités corporelles douces, groupes d'échange, sorties, rencontres et temps collectifs.

Elle précise que le programme évolue, que certaines activités demandent une inscription et que le planning courant reste la source à consulter.

### Planning et actualités

Le planning actif est la première information. La page sépare clairement :

- les prochains rendez-vous ;
- les informations récentes ;
- les archives.

Les formulations « dernier planning importé » et « archives en attente d'une mise à jour éditoriale » disparaissent de l'interface publique.

### Première visite

La page décrit un parcours rassurant : appeler ou écrire, convenir d'un accueil, découvrir le lieu et le fonctionnement, puis décider librement de revenir ou d'adhérer. Elle affiche l'adresse, le téléphone, les horaires connus, le bus 11 et l'arrêt La Martelle.

Aucune promesse médicale, aucun diagnostic et aucune condition non confirmée ne doivent être ajoutés.

### Ressources

La page explique de façon accessible le rôle des ressources proposées, puis regroupe :

- les repères sur les troubles bipolaires ;
- les conférences et documents d'information ;
- les liens culturels, sportifs et partenaires retenus ;
- les documents téléchargeables.

Un encadré visible rappelle que ces informations ne remplacent pas l'avis d'un professionnel de santé.

### Contact

La page conserve le téléphone, l'adresse et le formulaire. Elle indique clairement qu'une première visite se prépare de préférence en contactant l'équipe. Le formulaire doit expliquer son résultat et ne pas laisser croire qu'un message a été envoyé si le service n'est pas configuré.

### Pages légales

Les mentions légales utilisent les informations vérifiées de l'association et de l'hébergeur. La politique de confidentialité décrit réellement les données du formulaire, leur finalité, leur durée de conservation et les droits des personnes. Les placeholders publics doivent disparaître avant mise en production.

## Structure des contenus

Le modèle `PublicPage` est enrichi uniquement si nécessaire pour prendre en charge des listes, encadrés ou liens d'action. Les contenus restent compatibles avec les pages stockées dans Supabase et le mini-CMS. Une page dynamique existante ne doit pas casser si elle utilise encore des sections de texte simples.

Les informations non confirmées sont formulées prudemment ou omises. Les données stables vérifiées sur le site original sont reprises et réécrites légèrement pour la clarté ; les annonces datées et les noms d'équipe susceptibles d'évoluer ne sont pas figés sans source éditoriale actuelle.

## Accessibilité et responsive

- Contrastes conformes WCAG AA pour les textes et les boutons.
- Corps de texte de 16 px minimum et largeur de lecture limitée.
- Taille des titres stable par point de rupture, sans dépendre directement de la largeur du viewport.
- Focus clavier visible et ordre de tabulation logique.
- Liens et boutons nommés par leur action réelle.
- Aucun chevauchement ni défilement horizontal à 320 px, 768 px et 1440 px.
- Le téléphone, l'adresse et le planning sont accessibles en deux actions maximum depuis n'importe quelle page principale.

## Vérification

- Tests de composants pour les nouvelles sections et les variantes avec ou sans planning.
- Tests de contenu garantissant que chaque page principale contient des informations substantielles.
- Tests Playwright des parcours « comprendre le GEM », « trouver le planning », « appeler » et « préparer une visite ».
- Captures visuelles sur ordinateur et téléphone pour contrôler hiérarchie, contraste, débordements et densité.
- Vérification qu'aucune formulation technique de migration n'apparaît sur le site public.

## Hors périmètre

- Refonte de l'administration ou du modèle d'autorisation.
- Ajout d'un espace adhérent, d'un forum ou d'un paiement en ligne.
- Publication de photos de membres sans contenus fournis et consentements appropriés.
- Invention d'horaires, de tarifs, de conditions d'adhésion ou d'informations médicales non validées.
