# Socle

Le socle est la base commune destinée à être reprise telle quelle par les prochaines apps (une app par thème ou niveau,
chacune dans son dépôt). Il contient tout ce qui ne dépend pas de ce que l'app enseigne :

| Dossier | Contenu |
|---|---|
| `app/` | routes par hash et historique (`routes.ts`), minuteur de session et quota (`session.ts`, `SessionProvider.tsx`), profil actif (`context.ts`), mises à jour de la PWA (`updates.ts`) |
| `parent/` | espace parent : code (PIN), fiches enfant, limites, statistiques, export et import JSON |
| `storage/` | base IndexedDB (`db.ts`, schéma v5), profils, parties, temps d'usage, réglages, export et import (format v5) |
| `ui/` | composants et ressources partagés : émojis, icônes, sons, voix, palette, avatars |

## La règle

**Le socle n'importe jamais depuis `src/games`, `src/screens`, `src/mechanics` ni `src/engine`** (ni depuis
`src/app`, qui assemble l'app). Le code propre à l'app (jeux, écrans, mécaniques, `AppShell`) importe depuis le socle,
jamais l'inverse. `src/app/AppShell.tsx` reste dans l'app : il connaît les écrans.

## Exceptions connues

Dépendances du socle vers le code de l'app, laissées telles quelles pour l'instant (à retirer quand une deuxième app
réutilisera le socle : injecter la liste des jeux, des parcours et des blocs de statistiques plutôt que les importer) :

- `parent/ChildForm.tsx` : `games` (registre `GAMES`, disponibilité), `games/reading/ReadingSettings`,
  `games/coloring/ColoringSettings`, `engine` (parcours) ;
- `parent/ChildStats.tsx` : `games` (registre), `games/reading/ReadingStats`, `games/coloring/ColoringStats`,
  `games/puzzle/PuzzleStats`, `engine` ;
- `parent/Dashboard.tsx` : `games` (jeux visibles) et `engine` (libellé du parcours) ;
- `parent/Settings.tsx` : `app/appInfo.ts` (nom de l'app affiché) ;
- `storage/readings.ts` : types et constantes de `games/reading/types` ; `storage/colorings.ts` : `engine/types`
  et `mechanics/color-mix/generate` ;
- `ui/icons/GameIcon.tsx` : `games` (identifiants) et `mechanics/*/icon` (pictos des jeux) ;
  `ui/objects.ts`, `ui/palette.ts` : types de `engine/types` ;
- `app/routes.ts` : la liste des routes de jeu (`GAME_ROUTES`) nomme les jeux de l'app.

Le schéma IndexedDB (stores de tous les jeux de Petits Malins) et le format d'export sont communs et inchangés : un
export de Petits Malins s'importe dans Petits Lecteurs.
