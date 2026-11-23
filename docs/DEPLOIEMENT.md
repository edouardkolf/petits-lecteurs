# Mettre l'app en ligne et l'installer sur Android

Durée : environ 15 minutes la première fois. Ensuite, chaque modification poussée sur `main` est publiée toute seule.

## 1. Point bloquant à trancher : le dépôt est privé

GitHub Pages n'est **gratuit que pour les dépôts publics**. Pour un dépôt privé, il faut un compte GitHub Pro
(environ 4 $/mois). Même dans ce cas, le **site publié reste public** : toute personne qui connaît l'URL peut l'ouvrir.

| Option | Coût | Ce qui devient visible |
|---|---|---|
| **A. Rendre le dépôt public** (recommandé) | Gratuit | Le code et le contenu pédagogique. Aucune donnée des enfants : elles ne quittent jamais le téléphone. |
| B. Garder le dépôt privé + GitHub Pro | ~4 $/mois | Seulement le site (public de toute façon). |

Option A : *Settings → General → Danger Zone → Change repository visibility → Public*.
Avant de rendre public : le dépôt ne contient ni prénom, ni photo, ni secret. Garde cette règle pour la suite.

## 2. Créer la branche `main`

La publication se déclenche sur `main` (branche par défaut). Fusionner la branche de travail dans `main` (pull request).

## 3. Activer GitHub Pages

1. **Settings → Pages → Build and deployment → Source : GitHub Actions**.
2. Onglet **Actions → Deploy → Run workflow** (branche `main`). Ou n'importe quel push sur `main`.
3. Attendre la coche verte (2 à 3 minutes). L'URL s'affiche dans le job `deploy` :
   **https://edouardkolf.github.io/petits-lecteurs/**

Le workflow (`.github/workflows/deploy.yml`) lance les tests puis le build (`BASE_PATH=/petits-lecteurs/`) **avant**
de publier. Un test ou un build en échec bloque la publication : la version en ligne reste la précédente, qui fonctionne.
Petits Lecteurs est publié sous `/petits-lecteurs/`, hors de la portée de Petits Malins (`/educative-app/`) : les deux
apps s'installent côte à côte sur le même téléphone.

## 4. Installer sur le téléphone Android

1. Ouvrir l'URL dans **Chrome** (pas dans le navigateur intégré d'une autre app).
2. Menu **⋮ → Installer l'application** (selon la version : *Ajouter à l'écran d'accueil → Installer*).
3. Lancer l'app depuis l'icône : elle s'ouvre en plein écran, sans barre d'adresse.
4. Premier lancement : démo en quatre écrans (« Passer » pour la sauter), création du code parent, fiche du premier enfant, test de la voix, puis passage du téléphone à l'enfant. Les autres enfants s'ajoutent ensuite depuis l'espace parent.
5. Dans l'espace parent, vérifier **« Stockage protégé ✓ »**. Si ce n'est pas le cas, relancer l'app depuis l'icône installée.
6. Test hors ligne : mode avion, fermer puis rouvrir l'app. Elle doit fonctionner normalement.

## 5. Épingler l'app (empêcher l'enfant d'en sortir)

Géré par Android, pas par l'app :
1. **Paramètres → Sécurité et confidentialité → Plus de paramètres de sécurité → Épinglage d'application** : activer,
   ainsi que « Demander le code avant de retirer l'épinglage ».
   Sur Samsung : *Sécurité et confidentialité → Autres paramètres de sécurité → Épingler les applications*.
2. Ouvrir l'app, puis afficher les applis récentes, toucher l'icône au-dessus de la fenêtre de l'app, puis **Épingler**.
3. Pour retirer l'épinglage : balayer vers le haut et maintenir, ou, avec 3 boutons, maintenir *Retour* + *Aperçu*.

## 6. Au quotidien

- **Mises à jour** : l'app cherche une nouvelle version au lancement, puis toutes les heures. Elle l'installe dès qu'on revient
  sur l'écran des profils, jamais pendant une partie. Avec l'épinglage d'écran, l'app reste ouverte des jours : c'est ce retour
  à l'écran des profils qui déclenche la mise à jour.
- **Sauvegarde** : les données vivent dans Chrome sur ce téléphone. *Espace parent → Exporter la progression* avant
  de changer de téléphone ou d'effacer les données de Chrome. *Importer une sauvegarde* restaure le fichier sur le même téléphone ou sur un nouveau.
- **Modifier l'app** : voir `docs/ARCHITECTURE.md` ; on pousse sur `main`, la publication est automatique.

## Pour développer en local (optionnel)

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # tests unitaires
npm run test:e2e     # parcours complet dans un Chrome mobile simulé
```
