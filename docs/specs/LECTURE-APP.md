# Spec — Petits Lecteurs : l'app de lecture pour la maternelle

Lot du 22/11/2026, mis à jour à l'extraction en dépôt autonome (plus de variantes). Cadre : [README.md](README.md), [HUB.md](HUB.md), [LECTURE.md](LECTURE.md) (le programme de
lecture, inchangé), [CARTE-MONDES.md](CARTE-MONDES.md) (le décor de la carte, réutilisé).

## 1. Décisions du PM

- « Une nouvelle app dédiée à la lecture, uniquement pour la maternelle » : proposition plus claire pour le go to
  market, développement plus simple.
- « Toute la logique de gestion parentale doit rester identique » : code parent, fiches enfant, minuteur et quota,
  fin douce, statistiques, export et import sont **le même code** que Petits Malins.
- « Un hub avec les mini-jeux, et l'aventure se concentre uniquement sur les exercices de lecture. »
- « Un mode admin pour moi, qui me permet de voir tous les niveaux débloqués. »

## 2. Un dépôt, une app

Petits Lecteurs est l'unique app de ce dépôt, extrait de Petits Malins (prototype figé). Stratégie du PM : **une app par
thème ou niveau, chacune dans son dépôt**. Il n'y a plus de variantes de build : pas de `flavor.ts`, pas de `--mode
lecture`, une seule commande par usage.

| | Petits Lecteurs |
|---|---|
| Commandes | `npm run dev`, `npm run build` → `dist/`, `npm test`, `npm run test:e2e` |
| Parcours proposé | `ms` seulement, affiché « Maternelle » au parent (constante, `src/engine/content.ts`) |
| Aventure (tuile carte du hub) | **carte des niveaux de lecture** (§3) |
| Mini-jeux du hub | coloriage, memory, ranger, labyrinthe, robot |
| Base IndexedDB | `petits-lecteurs` (version 5, ne jamais renommer) |
| Publication (GitHub Pages) | `https://edouardkolf.github.io/petits-lecteurs/` (`BASE_PATH=/<repo>/`) |
| Manifeste | nom « Petits Lecteurs », `id: petits-lecteurs`, portée propre : s'installe à côté de Petits Malins (`/educative-app/`) |

- Le format d'export est celui de Petits Malins (v5) : un export de Petits Malins s'importe dans Petits Lecteurs (les
  parties hors lecture sont gardées, simplement pas affichées ; un parcours `ce1` est résolu comme `ms`).
- La base commune (parent, stockage, ui, plomberie de l'app) est sous `src/socle/` (règle : `src/socle/README.md`).
- Mêmes icônes et même charte que Petits Malins pour l'instant.
- **Réglage à faire une fois** par le propriétaire : GitHub → Settings → Pages → Source : « GitHub Actions ».

## 3. L'aventure

- Hub → tuile carte → `#/map` → `ReadingMap` (`src/screens/adventure/`) : les 104 niveaux de `LEVELS`
  (LECTURE.md §16) sur le chemin des mondes (forêt 1-26, mer 27-52, montagne 53-78, nuages 79-104 : 26 niveaux par monde, `LEVELS_PER_WORLD`), chacun en médaillon
  de lecture (couleur de sa piste, lettre ou picto du jeu). L'avatar se pose sur le niveau en cours ; le panneau
  d'arrivée dans un nouveau monde se joue une fois (`profile.seenWorld`).
- Toucher un niveau ouvert → `#/reading/<niveau>` : la séance démarre tout de suite (pas d'accueil du programme).
  Maison de la séance (`to-map`) et coche de fin → retour à la carte (ancre d'historique `map`, sans empiler).
- Un niveau verrouillé tremble ; voix absente ou son coupé : picto `speaker-off` sur la carte, médaillons
  inactifs, badge sur la tuile carte du hub (même vérification que la lecture).
- La lecture n'est pas une tuile de jeu libre : elle est toujours visible (`visibleGameIds`), le parent ne peut pas la
  masquer. Son réglage « Étape de départ » est dans le bloc « Aventure de lecture » de la fiche enfant.

## 4. Espace parent

Même logique que Petits Malins (code, fiches enfant, minuteur et quota, fin douce, écran de verrouillage, export et
import). Adaptations : pas de choix de parcours (un seul, « Maternelle »), et **la page Statistiques d'un enfant ne
montre que la lecture** (`ReadingStats`) : niveaux gagnés sur 104 avec barre et détail par piste (J'écoute, Les lettres,
J'assemble, Je lis), séances terminées et dernière séance, niveau en cours, items acquis, confusions, « à
accompagner », banc d'écoute, une aide de lecture des chiffres, et un petit bloc « Temps de jeu » (Lecture / Mini-jeux,
aujourd'hui et 7 jours). Plus de résumé global, de tableau « Temps par activité », de blocs par mini-jeu ni de carte
de compétences. Le temps du jour reste sur la carte du tableau de bord ; le suivi du temps est inchangé.

## 5. Mode admin

- `AppSettings.adminUnlockAll` (absent = désactivé, propre au téléphone, jamais exporté).
- Caché : onglet Réglages de l'espace parent, **7 tapes sur le nom de l'app** en bas de l'onglet font apparaître le
  bloc « Mode admin ». Il reste visible tant qu'il est actif.
- Effet : tous les niveaux sont ouverts pour tous les enfants du téléphone, — carte de lecture
  (état `open`, contour pointillé) et lancement d'un niveau (`levelState(…, { unlockAll })`). Une clé s'affiche en haut de la carte de lecture tant qu'il est actif.
- Les séances jouées en mode admin sont enregistrées comme les autres : tester avec un profil dédié.
- **Mode test** (bac à sable) : même bloc caché, bouton « Entrer en mode test ». Drapeau `localStorage`
  `petits-lecteurs:sandbox` = `1`, lu au démarrage ; l'app recharge sur une base IndexedDB séparée et vide
  `petits-lecteurs-test` (la vraie base `petits-lecteurs` n'est jamais ouverte) : premier lancement rejoué
  (code parent, premier enfant, démos, bannières). Une pastille « TEST » reste affichée en bas à gauche ; un appui
  long (~1,5 s) ouvre « Recommencer » (supprime la base de test, repart du premier lancement) et « Quitter le mode
  test » (retour aux vraies données et au vrai code), sans code parent. Les mêmes actions sont dans le bloc admin.

## 6. Tests

- Unitaires : registre des jeux (`games/index.test.ts`), route `#/reading/<niveau>` (et `#/reading` → carte) et ancre
  `map` (`socle/app/routes.test.ts`), `unlockAll` (`reading/levels.test.ts`), statistiques de lecture et temps de jeu
  (`reading/stats.test.ts`).
- E2E (un seul projet Playwright, `tests/e2e/`) : `lecture.spec.ts` (hub, niveau joué depuis la carte, espace parent,
  statistiques de lecture seule, mode admin, voix absente), `reading.spec.ts` (programme de lecture), `hub.spec.ts`,
  `parent*.spec.ts`, `session.spec.ts`, `coloring.spec.ts`, `maternelle-games.spec.ts` (memory), `robot.spec.ts`…

## 7. Questions ouvertes

1. Nom, icône et couleurs de l'app (provisoire : « Petits Lecteurs », charte de Petits Malins).
2. Mini-jeux : ceux de maternelle repris de Petits Malins, sans lien avec la lecture. Des mini-jeux de lecture (memory des lettres,
   coloriage par son) renforceraient la proposition.
3. ~~Fin du chemin~~ réglé : 26 niveaux par monde, le 104e niveau est le dernier des nuages et le chemin s'achève au château de nuages.
