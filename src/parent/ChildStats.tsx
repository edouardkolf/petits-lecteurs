// Statistiques d'un enfant : résumé global, temps par activité, puis le bilan de chaque jeu (la lecture et les
// mini-jeux du hub — ARCHITECTURE §7, HUB.md §5.5/§6.4). Pas de carte de compétences dans Petits Lecteurs.
import { useEffect, useState } from 'preact/hooks';
import { trackLabel } from '../engine';
import { GAMES, visibleGameIds } from '../games';
import { ColoringStats } from '../games/coloring/ColoringStats';
import { PuzzleStats } from '../games/puzzle/PuzzleStats';
import { ReadingStats } from '../games/reading/ReadingStats';
import {
  dayKey,
  getProfile,
  listColorings,
  listPuzzles,
  listReadings,
  listRuns,
  listUsage,
} from '../storage';
import type {
  ColoringRecord,
  GameRecordBase,
  Profile,
  PuzzleRecord,
  ReadingRecord,
  UsageDay,
} from '../storage';
import { Emoji } from '../ui/Emoji';
import { Icon } from '../ui/icons/Icon';
import { BackToChildren } from './ParentShell';
import { formatDateTime, formatDuration } from './format';
import { summarizeActivityTime, summarizeGameRecords, summarizeRuns, totalActivitySeconds } from './stats';
import type { ActivityTotals, RunsSummary } from './stats';
import { describeError } from './util';

interface StatsData {
  profile: Profile;
  trackTitle: string;
  summary: RunsSummary;
  colorings: ColoringRecord[];
  puzzles: PuzzleRecord[];
  readings: ReadingRecord[];
  usageDays: UsageDay[];
}

async function loadStats(profileId: string): Promise<StatsData> {
  const profile = await getProfile(profileId);
  if (!profile) throw new Error('Cet enfant est introuvable.');

  const [runs, colorings, puzzles, readings, usageDays] = await Promise.all([
    listRuns(profileId),
    listColorings(profileId),
    listPuzzles(profileId),
    listReadings(profileId),
    listUsage(profileId),
  ]);

  return {
    profile,
    trackTitle: trackLabel(profile.trackId),
    summary: summarizeRuns(runs),
    colorings,
    puzzles,
    readings,
    usageDays,
  };
}

/** Libellé d'une ligne du tableau « Temps par activité » (HUB.md §6.4). */
function activityRowLabel(id: string): string {
  if (id === 'map') return "Carte de l'aventure";
  if (id === 'hub') return 'Accueil';
  if (id === 'total') return 'Total';
  if (id === 'reading') return 'Lecture';
  return GAMES.find((game) => game.id === id)?.parentLabel ?? id;
}

/** Secondes de `id` dans `totals` ; le total additionne toutes les activités (§5.5 : = Σ activeSeconds). */
function activitySeconds(totals: ActivityTotals, id: string): number {
  return id === 'total' ? totalActivitySeconds(totals) : (totals[id] ?? 0);
}

export function ChildStats(props: { profileId: string }) {
  const [data, setData] = useState<StatsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    loadStats(props.profileId)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(describeError(err));
      });
    return () => {
      cancelled = true;
    };
  }, [props.profileId]);

  if (error) {
    return (
      <div className="pa-space">
        <p className="pa-error">{error}</p>
        <BackToChildren />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="pa-space">
        <p className="pa-muted">Chargement…</p>
      </div>
    );
  }

  const { profile, trackTitle, summary, colorings, puzzles, readings, usageDays } = data;
  const recordsByGame: Record<string, readonly GameRecordBase[]> = {
    coloring: colorings,
    reading: readings,
    // Les jeux de logique partagent le store ; chacun a sa section (filtre par `game`).
    robot: puzzles.filter((r) => r.game === 'robot'),
    memory: puzzles.filter((r) => r.game === 'memory'),
    order: puzzles.filter((r) => r.game === 'order'),
    maze: puzzles.filter((r) => r.game === 'maze'),
  };

  // Cadre A8 : « Temps de jeu total » = niveaux (summary.playTimeMs) + Σ activeMs des parties de jeu.
  const freeGamesActiveMs = Object.values(recordsByGame)
    .flat()
    .reduce((sum, r) => sum + r.activeMs, 0);

  const activityTime = summarizeActivityTime(usageDays, dayKey());
  const visibleGames = new Set(visibleGameIds(profile));
  // Lignes du tableau : la carte, puis les jeux visibles ou joués cette semaine, l'accueil, le total.
  const activityGameIds = GAMES.filter(
    (game) => visibleGames.has(game.id) || (activityTime.week[game.id] ?? 0) > 0,
  ).map((game) => game.id);
  const activityRowIds = ['map', ...activityGameIds, 'hub', 'total'];

  // Une section par jeu visible ou ayant au moins une partie (arbitrage A7/A8, HUB.md §6.4).
  const gameSections = GAMES.flatMap((game) => {
    const records: readonly GameRecordBase[] = recordsByGame[game.id] ?? [];
    if (!visibleGames.has(game.id) && records.length === 0) return [];
    return [{ game, records }];
  });

  return (
    <div className="pa-space">
      <BackToChildren />
      <header className="pa-header pa-stats-header">
        <span className="pa-stats-header__avatar" aria-hidden="true">
          <Emoji char={profile.avatar} />
        </span>
        <div>
          <h1>{profile.name}</h1>
          <p className="pa-muted">{trackTitle}</p>
        </div>
      </header>

      <section className="pa-section pa-summary">
        <div className="pa-stat">
          <span className="pa-stat__value">{formatDuration(summary.playTimeMs + freeGamesActiveMs)}</span>
          <span className="pa-stat__label">Temps de jeu total</span>
        </div>
      </section>

      <section className="pa-section" data-testid="activity-time">
        <h2 className="pa-section__title">Temps par activité</h2>
        <table className="pa-activity-table">
          <thead>
            <tr>
              <th scope="col">Activité</th>
              <th scope="col">Aujourd'hui</th>
              <th scope="col">7 derniers jours</th>
            </tr>
          </thead>
          <tbody>
            {activityRowIds.map((id) => (
              <tr key={id} className={id === 'total' ? 'pa-activity-table__total' : undefined}>
                <th scope="row">{activityRowLabel(id)}</th>
                <td data-testid={`activity-${id}-today`}>
                  {formatDuration(activitySeconds(activityTime.today, id) * 1000)}
                </td>
                <td data-testid={`activity-${id}-week`}>
                  {formatDuration(activitySeconds(activityTime.week, id) * 1000)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {gameSections.map(({ game, records }) => {
        const gameSummary = summarizeGameRecords(records, Date.now());
        return (
          <section key={game.id} className="pa-section" data-testid={`game-stats-${game.id}`}>
            <h2 className="pa-section__title">{game.parentLabel}</h2>
            <dl className="pa-stat-grid">
              <div className="pa-stat-grid__item">
                <dt>Parties</dt>
                <dd>{gameSummary.total}</dd>
              </div>
              <div className="pa-stat-grid__item">
                <dt>Terminées</dt>
                <dd>{gameSummary.completed}</dd>
              </div>
              <div className="pa-stat-grid__item">
                <dt>Abandons</dt>
                <dd>{gameSummary.abandoned}</dd>
              </div>
              <div className="pa-stat-grid__item">
                <dt>Interruptions</dt>
                <dd>{gameSummary.interrupted}</dd>
              </div>
              <div className="pa-stat-grid__item">
                <dt>Temps de jeu</dt>
                <dd>{formatDuration(gameSummary.activeMs)}</dd>
              </div>
              <div className="pa-stat-grid__item">
                <dt>Jours joués (7 j)</dt>
                <dd>{gameSummary.daysPlayedInWeek}</dd>
              </div>
              <div className="pa-stat-grid__item">
                <dt>Dernière partie</dt>
                <dd>{formatDateTime(gameSummary.lastPlayedAt)}</dd>
              </div>
            </dl>
            {game.id === 'coloring' && <ColoringStats profile={profile} records={records as ColoringRecord[]} />}
            {game.id === 'reading' && <ReadingStats profile={profile} records={records as ReadingRecord[]} />}
            {game.id !== 'coloring' && game.id !== 'reading' && (
              <PuzzleStats profile={profile} records={records as PuzzleRecord[]} />
            )}
          </section>
        );
      })}

      <section className="pa-help-box">
        <h2 className="pa-section__title">Comment lire ces chiffres</h2>
        <ul>
          <li>
            <strong>Temps par activité</strong> : le temps compté par les minuteurs, réparti par écran (Accueil,
            Carte, Coloriage…), aujourd'hui et sur les 7 derniers jours.
          </li>
          <li>
            Pour chaque jeu : <strong>Parties</strong> compte tous les lancements, y compris en cours.
            <strong> Terminées</strong> : parties allées au bout. <strong>Abandons</strong> : parties quittées avant la
            fin (bouton maison ou application fermée). <strong>Interruptions</strong> : parties coupées par le
            minuteur ou le quota — ce n'est pas un abandon. <strong>Temps de jeu</strong> ne compte que le jeu
            lui-même, pas les écrans de choix : il est donc un peu plus petit que son temps dans le tableau.
          </li>
          <li>
            <strong>Jours joués (7 jours)</strong> : le nombre de jours différents, cette semaine, où l'enfant a
            lancé au moins une partie de ce jeu — un repère de régularité plutôt que de performance.
          </li>
          <li>
            <strong>Dernière partie</strong> : la date de la partie la plus récente sur ce jeu.
          </li>
        </ul>
      </section>
    </div>
  );
}
