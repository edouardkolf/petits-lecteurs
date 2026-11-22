// Pictos des tuiles de jeu du hub (docs/specs/HUB.md §2.1). Même style que MechanicIcon : aplats, un
// reflet clair, pas de contour noir, viewBox 48. Doivent se distinguer de la fiole de `color-mix`.
import type { JSX } from 'preact';
import { mazeMechanicIcon } from '../../../mechanics/maze/icon';
import { memoryGameIcon } from '../../../mechanics/memory/icon';
import { orderMechanicIcon } from '../../../mechanics/order/icon';
import type { GameId } from '../../../games';

const SHADOW = 'rgba(61, 44, 30, 0.14)';

const DRAWINGS: Record<GameId, () => JSX.Element> = {
  // Coloriage : un dessin à zones à moitié colorié, un pinceau, trois gouttes primaires.
  coloring: () => (
    <>
      <ellipse cx="24" cy="42.5" rx="17" ry="2.5" fill={SHADOW} />
      <path
        d="M7.5 34.5V11.5Q7.5 8.5 10.5 8.5H31.5Q34.5 8.5 34.5 11.5V34.5Q34.5 37.5 31.5 37.5H10.5Q7.5 37.5 7.5 34.5Z"
        fill="#fff7e8"
        stroke="#e6dcc4"
        stroke-width="1.5"
      />
      <path d="M7.5 23H21V37.5H10.5Q7.5 37.5 7.5 34.5Z" fill="#ffe38f" />
      <path d="M21 8.5H31.5Q34.5 8.5 34.5 11.5V23H21Z" fill="#8ecfe8" />
      <path d="M13 23V37.5" stroke="#e6dcc4" stroke-width="1.4" />
      <path d="M21 8.5V37.5M7.5 23H34.5" stroke="#c9bfad" stroke-width="1.4" />
      <g transform="rotate(-30 39 33)">
        <rect x="36.5" y="10" width="5" height="20" rx="2" fill="#a6978a" />
        <path d="M35 28H43L40.5 38.5Q39 41.5 37.5 38.5Z" fill="#e63946" />
      </g>
      <circle cx="11" cy="6.5" r="3.4" fill="#e63946" />
      <circle cx="19" cy="4.5" r="3.4" fill="#f2c94c" />
      <circle cx="27" cy="6.5" r="3.4" fill="#1d7fd8" />
    </>
  ),
  // Lecture : un livre ouvert d'où sortent une lettre A et une petite onde sonore (pas de <text> : traits).
  reading: () => (
    <>
      <ellipse cx="24" cy="43.5" rx="18" ry="2.5" fill={SHADOW} />
      <path d="M24 41V27Q15 22.5 5 25V39Q15 36.5 24 41Z" fill="#3fa58a" />
      <path d="M24 41V27Q33 22.5 43 25V39Q33 36.5 24 41Z" fill="#5fc4a6" />
      <path d="M24 38.5V28.5Q16 25 7.5 27V36.5Q16 34.5 24 38.5Z" fill="#fff7e8" />
      <path d="M24 38.5V28.5Q32 25 40.5 27V36.5Q32 34.5 24 38.5Z" fill="#fffdf6" />
      <path d="M11 30.5Q15.5 29.3 20 31M11 33.8Q15.5 32.6 20 34.2M28 31Q32.5 29.3 37 30.5M28 34.2Q32.5 32.6 37 33.8" stroke="#bcd6e8" stroke-width="1.5" stroke-linecap="round" fill="none" />
      <path d="M24 41V27" stroke="#2f8a72" stroke-width="1.6" />
      <circle cx="19" cy="13" r="10" fill="#ffc53d" />
      <circle cx="16" cy="9.5" r="2.4" fill="#ffe38f" />
      <path d="M14 20L19 6L24 20M15.9 15.6H22.1" fill="none" stroke="#7a4b00" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M32 9Q35 13 32 17" fill="none" stroke="#1d7fd8" stroke-width="2.4" stroke-linecap="round" />
      <path d="M36 6Q41.5 13 36 20" fill="none" stroke="#1d7fd8" stroke-width="2.4" stroke-linecap="round" />
    </>
  ),
  // Robot : un petit robot, une flèche, un coffre au trésor.
  robot: () => (
    <>
      <ellipse cx="24" cy="43.5" rx="19" ry="2.3" fill={SHADOW} />
      <path d="M24 5V8" stroke="#8b86e8" stroke-width="2" stroke-linecap="round" />
      <circle cx="24" cy="4.6" r="2.2" fill="#e63946" />
      <rect x="7" y="8" width="22" height="17" rx="5.5" fill="#6c63ff" />
      <rect x="7" y="8" width="22" height="7" rx="5.5" fill="#8b86ff" />
      <circle cx="14.5" cy="17" r="3.2" fill="#ffffff" />
      <circle cx="21.5" cy="17" r="3.2" fill="#ffffff" />
      <circle cx="15" cy="17.5" r="1.5" fill="#3d2c6e" />
      <circle cx="22" cy="17.5" r="1.5" fill="#3d2c6e" />
      <rect x="10" y="26.5" width="16" height="10" rx="3.5" fill="#5a52e0" />
      <rect x="11.5" y="36.5" width="5" height="4.5" rx="1.8" fill="#3d2c6e" />
      <rect x="19.5" y="36.5" width="5" height="4.5" rx="1.8" fill="#3d2c6e" />
      <path d="M31 31H37M34.5 27.5L38 31L34.5 34.5" fill="none" stroke="#f59f00" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
      <rect x="32" y="12" width="13" height="9" rx="2.5" fill="#c98a3a" />
      <path d="M32 15Q32 10 38.5 10Q45 10 45 15Z" fill="#e0a24e" />
      <rect x="37.2" y="14" width="2.6" height="4" rx="1" fill="#ffd34d" />
      <circle cx="40" cy="6.5" r="1.8" fill="#ffd34d" />
      <path d="M33.5 6.5H35M38 3.5V5" stroke="#ffd34d" stroke-width="1.4" stroke-linecap="round" />
    </>
  ),
  // Memory : deux cartes retournées sur la même pomme, une carte de dos (docs/specs/JEUX-MATERNELLE.md).
  memory: memoryGameIcon,
  // Ranger et labyrinthe : même picto que leurs niveaux sur la carte, pour que la petite les reconnaisse.
  order: () => orderMechanicIcon,
  maze: mazeMechanicIcon,
};

export function GameIcon({ id, size = 112 }: { id: GameId; size?: number }) {
  const draw = DRAWINGS[id];
  return (
    <svg class={`game-icon game-icon--${id}`} viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" focusable="false">
      {draw()}
    </svg>
  );
}
