# Petits Lecteurs

Apprendre à lire en maternelle, en jouant. PWA installable sur Android (plein écran, hors ligne, sans compte et sans
serveur) : les données restent sur le téléphone.

- **Pour l'enfant** : un hub sans texte. La tuile « carte » mène à l'**aventure de lecture** : 104 niveaux posés sur la
  carte des mondes (forêt, mer, montagne, nuages), de l'écoute des syllabes aux premiers mots, dits par la voix du
  téléphone. Le hub propose aussi cinq mini-jeux libres : coloriage magique, memory, ranger, labyrinthe, robot.
- **Pour le parent** : espace protégé par code, une fiche par enfant (étape de départ en lecture, jeux visibles, palier
  du coloriage), minuteur de session et quota quotidien avec fin douce, écran de verrouillage, statistiques de lecture
  (niveaux gagnés, items acquis, confusions, temps de jeu), export et import JSON.

Cette app est extraite de **Petits Malins** (prototype figé) : une app par thème ou niveau, chacune dans son dépôt. La
base commune (espace parent, stockage, ui, plomberie) est dans `src/socle/` ([README](src/socle/README.md)). Une sauvegarde
exportée de Petits Malins s'importe dans Petits Lecteurs.

## Commandes

```bash
npm install
npm run dev               # serveur de développement
npm test                  # tests unitaires (Vitest)
npm run build             # build de production (dist/) : catalogue, types, vite build
npm run preview           # sert dist/
npm run test:e2e          # parcours complets dans un Chrome mobile simulé (Playwright)
```

Variables : `BASE_PATH` fixe le chemin de base du build (le workflow de déploiement y met `/<nom du dépôt>/`).

## Publication (GitHub Pages)

L'app est publiée à **https://edouardkolf.github.io/petits-lecteurs/** à chaque push sur `main`
(`.github/workflows/deploy.yml` : tests, build avec `BASE_PATH=/petits-lecteurs/`, déploiement).

**Réglage à faire une seule fois** (propriétaire du dépôt) : GitHub → Settings → Pages → Source : **« GitHub Actions »**.

Le site est publié hors du chemin `/educative-app/` de Petits Malins : les deux apps s'installent côte à côte sur Android
(manifeste avec `id: petits-lecteurs`, portée propre). Détails : [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md).

## Installer sur Android

1. Ouvrir l'URL ci-dessus dans **Chrome**.
2. Menu ⋮ → **Installer l'application** (ou « Ajouter à l'écran d'accueil »).
3. Lancer l'app depuis l'icône ; au premier lancement, « Commencer : espace parent » crée le code parent puis les enfants.

## Documentation

| Document | Pour quoi faire |
|---|---|
| [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md) | Publier sur GitHub Pages et installer sur Android |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Stack, structure (dont le socle), données locales, statistiques, ce qui a été retiré |
| [docs/specs/](docs/specs/README.md) | Specs : l'app ([LECTURE-APP.md](docs/specs/LECTURE-APP.md)), le programme de lecture, le hub, le coloriage, la carte des mondes |

## Crédits / licences

- **Andika** – SIL International, [SIL Open Font License 1.1](https://openfontlicense.org/).
- **Fredoka** – Milena Brandão, [SIL Open Font License 1.1](https://openfontlicense.org/).
- **Noto Emoji** (Google) – [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0), images SVG embarquées dans `public/emoji`.
