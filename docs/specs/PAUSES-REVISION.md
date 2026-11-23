# Spec — Pauses de révision

Statut : **implémenté** (décisions du PM du 22/11/2026 ; les décisions d'implémentation sont au §5, à valider par le PM). Cadre : [LECTURE.md](LECTURE.md) (programme,
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

## 5. Décisions d'implémentation

Là où la spec laissait un choix ouvert (à valider par le PM) :

1. **Compteur** : temps actif cumulé dans les 5 mini-jeux (`ActivityId` coloring, memory, order, maze, robot), tenu par
   `SessionProvider` (même boucle de 5 s que le temps de jeu) et **persisté par enfant** dans `AppSettings.pauseMs`
   (jamais exporté) : recharger l'app ou changer de jeu ne le remet pas à zéro. Remis à 0 quand une pause se termine
   (normalement ou au 3e échec) ; il reste dû si la pause est interrompue (retour Android, fin du temps de jeu).
   Logique pure : `src/games/pause/trigger.ts`.
2. **Unité** : le jeu appelle `useReviewPause().checkpoint(resume)` comme `useSoftEnd.checkpoint`. Memory, ranger,
   labyrinthe, robot : au début de la manche suivante (la manche résolue reste affichée dessous) ou au choix de la
   difficulté ; coloriage : juste après une case peinte (jamais pendant la fête de fin de dessin : au choix du dessin
   suivant). Jamais au milieu d'un geste. Le jeu reste monté, son état est conservé, son temps actif (coloriage) est
   arrêté ; la fin douce attend la pause (`busy`), et la pause cède tout de suite si le temps tombe.
3. **Temps** : tant que la pause est ouverte, le temps actif est imputé à `'reading'` (usage) et ne compte pas pour la
   pause suivante.
4. **Voix** : `checkVoice` doit être `ready` (son allumé, voix française) à l'ouverture du jeu, sinon aucune pause.
5. **Présentation** : écran plein par-dessus le jeu (`data-testid="reading-pause"`) ; l'avatar de l'enfant et un livre
   ouvert, la voix dit « C'est l'heure de lire ! » (la toute première pause ajoute « Je te pose deux ou trois
   questions. ») ; 2 à 3 questions avec les vues de l'aventure ; fanfare et confettis ; retour au jeu.
   Consigne : rappel court (§9.10 de LECTURE.md) ; seule une démonstration guidée (jeu jamais montré, `demosDone`
   partagé avec l'aventure) redit la consigne complète.
6. **Contenu** : `planPause` (`src/games/pause/content.ts`). Q1 = un graphème `acquired` tiré au hasard (marquée
   `retention`), Q2 = un autre graphème acquis, sinon un jeu d'écoute ; rien d'acquis : 2 questions d'écoute (tambour,
   commence pareil, finit pareil), de préférence parmi les jeux déjà montrés. Jeux pour un graphème : la lettre qui
   chante, par quoi ça commence (si assez d'images) et quel mot commence par ; les leurres de lettres ne sont que des
   graphèmes déjà présentés ; avec une seule lettre connue : « A ou pas A ? » (A) ou image seulement. Bonus : la
   lettre du prénom (jeu `name-letter`, capitale parmi 2 ou 3, leurres ni ressemblants ni sonores ; accents retirés
   É → E, Ç → C ; sautée si ce n'est pas A-Z). Jamais un son pour cette lettre, ni sur un mauvais choix.
7. **Échecs** : un échec = une mauvaise réponse (choix faux, mauvais nombre de frappes), comptée sur **toute la pause**.
   Une question ratée n'est pas reposée plus tard : l'enfant continue jusqu'à la bonne réponse (réussite exigée). Au
   2e échec, la question en cours est remplacée une seule fois par un repli (un autre graphème acquis au meilleur taux
   de premier coup, meilleur que celui qui vient d'échouer ; sinon un tambour). Au 3e échec : « On retourne jouer ! »,
   retour au jeu, et la séance est marquée `hard: true` (« pause difficile », datée par `endedAt`).
8. **Enregistrement** : une `ReadingRecord` par pause, `context: 'pause'`, sans `levelId`, `stage` = étape en cours,
   `planned` = questions prévues. `ReadingAnswer.retention: true` marque la première question. Champs optionnels :
   export v5 inchangé, import validé (`isReadingRecord`). `computeProgress` ignore les réponses et la clôture d'une pause
   (mais garde ses démonstrations), `levelProgress` aussi ; les statistiques de l'aventure (alertes, confusions) aussi.
9. **Parent** : fiche enfant, sous les jeux libres, « Pauses de lecture » (interrupteur, activé par défaut) et
   intervalle de 3, 5 ou 10 minutes (5 par défaut), dans `gameSettings.pauses` `{ enabled?, intervalMin? }` (validé à
   l'import). Statistiques : bloc « Pauses de lecture » (`reading-stats-pauses`) avec les pauses de la semaine, le taux
   de réussite de la première question (7 jours) et la liste des « pauses difficiles » (`reading-stats-pause-hard`).
10. **Admin** : dans la section cachée des Réglages, « Pauses toutes les 30 s (test) » (`AppSettings.adminPauseTest`,
    pour tout le téléphone, jamais exporté). Un enfant dont les pauses sont éteintes n'en a jamais, même en mode test.

Reste ouvert : la courbe d'oubli elle-même (le marquage `retention` et la date des réponses suffisent à la calculer),
l'intervalle adaptatif (§4.2) et le choix de l'avatar comme annonceur (animation) si le PM veut mieux qu'un rebond.
