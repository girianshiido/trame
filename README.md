# TRAME · L’atelier des géomètres

Jeu français de constructions sur une grille de 8 × 8. **21 chapitres et 315 puzzles**, atelier libre, encyclopédie dessinée, sauvegardes locales et PWA hors connexion.

## Jouer

- Un clic ou appui bref pose un point sur un nœud, un point donné ou une intersection visible.
- Un appui maintenu pose le point de départ ; glisser puis relâcher sur un autre point trace toute la droite, limitée au cadre. Le glissement direct fonctionne aussi.
- Tous les traits de départ sont actifs. Les segments donnés comptent sur leur portion visible ; relier leurs extrémités prolonge leur support jusqu’au cadre.
- Tous les points, y compris les points auxiliaires, restent dans le carré ou sur ses bords.
- La loupe permet de sélectionner les intersections rapprochées. ↗ amorce une droite depuis le point choisi.
- Au clavier : flèches, `[` / `]` pour tous les croisements, Entrée pour poser, Espace pour chaque extrémité d’une droite, Échap pour désélectionner, Ctrl/Cmd + Z pour annuler.

Seule la figure finale est évaluée. Toute méthode exacte convient, avec des traits auxiliaires libres. Aucun corrigé ne peut être ouvert avant la réussite du niveau. Les rappels restent généraux. Après réussite, une construction alternative peut être rejouée.

## Interface et apparence

Sur téléphone, la grille occupe presque toute la largeur, avec adaptation à la hauteur réellement disponible sous les barres du navigateur. Seuls la consigne, un en-tête compact, annuler/rétablir, la précision et le menu inférieur restent visibles pendant le jeu. Aucun nombre n’est dessiné sur les axes. Le zoom par pincement et double tap est désactivé. Le jeu et le titre ne défilent pas ; les menus défilent indépendamment. Le logo TRAME revient à l’écran titre, qui propose de commencer ou continuer.

Six thèmes sont disponibles et mémorisés : Aurore, Lagon, Nocturne, Citrus, Papier et Boréal. Les traits auxiliaires sont translucides. Une fois la construction juste, les noms des points réponses et les segments finaux apparaissent. Dans les transformations de figures, les sommets images seuls ne suffisent pas : il faut aussi tracer les côtés demandés.

## Parcours

1. Premiers traits
2. Les milieux
3. Parallèles
4. Parallélogrammes
5. Perpendiculaires
6. Médiatrices
7. Symétrie centrale
8. Symétrie axiale
9. Translations
10. Les médianes
11. Premiers équilibres : masses égales, segments et fils uniformes
12. Thalès et rapports
13. Homothéties
14. Quarts de tour
15. Partager un chemin
16. Partager les aires
17. Centres de surfaces : triangles, plaques composées et concaves
18. Points remarquables
19. Perspectives
20. Le grand atelier : Varignon, masses pondérées, Pappus
21. Tangentes aux cercles : contacts donnés, deuxième tangente à retrouver et tangentes communes

Le chapitre des tangentes fournit les cercles et les contacts utiles : aucun cercle auxiliaire ne se trace. Les points restent ceux des nœuds et des croisements de traits droits. Les cas avancés donnent un premier contact ou une première tangente pour faire construire les autres sans donnée cachée.

Les séries reviennent sur les concepts dans d’autres orientations, puis avec des configurations réduites et décalées du quadrillage. Les chapitres 11 et 17 suivent une progression propre, des masses simples aux fils composés et des triangles aux plaques à encoches. Les niveaux se débloquent un par un. Terminer les quinze niveaux ouvre le chapitre suivant et ramène au parcours, où le chapitre reçoit la mention « Terminé ». Les quinze niveaux d’un chapitre terminé restent librement rejouables. Les réussites enregistrées avant cette règle restent conservées et rejouables.

## Chronos, étapes, records et succès

Le temps actif commence à l’affichage du niveau ; les menus, le titre et l’arrière-plan le mettent en pause. Une création de point ou de droite est une étape, y compris après rétablissement. Annuler ne rembourse pas les étapes. Le point de départ provisoire d’un glissement ne crée pas une étape supplémentaire : un tracé de droite reste une construction. Les minima de temps et d’étapes sont indépendants. Les anciens brouillons non chronométrés restent jouables mais nécessitent un redémarrage pour établir un record complet. Quinze succès couvrent la progression, les temps, les étapes, les essais sans annulation et le chapitre des tangentes.

Le bouton ⟳ efface les constructions du niveau sans perdre les réussites ou records ; l’effacement est annulable. Les réglages proposent aussi une remise à zéro globale avec confirmation et export préalable facultatif. Les préférences de couleurs et de son sont conservées.

## Corrigés géométriques

Les corrigés sont produits par des recettes qui dépendent des données de la figure. Les points hors grille proviennent de deux traits visibles dont les références sont enregistrées et surlignées à la lecture. Les tests déplacent les données d’entrée pour vérifier que les milieux, parallèles et perpendiculaires suivent la configuration. Les centres de carreaux et déplacements directement lisibles sont conservés dans les cas simples ; des variantes avancées utilisent des positions moins lisibles. Les segments donnés sont réutilisés ; un prolongement n’est ajouté que pour atteindre une intersection extérieure à leur portion visible. Une correction est un chemin possible, pas nécessairement le plus court.

## Développer et construire

Node.js 22.12+ (ou 24+) et npm.

```sh
npm ci
npm run dev
npm run generate
npm test
npm run build
```

`generate` régénère les 315 niveaux et leurs témoins de construction. Les calculs utilisent des coordonnées homogènes entières (`BigInt`) : égalité, incidence et validation sont exactes. Les flottants servent seulement à dessiner et à choisir le candidat proche du doigt. Le moteur est indépendant du navigateur.

La compilation produit `dist/` et `release/TRAME.html`. Ce dernier est autonome : ouvrir le fichier sans serveur permet de jouer, avec les limites de stockage propres aux navigateurs sur les fichiers locaux. Le mode installable complet utilise le site HTTPS.

## Publication GitHub Pages

```sh
npm run build
node scripts/pages.mjs
git add .
git commit -m "Update TRAME"
git push origin main
```

Configurer Pages pour servir `main:/docs`. Les chemins sont relatifs et fonctionnent dans un sous-répertoire. Le service worker précache tous les fichiers de jeu après une visite connectée ; une mise à jour attend l’action du joueur dans les réglages. Aucun changement de cache n’efface les sauvegardes.

## Sauvegardes et confidentialité

Format versionné `trame-save-v1`, copie de récupération et export/import JSON. Un import fusionne les réussites sans supprimer les anciennes. Les sons synthétisés, coupés par défaut, n’utilisent aucune ressource distante. Aucun serveur de jeu, compte de jeu ou suivi statistique.

## Vérification

Les tests rejouent tous les témoins : chaque point doit être accessible au moment de sa création et chaque extrémité reste dans le cadre. Ils contrôlent aussi les relations géométriques, les centres de masse des fils et plaques, les partages de chemins, l’acceptation de constructions différentes et les sauvegardes.

Les essais de petits écrans dans le navigateur sont des simulations de format, distinctes d’un essai sur iPhone physique.
