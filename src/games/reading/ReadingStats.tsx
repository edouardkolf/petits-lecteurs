// Page de statistiques « J'apprends à lire » (LECTURE.md §8.3) : avancée dans l'aventure, temps de jeu, items, confusions,
// banc d'écoute. C'est le seul contenu de la page de statistiques d'un enfant (monté par ChildStats).
import { useMemo } from 'preact/hooks';
import type { GameStatsProps } from '..';
import type { ReadingRecord } from '../../socle/storage/readings';
import { dayKey } from '../../socle/storage/day';
import type { UsageDay } from '../../socle/storage/types';
import { formatDateTime, formatDuration, formatPercentage } from '../../socle/parent/format';
import { GAMES, isAdventureGame } from '..';
import { summarizePauses } from '../pause/stats';
import { VoiceBench } from './VoiceBench';
import { STAGE_TITLES, summarizeReading, summarizeReadingTime } from './stats';
import type { ReadingStatsSummary } from './stats';
import { READING_STAGES } from './types';
import './reading-parent.css';

const STATE_NAMES = { new: 'pas encore vu', learning: 'en cours', acquired: 'acquis' } as const;

/** Les mini-jeux du hub : tous les jeux de l'app sauf l'aventure de lecture. */
const MINI_GAME_IDS: readonly string[] = GAMES.filter((game) => !isAdventureGame(game.id)).map((game) => game.id);

export function ReadingStats({ profile, records, usageDays }: GameStatsProps<ReadingRecord> & { usageDays: readonly UsageDay[] }) {
  const settings = profile.gameSettings?.reading;
  const summary = useMemo<ReadingStatsSummary | null>(() => {
    try {
      return summarizeReading(records, settings, Date.now());
    } catch {
      return null; // contenu pas encore prêt : on n'affiche que le banc d'écoute
    }
  }, [records, settings]);

  const pauses = useMemo(() => summarizePauses(records, Date.now()), [records]);
  const time = useMemo(() => summarizeReadingTime(usageDays, dayKey(), MINI_GAME_IDS), [usageDays]);
  const adventure = summary?.adventure;
  const wonPercent = adventure ? Math.round((adventure.levelsPassed / adventure.levelTotal) * 100) : 0;

  return (
    <section class="pa-section" data-testid="reading-stats">
      <h2 class="pa-section__title">J'apprends à lire</h2>
      {summary && adventure && (
        <>
          <div data-testid="reading-stats-levels" data-passed={adventure.levelsPassed} data-total={adventure.levelTotal}>
            <p class="rp-levels__count">
              <strong data-testid="reading-stats-levels-count">
                {adventure.levelsPassed} niveau{adventure.levelsPassed > 1 ? 'x' : ''} gagné{adventure.levelsPassed > 1 ? 's' : ''} sur{' '}
                {adventure.levelTotal}
              </strong>
            </p>
            <div
              class="rp-bar"
              role="meter"
              aria-label="Niveaux de l'aventure gagnés"
              aria-valuemin={0}
              aria-valuemax={adventure.levelTotal}
              aria-valuenow={adventure.levelsPassed}
            >
              <span class="rp-bar__fill" style={{ width: `${wonPercent}%` }} />
            </div>
            <ul class="rp-tracks">
              {adventure.tracks.map((t) => (
                <li key={t.track} class="rp-track" data-testid={`reading-stats-track-${t.track}`} data-passed={t.passed} data-total={t.total}>
                  <span class="rp-track__label">{t.label}</span>
                  <span class="rp-track__count">
                    {t.passed} / {t.total}
                  </span>
                </li>
              ))}
            </ul>
            <p class="pa-muted" data-testid="reading-stats-last">
              Dernière séance : {formatDateTime(adventure.lastSessionAt)}
            </p>
          </div>

          <section data-testid="reading-time">
            <h3 class="rp-stage__title">Temps de jeu</h3>
            <table class="pa-activity-table">
              <thead>
                <tr>
                  <th scope="col">Activité</th>
                  <th scope="col">Aujourd'hui</th>
                  <th scope="col">7 derniers jours</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Lecture</th>
                  <td data-testid="reading-time-reading-today">{formatDuration(time.reading.today * 1000)}</td>
                  <td data-testid="reading-time-reading-week">{formatDuration(time.reading.week * 1000)}</td>
                </tr>
                <tr>
                  <th scope="row">Mini-jeux</th>
                  <td data-testid="reading-time-games-today">{formatDuration(time.games.today * 1000)}</td>
                  <td data-testid="reading-time-games-week">{formatDuration(time.games.week * 1000)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section data-testid="reading-stats-pauses" data-done={pauses.doneThisWeek} data-hard={pauses.hardAt.length}>
            <h3 class="rp-stage__title">Pauses de lecture</h3>
            <p class="pa-muted">Pendant les jeux libres : quelques questions sur les lettres déjà acquises.</p>
            <div class="pa-summary">
              <div class="pa-stat">
                <span class="pa-stat__value" data-testid="reading-stats-pauses-done">
                  {pauses.doneThisWeek}
                </span>
                <span class="pa-stat__label">Pauses cette semaine</span>
              </div>
              <div class="pa-stat">
                <span class="pa-stat__value" data-testid="reading-stats-pauses-rate">
                  {formatPercentage(pauses.firstRate)}
                </span>
                <span class="pa-stat__label">1re question réussie</span>
              </div>
            </div>
            {pauses.hardAt.length === 0 ? (
              <p class="pa-muted" data-testid="reading-stats-pause-hard-empty">Aucune pause difficile.</p>
            ) : (
              <>
                <p class="rp-alert" role="status">
                  <span class="rp-alert__title">Pause difficile.</span> Ces pauses se sont arrêtées au 3e échec : elle avait
                  peut-être oublié ces lettres, ou n'était pas disponible. Une séance à ses côtés peut aider.
                </p>
                <ul class="rp-hard" data-testid="reading-stats-pause-hard">
                  {pauses.hardAt.map((at) => (
                    <li key={at} data-testid="reading-stats-pause-hard-item">
                      {formatDateTime(at)}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <div class="pa-summary">
            <div class="pa-stat">
              <span class="pa-stat__value" data-testid="reading-stats-level">
                {summary.finished ? 'Terminé' : `${summary.levelIndex} sur ${summary.levelTotal}`}
              </span>
              <span class="pa-stat__label">Niveau en cours</span>
            </div>
            <div class="pa-stat">
              <span class="pa-stat__value" data-testid="reading-stats-acquired">
                {summary.acquired} / {summary.gatedTotal}
              </span>
              <span class="pa-stat__label">Items acquis</span>
            </div>
            <div class="pa-stat">
              <span class="pa-stat__value" data-testid="reading-stats-sessions">
                {summary.sessionsCompleted}
              </span>
              <span class="pa-stat__label">Séances terminées</span>
            </div>
          </div>

          {summary.alerts.map((a) => (
            <p class="rp-alert" key={a.game} data-testid={`reading-stats-alert-${a.game}`}>
              <span class="rp-alert__title">À accompagner : {a.label}.</span> Elle semble répondre au hasard à ce jeu :
              restez à côté d'elle pour une séance.
            </p>
          ))}

          {READING_STAGES.map((stage) => {
            const items = summary.items.filter((i) => i.stage === stage);
            if (items.length === 0) return null;
            return (
              <div class="rp-stage" key={stage} data-testid={`reading-stats-grid-${stage}`}>
                <h3 class="rp-stage__title">
                  Étape {stage} · {STAGE_TITLES[stage]}
                </h3>
                <ul class="rp-items">
                  {items.map((i) => (
                    <li
                      key={i.itemId}
                      class={`rp-item${i.itemId.startsWith('k:') ? ' rp-item--wide' : ''}`}
                      data-state={i.state}
                      data-testid={`reading-stats-item-${i.itemId}`}
                      aria-label={`${i.label} : ${STATE_NAMES[i.state]}${i.rate === null ? '' : `, ${formatPercentage(i.rate)} du premier coup`}`}
                    >
                      <span class="rp-item__label">{i.label}</span>
                      <span class="rp-item__rate">{formatPercentage(i.rate)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          <div class="rp-legend">
            <span data-state="new"><i class="rp-item__dot" /> pas encore vu</span>
            <span data-state="learning"><i class="rp-item__dot" /> en cours</span>
            <span data-state="acquired"><i class="rp-item__dot" /> acquis</span>
            <span>% = réussite du premier coup</span>
          </div>

          <h3 class="rp-stage__title">Confusions les plus fréquentes</h3>
          {summary.confusions.length === 0 ? (
            <p class="pa-muted" data-testid="reading-stats-confusions-empty">Aucune confusion relevée pour l'instant.</p>
          ) : (
            <table class="rp-table" data-testid="reading-stats-confusions">
              <thead>
                <tr>
                  <th>Demandé</th>
                  <th>Choisi</th>
                  <th>Fois</th>
                </tr>
              </thead>
              <tbody>
                {summary.confusions.map((c) => (
                  <tr key={`${c.target}>${c.chosen}`}>
                    <td>{c.target}</td>
                    <td>{c.chosen}</td>
                    <td>{c.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
      <VoiceBench />

      <section class="pa-help-box" data-testid="reading-help">
        <h3 class="rp-stage__title">Comment lire ces chiffres</h3>
        <ul>
          <li>
            <strong>Niveau gagné</strong> : une séance terminée où l'enfant a réussi du premier coup au moins 4
            questions sur 5 (ou 6 sur 8 pour les niveaux plus longs). Un niveau raté se rejoue ; le suivant ne s'ouvre
            qu'une fois le niveau gagné. Le réglage « Étape de départ » tient pour gagnés les niveaux des étapes d'avant.
          </li>
          <li>
            <strong>Pistes</strong> : J'écoute (sons et syllabes), Les lettres, J'assemble (syllabes) et Je lis (mots) ;
            chacune compte ses niveaux gagnés sur son total.
          </li>
          <li>
            <strong>Lettre acquise</strong> : trouvée du premier coup 3 fois de suite, sur 2 jours différents. Une
            lettre acquise peut redevenir « en cours » si l'enfant se remet à se tromper.
          </li>
          <li>
            <strong>À accompagner</strong> : sur un jeu, l'enfant répond à peu près comme au hasard (au moins 12
            réponses ces 14 derniers jours). Restez à côté de lui pour une séance : ce n'est pas un échec, il a juste
            besoin d'aide pour entrer dans le jeu.
          </li>
          <li>
            <strong>Pauses de lecture</strong> : toutes les quelques minutes de jeu libre, 2 à 3 questions sur des lettres
            déjà acquises. Elles ne comptent ni pour les niveaux ni pour les lettres acquises. « 1re question réussie » =
            la question tirée au hasard parmi les lettres acquises, du premier coup. Une « pause difficile » s'arrête au
            3e échec.
          </li>
          <li>
            <strong>Temps de jeu</strong> : le temps actif compté par le minuteur. « Lecture » = la carte d'aventure et
            les séances ; « Mini-jeux » = coloriage, memory, ranger, labyrinthe et robot. L'accueil n'est pas compté.
          </li>
        </ul>
      </section>
    </section>
  );
}
