# Corrections archivées de TRAME

Retirées du jeu à la demande de son auteur le 4 novembre 2026. Ces constructions sont des témoins de faisabilité, parfois longs, et ne sont pas présentées comme des corrections pédagogiques optimales.

- `content.json` : les 315 niveaux avec leurs étapes de construction et leur ancien nombre de référence (`par`).
- `replay.ts.txt` : ancien lecteur pas à pas, conservé comme source de restauration.
- `highlight.ts.txt` et `replay.css` : surlignage des traits et styles du lecteur.
- `../../scripts/geometric-solutions.mjs` : recettes géométriques de génération, conservées.
- `../../src/solutions.ts` : outils de rejeu et de vérification, conservés hors du chemin de compilation du jeu.

`npm run generate` actualise cette archive et produit les niveaux jouables sans leurs étapes. `npm test` vérifie toujours les témoins archivés. L’archive n’est copiée ni dans `dist/`, ni dans `docs/`, ni dans le fichier autonome. Le jeu continue à valider uniquement la figure finale du joueur.
