# Relais Claude - Refonte publique Gem Janus34

## Demande utilisateur

Reprendre en profondeur le site public. La version actuelle est trop vide, trop générique, parfois difficile à lire et ne reprend pas assez les informations utiles du site WordPress original. Les actions principales de l'accueil doivent être repensées et toutes les pages principales doivent contenir un contenu substantiel.

## Décision visuelle validée

L'utilisateur a choisi la direction **C : histoire et identité**, puis validé sa version retravaillée.

Principes retenus :

- identité associative forte et chaleureuse ;
- grand premier écran vert avec Janus34 et la promesse « Rompre les solitudes, créer des liens » ;
- logo réellement intégré à la composition ;
- accès immédiats sous le premier écran : planning, première visite, téléphone/adresse ;
- jaune lumineux pour les repères, corail pour les actions importantes ;
- mise en page éditoriale, sans accumulation de cartes ;
- version mobile aussi claire et priorisée que la version desktop.

La spécification complète est dans :

`docs/superpowers/specs/2026-10-16-public-site-content-redesign.md`

La maquette HTML validée est conservée dans le dossier ignoré par Git :

`.superpowers/brainstorm/1991118-1792150795/content/homepage-editorial-v2.html`

Le compagnon visuel peut être relancé avec le skill Superpowers brainstorming si nécessaire. Ne pas traiter cette maquette comme du code de production ; elle sert de référence de hiérarchie et d'ambiance.

## Diagnostic principal

La page actuelle expose du vocabulaire technique au public :

- « Dernier planning importé » ;
- « ancien site » ;
- « archive » ;
- « en attente d'une mise à jour éditoriale ».

Ces formulations doivent disparaître. Le public doit voir le planning, les activités et les actualités, pas l'état de la migration.

Le contenu de `src/content/seed.ts` est beaucoup trop court :

- `qui-sommes-nous` : trois sections d'une phrase ;
- `activites` : deux sections générales ;
- `ressources` : deux avertissements, presque aucun contenu utile ;
- `mentions-legales` et `confidentialite` : placeholders publics ;
- l'accueil ne donne pas une compréhension suffisamment précise du GEM.

Le composant générique `src/components/content/content-page.tsx` ne sait afficher que des titres et paragraphes. Il faudra probablement enrichir le modèle de contenu de façon rétrocompatible ou créer quelques compositions dédiées aux pages principales.

## Informations vérifiées sur le site original

Site source : `https://www.gemjanus34.fr/`

- Janus34 est une association loi 1901 et un Groupe d'Entraide Mutuelle fondé en 2006.
- Le projet vise à rompre les solitudes et favoriser l'entraide, la solidarité et le partage.
- Les adhérents sont des personnes concernées par des troubles psychiques.
- Le Conseil d'Administration est composé d'adhérents.
- Un GEM est un lieu de lien social et d'entraide, distinct d'une structure de soins.
- Adresse actuelle affichée : 405 rue des Grèzes, Montpellier.
- Téléphone : 04 67 04 87 68.
- Transport indiqué : bus 11, arrêt La Martelle.
- Le site original demande de contacter l'équipe avant une première visite.
- Exemples d'activités trouvés dans le planning : expression créatrice, remue-méninges, écriture, écoute musicale, Qi Gong/remise en forme, yoga doux, linogravure, groupes d'échange, sorties et temps collectifs.

Attention : les noms de salariés, horaires précis, tarifs et annonces datées peuvent évoluer. Ne pas les figer sans source éditoriale actuelle.

## Fichiers à examiner en premier

- `src/app/page.tsx`
- `src/components/home/hero.tsx`
- `src/components/home/current-planning.tsx`
- `src/components/home/upcoming-news.tsx`
- `src/components/home/visit-panel.tsx`
- `src/components/content/content-page.tsx`
- `src/content/seed.ts`
- `src/content/types.ts`
- `src/content/navigation.ts`
- `src/app/globals.css`
- `tests/public-site.spec.ts`
- `src/app/__tests__/home-page.test.tsx`
- `src/app/__tests__/content-routes.test.tsx`

## Travail recommandé

1. Lire la spécification et produire un plan d'implémentation Superpowers.
2. Mettre à jour les tests avant le code selon TDD.
3. Refaire la hiérarchie de l'accueil et supprimer tout vocabulaire de migration.
4. Enrichir les contenus publics à partir des informations vérifiées du site original.
5. Créer des présentations adaptées pour Le GEM, Activités, Première visite et Ressources.
6. Remplacer les placeholders légaux uniquement avec des informations vérifiées ; signaler à l'utilisateur ce qui nécessite encore validation.
7. Contrôler les pages à 320 px, 768 px et 1440 px avec Playwright.
8. Lancer `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` et les tests Playwright.
9. Faire une revue de code avant déploiement.

## Contraintes importantes

- Ne pas refaire WordPress ni transformer le mini-CMS en constructeur de pages libre.
- Préserver la compatibilité Supabase et les pages dynamiques existantes.
- Ne pas inventer d'informations associatives ou médicales.
- Ne pas publier de fausses photos de membres. Utiliser les ressources officielles fournies ou demander les visuels à l'association.
- Ne pas exposer de secret Supabase ou Vercel.
- Le dépôt est privé : `Falcomfr/gemjanus34`.
- Déploiement actuel : `https://gemjanus34-ten.vercel.app`.

## État au moment du relais

Aucun code de production n'a encore été modifié pour cette nouvelle refonte. Seuls la spécification et ce document de relais ont été ajoutés. La branche peut donc être reprise proprement avec un cycle plan, TDD, implémentation et vérification.
