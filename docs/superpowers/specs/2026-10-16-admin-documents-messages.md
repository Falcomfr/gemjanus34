# Documents, messages et finitions de l'administration

## Contexte

Retour de l'utilisateur le 16/10/2026 après essai de l'admin locale : les rubriques Documents et Messages renvoient vers des pages inexistantes, les accès rapides du tableau de bord ne sont pas cliquables, rien ne permet de revenir au site, et un mauvais mot de passe efface l'adresse e-mail saisie. Il a choisi de construire Documents et Messages plutôt que de les retirer.

## Documents

- Une table `documents` (titre, description, catégorie parmi planning, institutionnel, santé, activité, date du document, adresse du fichier, chemin de stockage éventuel, auteur).
- Les dix PDF actuellement fournis avec le site sont inscrits dans la table par la migration, avec leur adresse `/documents/...`. La base devient la seule source quand Supabase est configuré ; sans Supabase, le contenu embarqué reste utilisé.
- Les nouveaux PDF sont téléversés dans un compartiment de stockage public `documents`. Seuls les profils actifs (éditeur ou administrateur) peuvent écrire ou supprimer ; tout le monde peut lire.
- Page `/admin/documents` : liste par catégorie, téléversement (titre, description, catégorie, date, fichier PDF de 4 Mo au plus), suppression avec confirmation. Remplacer le planning = téléverser le nouveau ; le site affiche automatiquement le plus récent par date du document.
- Les pages publiques revalidées après chaque changement.

## Messages

- Une table `contact_messages` (nom, e-mail, objet, message, date, traité le, traité par). Un visiteur anonyme peut seulement insérer ; seuls les profils actifs lisent, marquent comme traité et suppriment.
- Le formulaire de contact public s'active : validation existante (`contactSchema`, champ piège, consentement). Il n'affiche « Message envoyé » qu'après l'enregistrement réussi ; en cas d'échec ou sans Supabase, il le dit et renvoie vers le téléphone.
- Page `/admin/messages` : messages les plus récents d'abord, nouveaux mis en évidence, lecture du message, lien « Répondre par e-mail », « Marquer comme traité », « Supprimer ».
- La politique de confidentialité décrit les données du formulaire, leur usage (répondre), qui y accède (l'équipe) et leur durée : supprimés après traitement et au plus tard au bout de 3 ans (règle reprise de l'ancienne politique de l'association).
- Pas d'envoi d'e-mail de notification (aucun service d'envoi configuré) : le tableau de bord affiche le nombre de nouveaux messages.

## Finitions

- La connexion conserve l'adresse e-mail après une erreur ; les formulaires Pages et Actualités conservent la saisie après une erreur de validation.
- Lien « Voir le site » dans la barre latérale ; tableau de bord en français avec de vrais liens vers chaque rubrique et les compteurs utiles.
- Aucun lien mort dans l'admin.

## Hors périmètre

Envoi d'e-mails, anti-spam au-delà du champ piège, modification des métadonnées d'un document existant (on supprime puis on téléverse).
