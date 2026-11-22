# Spec — Pauses de révision (à construire)

Statut : **décisions du PM du 22/11/2026, pas encore implémenté.** Cadre : [LECTURE.md](LECTURE.md) (programme,
maîtrise des items), [HUB.md](HUB.md) (temps de jeu, fin douce), [LECTURE-APP.md](LECTURE-APP.md).

## 1. Intention

Faire réviser la lecture pendant le temps de mini-jeux, sans toucher à l'aventure. Toutes les 5 minutes de mini-jeu,
une courte pause impose un exercice de révision, comme une coupure publicitaire. Bénéfices attendus :
révision espacée par rappel (ancrage), et une mesure de ce que l'enfant **retient** (courbe d'oubli), alors que
l'aventure mesure ce qu'elle **apprend**.

## 2. Règles décidées

1. **Déclenchement** : toutes les 5 minutes de temps actif dans les mini-jeux (coloriage, memory, ranger, labyrinthe,
   robot). La pause attend la fin de l'unité en cours, comme la fin douce (`useSoftEnd`) : jamais au milieu d'un geste.
   Jamais dans l'aventure.
2. **Durée** : courte, 2 à 3 questions, moins d'une minute. Présentée par l'avatar, terminée par une petite fête,
   puis retour au mini-jeu là où il en était.
3. **Contenu, dans cet ordre** :
   1. une question sur un graphème **maîtrisé** (`acquired`, LECTURE.md §5.1), tiré au hasard ;
   2. sinon (démarrage : rien d'acquis), un jeu d'écoute (tambour, commence pareil, finit pareil), qui ne demande
      aucune lettre ;
   3. en bonus, la **première lettre du prénom**, en reconnaissance visuelle seulement (« touche la lettre de
      Chloé »), jamais en son : le son d'une première lettre de prénom est souvent irrégulier (CH, PH…).
   Jamais un contenu que l'aventure n'a pas encore présenté.
4. **Réussite exigée** : une question ratée est reposée.
5. **Après 2 échecs** : repli sur un contenu plus sûr, un tambour ou un autre graphème mieux maîtrisé (meilleure série
   ou meilleur taux de premier coup).
6. **Au 3e échec** : la pause se termine en douceur, retour au jeu, et un signal pour le parent (« pause difficile »,
   avec l'heure). On ne coupe pas la session : ce serait punitif.
7. **Voix indisponible** : pas de pause (aucune consigne n'est écrite) ; les mini-jeux ne sont jamais bloqués.
8. **Aventure indépendante** : les pauses ne font ni avancer ni reculer le parcours de niveaux ; l'aventure fixe
   seulement ce qui peut être révisé.

## 3. Données et statistiques

- Réponses enregistrées à part, marquées « pause » (séparées des séances de l'aventure), pour ne pas fausser la
  maîtrise affichée au parent ni le choix des leurres. À trancher à l'implémentation : un nouveau champ sur
  `ReadingRecord` ou un store dédié (migration IndexedDB et export).
- **Courbe d'oubli** : seule la **première question** de chaque pause compte (tirée au hasard parmi les graphèmes
  maîtrisés). Les questions de repli sont choisies faciles : les compter gonflerait la rétention.
- Mesure : pour chaque graphème, réussite du premier coup en fonction du nombre de jours depuis la dernière réussite.
  Peu de données par lettre au début : afficher d'abord un statut par lettre (« solide » / « fragile ») et une courbe
  globale ; une courbe par lettre quand les données suffisent.
- **Tout reste sur le téléphone** (décision du PM) : la courbe est un miroir de l'enfant, jamais une comparaison à
  d'autres enfants ; aucune collecte, aucune sauvegarde distante. Risque assumé : la perte du téléphone fait perdre
  l'historique (seul l'export JSON manuel protège).

## 4. Questions ouvertes

1. Le prénom comme levier de motivation (« sa lettre à elle »), et donc sa place dans l'aventure (LECTURE.md §14.1).
2. Intervalle fixe de 5 minutes ou adapté à la mémoire de l'enfant, une fois la courbe d'oubli mesurée.
3. Comment encourager à débloquer des niveaux dans l'aventure (lot suivant).
4. Ce qui validerait le dispositif : une semaine avec, une semaine sans ; temps de lecture par jour, taux de premier
   coup, alertes « au hasard », et séances d'aventure lancées spontanément.
