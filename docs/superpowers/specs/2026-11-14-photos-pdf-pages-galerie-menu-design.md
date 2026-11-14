# Photos et PDF dans les pages, Galerie dans le menu

Demande de l'association relayée le 14/11/2026 : « Peut-être qu'on affichera aussi du texte pdf ou photo ? », puis « fais tout au mieux » et « Galerie : fais le aussi, finalise tout ». L'utilisateur a délégué tous les choix : ceux qui suivent sont les miens.

## Intention

Les rédacteurs doivent pouvoir illustrer une page (ou une actualité) d'une photo et y joindre un PDF lisible sur place, sans passer par la rubrique Documents. Et la Galerie, une fois activée, doit apparaître dans le menu principal juste après « Sorties culturelles et sportives ».

## Objectifs

- Deux nouveaux boutons dans la barre de l'éditeur (pages et actualités, qui partagent l'éditeur) : « Insérer une photo » et « Joindre un PDF ».
- Photo : choix d'un fichier JPEG, PNG ou WebP, description obligatoire (texte lu aux personnes malvoyantes), photo affichée en pleine largeur du texte sur le site.
- PDF : choix d'un fichier PDF (4 Mo au plus), titre proposé d'après le nom du fichier ; sur le site, le titre et le même panneau « Afficher le document » que la rubrique Documents (aperçu, Ouvrir en grand, Télécharger).
- Galerie dans le menu (ordinateur et téléphone) quand l'interrupteur des Réglages est activé, placée juste après la première page ajoutée au menu (aujourd'hui Sorties), ou avant Ressources s'il n'y en a aucune.

## Non-objectifs

- Pas de légende visible, de redimensionnement, d'alignement ni de photos côte à côte : une photo par bloc, pleine largeur.
- Pas de bibliothèque de médias ni de réutilisation d'un fichier déjà envoyé.
- Pas de suppression automatique des fichiers retirés d'une page (voir Limites).

## Anti-objectifs

- Aucune photo étrangère au site ne doit pouvoir s'afficher : une image collée depuis un autre site ou une adresse externe est refusée, à l'enregistrement comme en base.
- Ne pas publier la position GPS d'une photo de téléphone.
- Ne pas casser le contenu existant ni l'enregistrement d'une page sans photo.

## Contraintes

- Le contenu riche est validé deux fois : schéma zod (`rich-content-schema.ts`) et fonction SQL `is_valid_rich_content` (JSON Schema). Les deux doivent accepter le nouveau bloc.
- Requête d'action serveur plafonnée à 5 Mo (Vercel : 4,5 Mo). Fichiers à 4 Mo au plus, comme Documents et Galerie.
- La CSP autorise déjà l'origine du stockage Supabase en `img-src` et `frame-src`.
- Supabase hébergé : chaque migration liste ses droits (policies du bucket).

## Approches

1. **Photo = nouveau bloc `image`, PDF = lien existant rendu en aperçu (retenue).** Le PDF ne demande aucun changement de schéma : c'est un paragraphe qui ne contient qu'un lien vers un PDF du stockage, reconnu au rendu comme le sont déjà les liens YouTube seuls. Seule la photo ajoute un type de bloc.
2. Deux nouveaux blocs `image` et `pdf` : schéma plus lourd des deux côtés pour un PDF qui est déjà un lien.
3. Photos et PDF hors du texte, dans une liste attachée à la page (comme les documents en bas de Ressources) : simple côté schéma, mais la photo ne se place pas où on veut dans le texte, ce qui est le besoin.

## Conception

- **Stockage** : bucket public `page-media` (4 Mo, `image/jpeg`, `image/png`, `image/webp`, `application/pdf`), écriture réservée aux éditeurs actifs (`is_active_editor`, gestionnaires compris), comme `gallery`.
- **Envoi** : action serveur `uploadPageMedia(formData)` : profil exigé, signature du fichier vérifiée (fonctions de Galerie et Documents réutilisées), nom de fichier `photo-<horodatage>.<ext>` ou `<titre-en-slug>-<horodatage>.pdf`, renvoie l'URL publique ou un message d'erreur.
- **Photo réduite dans le navigateur avant l'envoi** : 1600 px de côté au plus, JPEG qualité 0,85, via un canvas. Cela fait tenir les photos de téléphone sous 4 Mo et efface les métadonnées (dont le GPS).
- **Bloc image** : `{ "type": "image", "attrs": { "src", "alt" } }`. `src` doit être une URL publique du bucket `page-media` (`^https?://<hôte>/storage/v1/object/public/page-media/<nom>.(jpg|png|webp)$`), `alt` de 1 à 300 caractères. Accepté partout où un paragraphe l'est (y compris dans une liste). Dans l'éditeur, nœud Tiptap maison (pas de nouvelle dépendance) qui ne reconnaît au collage que ses propres images (`img[data-page-media]`).
- **Rendu** : `<figure class="content-figure"><img src alt loading="lazy"></figure>`. Paragraphe ne contenant qu'un lien vers un `.pdf` du stockage `page-media` : titre du document puis `DocumentPreview`.
- **Galerie dans le menu** : `SiteHeader` reçoit `galleryEnabled` (déjà lu dans `layout.tsx`) ; `NavigationLinks` insère « Galerie » (`/galerie`) après la première page ajoutée. L'aide du formulaire de page le dit.

## Limites assumées

- Un fichier retiré d'une page reste dans le stockage (quelques Mo, inoffensif). Commentaire `shortcut:` à l'endroit de l'envoi ; à traiter si le quota du plan gratuit approche.

## Vérification

- Tests unitaires : schéma (image acceptée, image externe refusée, attributs normalisés), rendu (figure, aperçu PDF, lien PDF externe laissé en lien), validation des fichiers, menu (Galerie placée, absente si coupée).
- Test SQL : `is_valid_rich_content` accepte l'image du bucket et refuse une image externe ; bucket configuré.
- Vérification dans le navigateur en local : insérer une photo et un PDF dans une page, enregistrer, voir la page publique.
