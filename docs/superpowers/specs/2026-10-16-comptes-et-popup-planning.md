# Comptes de l'administration, fenêtre d'activité, logo

Demande du 16/10/2026 après essai en ligne.

## Comptes

- Page `/admin/comptes`, réservée aux administrateurs : liste des comptes (nom, e-mail, rôle, actif, dernière connexion).
- Créer un compte : e-mail, nom affiché, rôle (administrateur ou éditeur). Un mot de passe provisoire est généré et affiché une seule fois à l'administrateur, qui le transmet.
- Modifier un compte : nom, rôle, actif. Réinitialiser son mot de passe (nouveau mot de passe provisoire affiché une fois). Supprimer un compte qui n'a créé aucun contenu ; sinon le désactiver.
- Garde-fous : on ne peut pas se rétrograder, se désactiver ni se supprimer soi-même ; il reste toujours au moins un administrateur actif.
- Page `/admin/mon-compte` pour tous : changer son nom affiché et son mot de passe (mot de passe actuel exigé, 10 caractères au moins).
- Un compte désactivé ne peut plus se connecter : la connexion le refuse avec un message clair.
- Technique : clé secrète Supabase en variable serveur `SUPABASE_SERVICE_ROLE_KEY`, jamais exposée au navigateur, utilisée seulement après vérification du rôle administrateur.
- Hors périmètre : mot de passe oublié par e-mail (il faut un service d'envoi de mails).

## Planning

- Chaque activité du planning (semaine et « Aujourd'hui au GEM ») s'ouvre au clic dans une fenêtre : horaire, jour, animateur, famille, précision, description, lien vers la page Activités et téléphone.
- Nouveau champ « Description » par créneau, modifiable dans l'admin, prérempli par une description générale de l'activité ou par le texte de l'ancien site.
- La version imprimable reste sans fenêtre.

## Logo de l'administration

- La barre latérale affiche les deux visages seuls (le mot « Janus34 » était rogné par le disque).
