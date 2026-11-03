# Vérification de la version 1.1

- TypeScript strict et compilation Vite réussis.
- 323 tests automatiques : les 300 témoins restent légaux et bornés ; relations géométriques, figures complètes, sauvegardes, thèmes, progression et cache hors connexion sont contrôlés.
- 129 niveaux demandent désormais des tracés. Les images de segments et triangles exigent leurs sommets et leurs côtés, avec validation indépendante de la méthode et de l’ordre des constructions.
- Rendu mobile vérifié à 375 × 548 (hauteur utile avec barres du navigateur) : canevas de 365 px, menu entièrement visible et aucun débordement horizontal. Ce sont des dimensions simulées, distinctes d’un essai physique.
- Interface allégée : titre du niveau, graduations, rappels permanents, état de sauvegarde et flèches de pagination retirés de l’affichage de jeu. Le logo ouvre le nouvel écran titre.
- Les cinq thèmes s’appliquent au dessin et à l’interface ; Nocturne, son enregistrement et sa restauration après rechargement ont été vérifiés dans le navigateur.
- Vérification du rendu automatisée : aucun nombre sur les axes, noms des points réponses après réussite uniquement, transparence des traits et mise en évidence des segments finaux.
- Une ancienne sauvegarde sans option de thème a été importée depuis l’interface. Réussites et dessin en cours sont conservés ; les éventuelles réussites avancées restent rejouables sans ouvrir les nouveaux niveaux dont les prérequis manquent.
- La dernière réussite d’un chapitre a été effectuée dans le navigateur : retour automatique au parcours, coche « Terminé », chapitre suivant ouvert, puis accès libre aux quinze niveaux et sélection d’un ancien niveau vérifiés.
- Loupe : les candidats couvrent exactement le rectangle agrandi, sans limite aux huit plus proches ; deux tests de régression couvrent les croisements auparavant omis.
- Zoom par pincement et double tap désactivé ; jeu et écran titre sans défilement, menus avec leur propre défilement. Les contrôles tactiles physiques et VoiceOver restent à vérifier sur appareil réel.
- Les garanties de la version 1.0 restent couvertes : traits de départ actifs, coordonnées rationnelles exactes, points dans le cadre, méthode libre, corrigés réservés aux niveaux réussis et PWA autonome.

Les sauvegardes conservent le format 1. Les nouvelles options sont facultatives dans les fichiers plus anciens. Les anciennes réussites ne sont pas supprimées par l’enrichissement des objectifs de construction.
