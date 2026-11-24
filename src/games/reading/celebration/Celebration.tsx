// Fête de fin de niveau gagné : une scène animée par monde (trois animaux au choix), jouée une seule fois, qui finit sur
// sa pose finale. L'objet que l'animal manipule est la lettre du niveau, ou une étoile pour les autres niveaux.
// Pas de voix ici : la musique de réussite est lancée par ReadingEnd.
import { useEffect, useMemo, useState } from 'preact/hooks';
import { renderScene } from './render';
import { loadScene } from './scenes';
import type { CelebrationWorld, SceneModule } from './types';
import './celebration.css';

interface CelebrationProps {
  world: CelebrationWorld;
  /** Clé de la scène, ex. 'foret-lapin'. */
  scene: string;
  /** Capitales du son ('A', 'CH'…) ou 'star'. */
  object: string;
  /** Un toucher sur la scène l'amène directement à sa pose finale. */
  skipped?: boolean;
  onTap?: () => void;
}

export function Celebration({ world, scene, object, skipped = false, onTap }: CelebrationProps) {
  const [module, setModule] = useState<SceneModule | null>(null);
  useEffect(() => {
    let alive = true;
    void loadScene(scene).then((m) => alive && setModule(m));
    return () => {
      alive = false;
    };
  }, [scene]);
  const rendered = useMemo(() => (module ? renderScene(module, object) : null), [module, object]);
  return (
    <div
      class={`cel${skipped ? ' cel--skipped' : ''}`}
      data-testid="reading-celebration"
      data-world={world}
      data-scene={scene}
      data-object={object === 'star' ? 'star' : object}
      role="img"
      aria-label={rendered?.title}
      onClick={onTap}
    >
      {rendered && (
        <>
          <style>{rendered.css}</style>
          <svg
            class="cel__svg"
            viewBox="0 0 412 915"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
            style={rendered.vars}
            dangerouslySetInnerHTML={{ __html: rendered.svg }}
          />
        </>
      )}
    </div>
  );
}
