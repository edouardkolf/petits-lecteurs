// Pastille « TEST » toujours visible en mode test. Appui long (~1,5 s) : petit overlay pour recommencer
// ou quitter (sans code parent : ce ne sont que des données de test). Jamais rendue hors mode test.
import { useRef, useState } from 'preact/hooks';
import { isSandbox } from '../storage';
import { leaveSandbox, resetSandbox } from './sandbox';

export const SANDBOX_LONG_PRESS_MS = 1500;

export function SandboxBadge() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const timerRef = useRef<number | null>(null);

  if (!isSandbox()) return null;

  function startPress() {
    cancelPress();
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setOpen(true);
    }, SANDBOX_LONG_PRESS_MS);
  }

  function cancelPress() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  async function handleReset() {
    setBusy(true);
    await resetSandbox();
  }

  return (
    <>
      <div
        className="sandbox-badge"
        data-testid="sandbox-badge"
        role="status"
        aria-label="Mode test : données séparées. Appui long pour les options."
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerCancel={cancelPress}
        onPointerLeave={cancelPress}
        onContextMenu={(e) => e.preventDefault()}
      >
        TEST
      </div>
      {open && (
        <div className="sandbox-overlay" data-testid="sandbox-overlay" role="dialog" aria-label="Mode test">
          <div className="sandbox-overlay__card">
            <h2 className="sandbox-overlay__title">Mode test</h2>
            <p className="sandbox-overlay__text">Données séparées des vraies : rien de réel n'est touché.</p>
            <button
              type="button"
              className="sandbox-overlay__button"
              data-testid="sandbox-reset"
              disabled={busy}
              onClick={handleReset}
            >
              Recommencer
            </button>
            <button
              type="button"
              className="sandbox-overlay__button sandbox-overlay__button--leave"
              data-testid="sandbox-leave"
              disabled={busy}
              onClick={leaveSandbox}
            >
              Quitter le mode test
            </button>
            <button type="button" className="sandbox-overlay__close" data-testid="sandbox-close" onClick={() => setOpen(false)}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
