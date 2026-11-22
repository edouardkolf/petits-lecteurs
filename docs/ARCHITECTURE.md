# Architecture — Petits Lecteurs

PWA de lecture pour la maternelle (« J'apprends à lire »), installée sur un téléphone Android partagé par plusieurs
enfants. Ce document est la référence pour les humains et pour les agents : en cas de doute, il fait foi.

Ce dépôt est extrait de **Petits Malins** (prototype figé : maternelle et CE1, carte de compétences). Stratégie : une app
par thème ou niveau, chacune dans son dépôt ; la base commune (parent, stockage, ui, plomberie) est dans `src/socle/`.
Ce qui a été retiré à l'extraction est listé au §11.

## 1. Stack et raisons

| Choix | Pourquoi | Ce que ça engage pour la suite |
|---|---|---|
| **Vite + TypeScript strict** | Build rapide, typage qui attrape les erreurs avant le téléphone. | `npm run build` produit un dossier `dist/` statique. |
| **Preact** (API React, 4 ko) | Composants lisibles, écosystème React, très léger. | Tout développeur ou agent qui connaît React s'y retrouve. |
| **vite-plugin-pwa** (Workbox) | Manifest + service worker générés : installable, plein écran, hors ligne. | Nouvelle version recherchée au lancement puis toutes les heures, installée au retour sur l'écran des profils, jamais pendant une partie. |
| **IndexedDB via `idb`** | Stockage local durable, requêtable ; `idb` = 1 ko autour de l'API native. | Données liées au navigateur du téléphone : **l'export JSON est la sauvegarde**. |
| **Navigation par hash** (`#/map`) | Marche sur GitHub Pages sans configuration serveur, gère le bouton retour Android. | Compatible Capacitor tel quel. |
| **Sons synthétisés (Web Audio)** | Aucun fichier audio, aucune licence, fonctionne hors ligne. | Les consignes vocales (V2) utiliseront de vrais fichiers via le champ `audio`. |
| **Emoji natifs** pour les objets illustrés | Zéro poids, rendu Android homogène. | Rendu différent sur iPhone ; remplaçables par des SVG via `src/socle/ui/objects.ts`. |
| **Vitest + Playwright** | Tests unitaires de la logique ; tests de bout en bout sur un viewport Pixel 7. | La CI GitHub lance les tests unitaires et le build ; Playwright tourne en local. |

**Passage à Capacitor/APK plus tard :** `npm run build` avec `BASE_PATH=./`, puis `npx cap add android`.
Aucune réécriture. Seule attention : les données d'une PWA et d'un APK sont dans deux stockages différents,
donc il faut les migrer par export puis import.

## 2. Arborescence

```
src/
  main.tsx                   ← point d'entrée (PWA : enregistrement du service worker, mise à jour différée)
  app/                       ← propre à l'app : App.tsx, AppShell.tsx (écrans selon la route), appInfo.ts (nom)
  socle/                     ← base commune, réutilisable par les prochaines apps (règle et exceptions : socle/README.md)
    app/                     ← routes par hash, minuteur de session (SessionProvider, session.ts), profil actif, mises à jour
    parent/                  ← espace parent : code, fiches enfant, statistiques de lecture, réglages, export/import
    storage/                 ← IndexedDB : profils, parties, parties de jeu, réglages ; export/import
    ui/                      ← composants partagés : émojis, icônes, sons, voix, palette, avatars
  engine/                    ← types des mécaniques, hasard déterministe (rng), parcours unique « ms » (content.ts)
  mechanics/<mécanique>/     ← mini-jeux du hub : memory, order (ranger), maze (labyrinthe), robot ; plus les pièces
                               réutilisées par le coloriage (color-mix/parts, count/generate, builder/figures)
  games/                     ← registre des jeux (index.ts), fin douce partagée (useSoftEnd), horloge active
    reading/                 ← « J'apprends à lire » : parcours de 104 niveaux (levels.ts), 8 jeux, logique pure, séance, stats
    coloring/                ← coloriage magique : catalogue de dessins, récipient, paliers, écran
    puzzle/                  ← écran générique des mini-jeux à manches illimitées (memory, ranger, labyrinthe, robot)
  screens/                   ← écrans enfant : profils, hub, écran de fin ; adventure/ReadingMap (la carte d'aventure) ;
                               map/ (décor et mondes : forêt, mer, montagne, nuages) ; hub/
  styles/                    ← polices et styles globaux
tests/e2e/                   ← parcours de bout en bout (Playwright) ; nav.ts et reading-helpers.ts = aides communes
docs/                        ← architecture, déploiement ; docs/specs/ = specs de l'app et des jeux
```

## 3. Parcours de l'utilisateur

```
Premier lancement → Espace parent : création du code → ajout des enfants
Écran profils (avatars) ──tap──▶ Hub (sans texte) ──▶ Carte d'aventure ──tap niveau──▶ Séance de lecture (5 ou 8 questions)
       ▲  appui long 2 s                  │   ▲                        │ maison = retour à la carte (séance abandonnée)
       │  sur le cadenas                  │   └── maison ◀─────────────┘ (carte → hub)
       └── Espace parent (code) ◀         └──▶ Mini-jeux : coloriage, memory, ranger, labyrinthe, robot ─ maison → hub
Fin de séance : fête, coche → carte (niveau gagné à 4 sur 5, ou 6 sur 8 ; le suivant s'ouvre)
Minuteur ou quota atteint → Écran de fin (bloquant, même après rechargement) → code parent → +5/+15 min → hub
```

- Le **hub** montre l'avatar (retour aux profils), la tuile de la carte d'aventure et une tuile par mini-jeu visible
  pour l'enfant (par défaut tous ; réglable dans la fiche enfant). La lecture n'est jamais une tuile de jeu libre.
- **Maison = remonter l'historique** jusqu'au hub (`returnTo('hub')`, `src/socle/app/routes.ts`) au lieu d'empiler une
  entrée : le bouton retour Android ne rouvre jamais une partie ou un jeu restés dessous.
- L'**espace parent** ne s'ouvre que depuis l'écran profils (appui long sur le cadenas) ou depuis l'écran de fin.
- Les **mini-jeux** sont illimités : ni cadenas, ni vies, ni étoiles. Seul le temps de la séance les borne.
  Spécifications : `docs/specs/` (README.md = cadre et arbitrages, HUB.md, LECTURE.md, LECTURE-APP.md, COLORIAGE.md…).
- `#/reading/<niveau>` lance la séance d'un niveau ; `#/reading` sans niveau redirige vers la carte.

## 4. Parcours et niveaux

- **Un seul parcours**, `ms`, affiché « Maternelle » : une constante dans `src/engine/content.ts` (plus de dossier
  `content/`). `Profile.trackId` reste stocké (`'ms'` pour les nouvelles fiches) ; un parcours inconnu (sauvegarde importée
  de Petits Malins, par ex. `ce1`) est toléré et résolu comme `ms`.
- Les **niveaux** sont ceux de la lecture : `LEVELS` (`src/games/reading/levels.ts`), 104 niveaux construits par code à
  partir du programme (`curriculum.ts`), posés sur la carte des mondes. Pas de contenu JSON.
- `npm run validate:catalog` (lancé par `npm run build`) vérifie le catalogue des dessins du coloriage.

## 5. Mini-jeux et mécaniques

Les mini-jeux du hub (memory, ranger, labyrinthe, robot) sont des **mécaniques** (`src/mechanics/<id>/`) jouées par
l'écran générique `src/games/puzzle/PuzzleScreen.tsx` : une mécanique ne connaît ni le stockage ni les sons, elle génère
des manches (`Round = { data, answer }`) et les affiche ; chaque élément tapable porte `data-choice="<id>"`, le
conteneur de manche porte `data-answer` (utile aux tests e2e). Contrat à plusieurs coups : `docs/specs/JEUX-LOGIQUE.md` §2.

## 6. Données locales (IndexedDB « petits-lecteurs »)

| Store | Clé | Contenu |
|---|---|---|
| `profiles` | `id` | prénom, avatar, parcours, limites (session, jour) ; optionnels : jeux libres visibles (`games`), réglages de jeu (`gameSettings`) |
| `runs` | `id` (index `profileId`, `[profileId, levelId]`) | une partie : début, fin, statut, raison d'arrêt, rejeu, manches, étoiles |
| `overrides` | `[profileId, levelId]` | niveau forcé débloqué ou verrouillé par le parent |
| `usage` | `[profileId, day]` | secondes de jeu actives par jour, minutes bonus accordées ; secondes par activité (`activitySeconds` : hub, carte, dictée, coloriage) |
| `settings` | `"app"` | empreinte du code parent, son, session en cours de chaque enfant, écran de fin actif |
| `dictations` | `id` (index `profileId`) | une dictée : série, graine du tirage, mots prévus, un item par mot validé (saisie, juste du premier coup, réécoutes, durées) |
| `colorings` | `id` (index `profileId`) | une séance sur un dessin : dessin, palier, couleurs et légende figées, essais de peinture ; `resumedFrom` relie la reprise d'un dessin à la séance précédente |
| `readings` | `id` (index `profileId`) | une séance de lecture : étape, questions prévues, item nouveau, démonstrations vues, une ligne par première tentative (jeu, cible, juste, choix faux, relance) |

- **Nom de la base : `petits-lecteurs`** (`DB_NAME`, `src/socle/storage/db.ts`) — ne jamais le changer : ce sont les données des
  utilisateurs. **Version 5** (`DB_VERSION`), export v5 (`EXPORT_VERSION`) : inchangés depuis Petits Malins, tous les
  stores sont conservés (`runs`, `overrides`, `dictations`, `tictactoes`, `hangmans`… servent à l'import d'une sauvegarde
  de Petits Malins ; leurs parties ne sont simplement jamais affichées).
- Historique : base en **version 2** (`src/socle/storage/db.ts`) : la montée v1 → v2 crée les deux stores de jeu, vides ; rien n'est migré.
- Les parties de jeu partagent un socle (`GameRecordBase`, `src/socle/storage/game-records.ts`) : même statut et même raison
  d'arrêt que les parties de niveaux (sans `out-of-lives`), plus `activeMs`. **Une partie close ne se rouvre jamais** :
  reprendre un dessin crée une nouvelle partie liée. Au lancement, `closeStaleGameRecords` clôt les parties restées en
  cours (`completed` si tout était joué, sinon `time-up` ou `closed`), comme `closeStaleRuns`.
- **Export v2** : ajoute `dictations` et `colorings`. L'import accepte les sauvegardes v1 (sans parties de jeu) et v2.
- **IndexedDB v3 / export v3** : stores `tictactoes` et `hangmans` (morpion, pendu). L'import accepte v1, v2 et v3.
- **IndexedDB v4 / export v4** : store `puzzles`, partagé par les jeux libres de logique (devine le nombre, code
  secret, robot ; docs/specs/JEUX-LOGIQUE.md §4). L'import accepte v1 à v4.
- **IndexedDB v5 / export v5** : store `readings` (« J'apprends à lire », docs/specs/LECTURE.md §7), créé par
  `if (oldVersion < 5)`. L'import accepte v1 à v5 (`readings` absent avant v5 = vide). Réglage parent :
  `gameSettings.reading = { startStage? }`.

### Le jeu `reading`

- **Logique pure dans `src/games/reading/`**, sans React ni stockage : `curriculum.ts` (graphèmes, syllabes, mots à
  lire, items par étape), `pictures.ts` (images Noto), `speech.ts` (textes dits, banc d'écoute), `progress.ts`
  (`computeProgress`), `session.ts` (`planSession`, déterministe pour une graine), `flow.ts` (file de questions,
  démonstrations, questions reposées), `stats.ts`. Contrat de types : `types.ts`.
- **Écran** : `ReadingScreen` (accueil → séance → fête), `ReadingSession` + `useQuestionFlow` (voix, relance, enregistrement,
  fin douce), `views/` (une vue par jeu, qui n'affiche que : pas de voix, pas de stockage ; `data-choice` sur chaque
  cible). Parent : `ReadingStats`, `ReadingSettings`, `VoiceBench`.
- **La progression n'est jamais stockée** : `computeProgress(listReadings(profileId), settings)` la rejoue à chaque ouverture.
- **Parcours** : `levels.ts` (`LEVELS`, `levelProgress`, barre 4 sur 5) et `planLevel` dans `session.ts` ; une séance
  porte `levelId`. `planSession` (séances mêlées d'avant le parcours) n'est plus appelé par l'écran.
- Tests e2e : `tests/e2e/reading.spec.ts` (fausse voix et lecteur de séance dans `reading-helpers.ts`).

La progression (niveaux gagnés, étape, items acquis) est **recalculée à partir des séances** : aucune donnée dupliquée qui pourrait diverger.
De même, le palier du coloriage se déduit des parties de jeu.
Au démarrage, l'app appelle `navigator.storage.persist()`. Le résultat (persistant oui/non) s'affiche dans l'espace parent.

## 7. Statistiques : définitions

La page Statistiques d'un enfant (`src/socle/parent/ChildStats.tsx`) ne montre **que la progression en lecture**
(`ReadingStats`, `docs/specs/LECTURE.md` §8.3) :

| Indicateur | Définition exacte |
|---|---|
| **Niveaux gagnés sur 104** | Niveaux atteignant la barre (4 bonnes réponses du premier coup sur 5, 6 sur 8) ou tenus pour acquis par le réglage « Étape de départ ». Par piste : J'écoute, Les lettres, J'assemble, Je lis. |
| **Niveau en cours** | Premier niveau non gagné de la carte. |
| **Séances terminées / dernière séance** | Séances `completed` (gagnées ou non) ; date de la dernière. |
| **Items acquis** | Lettre ou syllabe réussie du premier coup 3 fois de suite sur 2 jours différents. |
| **Confusions, « à accompagner »** | Demandé → choisi les plus fréquents ; jeux où l'enfant répond à peu près au hasard. |
| **Temps de jeu** | Temps actif compté par l'horloge de session (celui des limites), aujourd'hui et sur 7 jours : « Lecture » (carte d'aventure et séances) et « Mini-jeux » (coloriage, memory, ranger, labyrinthe, robot). Le hub n'est pas montré. `src/games/reading/stats.ts`, `summarizeReadingTime`. |

Le suivi du temps (minuteur, quota, `UsageDay.activitySeconds`) n'a pas changé ; le temps du jour reste sur la carte du
tableau de bord. Les parties des mini-jeux sont toujours enregistrées (`puzzles`, `colorings`) mais ne sont pas affichées.

## 8. Contrôle parental

- **Code parent** : 4 chiffres, stocké haché (SHA-256 avec sel). Si le code est oublié, une multiplication d'adulte (ex. 17 × 23) permet de le réinitialiser.
- **Accès** : appui long de 2 s sur le cadenas de l'écran profils, puis saisie du code. Un tap bref ne fait rien.
  Il n'y a pas de cadenas sur le hub ni sur la carte : l'espace parent ne s'ouvre que depuis l'écran profils (ou l'écran de fin).
- **Minuteur de session** (par enfant, en minutes) : compte le temps actif (app visible, profil sélectionné, hub, carte,
  séance de lecture ou mini-jeu). Chaque enfant a sa propre session. Elle reprend s'il revient dans les 10 minutes, donc passer par
  le profil de sa sœur ne remet pas le compteur à zéro.
  Sur le hub et la carte, l'échéance affiche l'écran de fin tout de suite. En séance ou en jeu, c'est une **fin douce** :
  l'unité en cours se termine (une question, une manche, une case de coloriage ; 60 s maximum), puis l'écran de fin
  s'affiche et la partie passe en `time-up`. Les jeux utilisent le hook partagé `useSoftEnd` (`src/games/useSoftEnd.ts`).
- **Quota quotidien** (par enfant) : même mécanisme, cumulé sur la journée locale.
- **Écran de fin** : visuel calme (lune, sans texte), persisté (`settings.lock`). Ni un rechargement, ni le bouton retour Android, ni la navigation directe ne le contournent.
  Après le code parent, le parent choisit : +5 min, +15 min (minutes bonus du jour), qui ramènent au hub, ou retour aux profils.
- **Mini-jeux** : la fiche enfant choisit les jeux visibles sur le hub, le palier du coloriage et l'étape de départ de la
  lecture. La lecture a besoin de la voix du téléphone : si elle manque, la fiche enfant le signale avec le remède.
- **Mode admin** (caché, 7 tapes sur le nom de l'app dans Réglages) : ouvre tous les niveaux de la carte.
- **Hors périmètre** : empêcher de quitter l'app. C'est l'épinglage d'écran Android qui s'en charge.

## 9. Règles UX pour l'enfant non lectrice

- Aucun texte nécessaire dans les écrans communs (profils, hub, carte, fin) ni dans les mini-jeux : pictos, couleurs,
  animations. Les textes de l'espace parent sont en français. Les séances de lecture affichent des lettres, des syllabes
  et des mots courts, et passent par la voix du téléphone (consignes dites, jamais écrites).
- Cibles tactiles : ≥ 72 px pour les choix de jeu, ≥ 56 px pour la navigation. Tap d'abord ; le glisser est une
  alternative (coloriage : chaque case a un disque tapable de 72 px, le glisser depuis le récipient n'est qu'un autre geste).
- Erreur douce : son doux, léger tremblement, le choix se grise, on réessaie. Aucun compte à rebours visible, aucune récompense aléatoire.
- Sons obligatoires : réussite, erreur douce, étoile gagnée.
- Éléments interactifs qui attirent l'œil : la case à compléter pulse, les choix sont grands et contrastés.
- Pas de zoom, pas de sélection de texte, pas de menu contextuel, pas de tirer-pour-rafraîchir.

## 10. Conventions

- Identifiants de code en anglais ; textes affichés au parent et documentation en français.
- Logique pure (engine, générateurs de mécaniques, logique des jeux) couverte par des tests Vitest (`*.test.ts` à côté du code).
- Les fichiers marqués `CONTRAT` sont la frontière entre modules. On les modifie volontairement, jamais en passant.
- Vérifications avant de livrer : `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`.

## 11. Ce qui a été retiré de Petits Malins

À l'extraction (ce dépôt = l'app de lecture seule) :

- **CE1** : contenu, parcours, jeux dictée, morpion, pendu, devine le nombre, code secret et les mécaniques de calcul,
  comparaison, orthographe, lecture CE1.
- **Carte de compétences** de Petits Malins (`SagaMap`, `LevelPlayer`, fin de niveau, vies, étoiles, déblocage par
  niveau) et les niveaux MS de compétence (`content/`), avec leurs mécaniques propres (suite, compter, intrus, labo des
  couleurs, trieur, constructeur). Le décor de la carte (`src/screens/map/`) est conservé : il sert `ReadingMap`.
- **Statistiques parent** : plus de carte du parcours, de résumé global, de tableau par activité ni de bloc par mini-jeu.
- **Laissé pour plus tard** : schéma IndexedDB et export inchangés (stores et types des jeux retirés, `runs`,
  `overrides`) ; types de contenu de `engine/types.ts` ; fonctions `generateRounds` de `color-mix` et `count` (seules
  `generate`/`parts` servent au coloriage) ; dépendances du socle vers le code de l'app (`src/socle/README.md`).
