# Vidéos, carte et aperçu des PDF

Demande du 16/10/2026 : afficher les vidéos et les contenus affichables au lieu de simples liens, une carte Google Maps, et un aperçu des PDF.

## Vidéos

- Dans une page ou une actualité, un paragraphe qui ne contient qu'un lien YouTube (`youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/`, `youtube.com/embed/`) ou Vimeo (`vimeo.com/<numéro>`) devient un lecteur. Un lien au milieu d'une phrase reste un lien.
- Lecteur au clic : vignette (YouTube) ou fond uni (Vimeo), titre = texte du lien, bouton « Lire la vidéo ». Rien n'est chargé chez YouTube ou Vimeo avant le clic, hormis la vignette YouTube (image sans cookie). Au clic, le lecteur se charge en lecture automatique, YouTube par `youtube-nocookie.com`, Vimeo avec `dnt=1`.
- Sous le bouton, une phrase : la vidéo est hébergée par YouTube (ou Vimeo), la lancer charge leur service. Un lien « Voir sur YouTube » reste disponible.

## Carte

- Page Contact : une carte Google Maps de l'adresse, chargée au clic (« Afficher la carte »), avec le lien « Ouvrir dans Google Maps ».

## PDF

- Chaque document de la liste est un volet fermé. Ouvert, il affiche le PDF dans la page, avec « Ouvrir en grand » (nouvel onglet) et « Télécharger ». Le PDF n'est chargé qu'à l'ouverture.
- Sur téléphone, les navigateurs n'affichent pas un PDF intégré de façon fiable : l'aperçu est masqué sous 48 rem et le volet propose seulement les deux boutons.

## Sécurité et confidentialité

- CSP : `frame-src` autorise le site, `www.youtube-nocookie.com`, `player.vimeo.com`, `www.google.com` et le stockage Supabase ; `img-src` autorise `i.ytimg.com`. `frame-ancestors 'self'` et `X-Frame-Options: SAMEORIGIN` pour que le site puisse afficher ses propres PDF.
- La politique de confidentialité reçoit une section « Vidéos et carte » (migration qui ne l'ajoute que si elle n'y est pas déjà).

## Hors périmètre

Contenu local de secours (sans Supabase) : ses liens restent des liens. Autres services intégrables (Dailymotion, PeerTube).
