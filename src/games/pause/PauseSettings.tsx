// Réglage parent « Pauses de lecture » de la fiche enfant (docs/specs/PAUSES-REVISION.md), sous les jeux libres :
// interrupteur (activé par défaut) et intervalle de 3, 5 ou 10 minutes (5 par défaut).
// Valeur absente = réglages par défaut : on ne stocke que ce qui s'en écarte.
import type { GameSettingsProps } from '..';
import type { PauseSettingsValue } from '../../socle/storage/readings';
import { DEFAULT_PAUSE_INTERVAL_MIN, PAUSE_INTERVALS_MIN, pausesEnabled } from './trigger';
import '../reading/reading-parent.css';

type Interval = (typeof PAUSE_INTERVALS_MIN)[number];

/** Valeur à stocker : undefined quand tout est par défaut. */
export function normalizePauseSettings(value: PauseSettingsValue): PauseSettingsValue | undefined {
  const next: PauseSettingsValue = {};
  if (value.enabled === false) next.enabled = false;
  if (value.intervalMin !== undefined && value.intervalMin !== DEFAULT_PAUSE_INTERVAL_MIN) next.intervalMin = value.intervalMin;
  return Object.keys(next).length > 0 ? next : undefined;
}

export function PauseSettings({ value, onChange }: GameSettingsProps<PauseSettingsValue>) {
  const enabled = pausesEnabled(value);
  const interval: Interval = value?.intervalMin ?? DEFAULT_PAUSE_INTERVAL_MIN;

  return (
    <fieldset className="pa-field" data-testid="pause-settings">
      <legend className="pa-field__label">Pauses de lecture</legend>
      <p className="pa-muted">
        Pendant les jeux libres, une courte pause (2 à 3 questions, avec la voix) fait réviser les lettres déjà connues.
        Sans voix ou son coupé, il n'y a jamais de pause.
      </p>
      <button
        type="button"
        className="pa-toggle"
        aria-pressed={enabled}
        aria-label="Pauses de lecture"
        data-testid="pause-toggle"
        onClick={() => onChange(normalizePauseSettings({ ...value, enabled: !enabled }))}
      >
        <span className="pa-toggle__knob" aria-hidden="true" />
        <span className="pa-toggle__text">{enabled ? 'Activées' : 'Désactivées'}</span>
      </button>
      {enabled && (
        <label className="pa-field">
          <span className="pa-field__label">Une pause toutes les</span>
          <select
            id="pause-interval"
            className="pa-input rp-select"
            data-testid="pause-interval"
            value={String(interval)}
            onChange={(ev) =>
              onChange(normalizePauseSettings({ ...value, intervalMin: Number((ev.currentTarget as HTMLSelectElement).value) as Interval }))
            }
          >
            {PAUSE_INTERVALS_MIN.map((m) => (
              <option key={m} value={String(m)} selected={m === interval}>
                {m} minutes de jeu
              </option>
            ))}
          </select>
        </label>
      )}
    </fieldset>
  );
}
