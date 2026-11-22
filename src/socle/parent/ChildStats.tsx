// Statistiques d'un enfant (espace parent › Statistiques) : uniquement la progression en lecture (avancée dans
// l'aventure, temps de jeu, items, confusions, banc d'écoute — LECTURE.md §8.3). Le temps de jeu, le minuteur et le
// quota ne changent pas : ils restent sur la carte du tableau de bord et dans `UsageDay`.
import { useEffect, useState } from 'preact/hooks';
import { trackLabel } from '../../engine';
import { ReadingStats } from '../../games/reading/ReadingStats';
import { getProfile, listReadings, listUsage } from '../storage';
import type { Profile, ReadingRecord, UsageDay } from '../storage';
import { Emoji } from '../ui/Emoji';
import { BackToChildren } from './ParentShell';
import { describeError } from './util';

interface StatsData {
  profile: Profile;
  trackTitle: string;
  readings: ReadingRecord[];
  usageDays: UsageDay[];
}

async function loadStats(profileId: string): Promise<StatsData> {
  const profile = await getProfile(profileId);
  if (!profile) throw new Error('Cet enfant est introuvable.');
  const [readings, usageDays] = await Promise.all([listReadings(profileId), listUsage(profileId)]);
  return { profile, trackTitle: trackLabel(profile.trackId), readings, usageDays };
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

  const { profile, trackTitle, readings, usageDays } = data;
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

      <div data-testid="game-stats-reading">
        <ReadingStats profile={profile} records={readings} usageDays={usageDays} />
      </div>
    </div>
  );
}
