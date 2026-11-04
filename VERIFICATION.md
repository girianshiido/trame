# Vérification de la version 1.2.1

- TypeScript strict et compilation Vite réussis.
- 353 tests automatiques : les 315 témoins des 21 chapitres restent légaux et bornés ; relations géométriques, figures complètes, sauvegardes, thèmes, progression et cache hors connexion sont contrôlés.
- Les images de segments et triangles exigent leurs sommets et leurs côtés, avec validation indépendante de la méthode et de l’ordre des constructions.
- Corrigés reconstruits à partir des données géométriques, avec provenance visible de chaque intersection hors grille. Les tests déplacent les points flottants pour vérifier les recettes de milieu, parallèle, perpendiculaire et rapports. Les segments fournis sont réutilisés ; leur support n’est prolongé que si nécessaire.
- Quinze niveaux de tangentes : cercles entièrement dans le cadre, contacts et tangences vérifiés exactement. Les configurations externes et communes fournissent un contact ou une première tangente pour permettre une construction par traits droits sans lecture de coordonnées cachées. Le joueur ne trace aucun cercle.
- Placement des lettres évalué autour des points selon les bords, les autres lettres, les traits et les cercles. Tests de positionnement et contrôle visuel des contacts du chapitre 20.
- Chrono actif, pauses et restauration contrôlés ; minima de temps et d’étapes indépendants, quinze succès et absence de faux records sur les anciens brouillons. Remise à zéro globale testée sur des données de test, avec conservation des préférences.
- Rendu mobile vérifié à 375 × 548 (hauteur utile avec barres du navigateur) : canevas de 365 px, menu entièrement visible et aucun débordement horizontal. Ce sont des dimensions simulées, distinctes d’un essai physique.
- Interface allégée : titre du niveau, graduations, rappels permanents, état de sauvegarde et flèches de pagination retirés de l’affichage de jeu. Le logo ouvre le nouvel écran titre.
- Les six thèmes s’appliquent au dessin et à l’interface ; Boréal a été vérifié dans le navigateur, avec la reprise du niveau, l’effacement du dessin et les records.
- Vérification du rendu automatisée : aucun nombre sur les axes, noms des points réponses après réussite uniquement, transparence des traits et mise en évidence des segments finaux.
- Une ancienne sauvegarde sans option de thème a été importée depuis l’interface. Réussites et dessin en cours sont conservés ; les éventuelles réussites avancées restent rejouables sans ouvrir les nouveaux niveaux dont les prérequis manquent.
- La dernière réussite d’un chapitre a été effectuée dans le navigateur : retour automatique au parcours, coche « Terminé », chapitre suivant ouvert, puis accès libre aux quinze niveaux et sélection d’un ancien niveau vérifiés.
- Loupe : les candidats couvrent exactement le rectangle agrandi, sans limite aux huit plus proches ; deux tests de régression couvrent les croisements auparavant omis.
- Zoom par pincement et double tap désactivé ; jeu et écran titre sans défilement, menus avec leur propre défilement. Les contrôles tactiles physiques et VoiceOver restent à vérifier sur appareil réel.
- Les garanties de la version 1.0 restent couvertes : traits de départ actifs, coordonnées rationnelles exactes, points dans le cadre, méthode libre, corrigés réservés aux niveaux réussis et PWA autonome.

Les sauvegardes conservent le format 1. Les nouvelles options sont facultatives dans les fichiers plus anciens. Les anciennes réussites ne sont pas supprimées par l’enrichissement des objectifs de construction.

Le Grand Atelier reste le chapitre final (21), après les tangentes (20). Les anciens identifiants de ces deux chapitres sont migrés une seule fois, y compris dans les imports : réussites, brouillons, chronos et position courante sont conservés. Le dernier défi combine centre de gravité et tangente.
