// L'objet de la fête : la lettre (ou les deux lettres) du niveau en capitales « jouet », ou une étoile dorée.
// Même construction que les maquettes : l'objet est posé sur sa base en (0,0), centré, et tient dans une boîte
// BW × BH ; les sons à deux lettres (OU, CH…) ont une boîte plus large pour garder la même hauteur de lettre.

/** Fredoka 650, en em : [avance, encre gauche, encre droite]. */
const MET: Record<string, readonly [number, number, number]> = {
  A: [0.71, 0, 0.719], B: [0.614, 0.031, 0.594], C: [0.637, 0.016, 0.625], D: [0.661, 0.031, 0.641],
  E: [0.606, 0.031, 0.594], F: [0.616, 0.031, 0.594], G: [0.717, 0.031, 0.672], H: [0.656, 0.031, 0.625],
  I: [0.235, 0.031, 0.203], J: [0.533, 0.016, 0.5], K: [0.596, 0.031, 0.578], L: [0.567, 0.047, 0.563],
  M: [0.812, 0.031, 0.781], N: [0.676, 0.031, 0.641], O: [0.723, 0.016, 0.719], P: [0.596, 0.031, 0.578],
  Q: [0.787, 0.016, 0.781], R: [0.607, 0.031, 0.594], S: [0.544, 0.016, 0.531], T: [0.644, 0.016, 0.641],
  U: [0.681, 0.031, 0.656], V: [0.727, 0.016, 0.703], W: [0.95, 0, 0.938], X: [0.69, 0.016, 0.688],
  Y: [0.638, 0, 0.641], Z: [0.594, 0.016, 0.578],
};

export interface ObjectShape {
  /** Dessin SVG de l'objet, base en (0,0). */
  svg: string;
  /** Demi-largeur et hauteur réellement occupées. */
  hw: number;
  hh: number;
  /** Points de prise sur le dessus (gauche, droite, milieu) et leur ordonnée. */
  gl: number;
  gr: number;
  gc: number;
  gy: number;
}

const R = (n: number): number => Math.round(n * 100) / 100;

/** Lettre de base (sans accent) servant à lire les métriques : É se mesure comme E. */
function baseLetter(ch: string): string {
  return ch.normalize('NFD').replace(/[^A-Z]/g, '');
}

/** Points de prise (en em) sur le dessus d'une capitale : au plus près du centre, sur de la « matière ». */
function grip(ch: string): [number, number] {
  const m = MET[ch] ?? MET.M!;
  const c = (m[1] + m[2]) / 2;
  if ('HMNUWVXYKTZEF'.includes(ch)) return [m[1] + 0.1, m[2] - 0.1];
  if ('BDPR'.includes(ch)) return [m[1] + 0.1, m[2] - 0.2];
  if (ch === 'L') return [m[1] + 0.1, m[1] + 0.1];
  if (ch === 'J') return [m[2] - 0.1, m[2] - 0.1];
  if ('OCGQS'.includes(ch)) return [c - 0.12, c + 0.12];
  return [c, c];
}

function buildStar(BW: number, BH: number): ObjectShape {
  // étoile dodue, posée sur ses deux branches basses ; coins arrondis par un trait épais
  const k = 0.24;
  const Rr = Math.min(BH / (1.809 + k + 0.075), BW / (1.902 + k + 0.15)) * 1.02;
  const sw = k * Rr;
  const cy = -(0.809 * Rr + sw / 2);
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = ((-90 + 36 * i) * Math.PI) / 180;
    const rr = i % 2 ? Rr * 0.53 : Rr;
    pts.push(`${R(Math.cos(a) * rr)} ${R(Math.sin(a) * rr + cy)}`);
  }
  const d = `M ${pts.join(' L ')} Z`;
  const ol = R(Rr * 0.075);
  const svg =
    `<path d="${d}" transform="translate(0 ${R(Rr * 0.07)})" fill="#c98512" stroke="#c98512" stroke-width="${R(sw + 2 * ol)}" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="#c98512" stroke="#c98512" stroke-width="${R(sw + 2 * ol)}" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="url(#oStar)" stroke="url(#oStar)" stroke-width="${R(sw)}" stroke-linejoin="round"/>` +
    `<path d="M ${R(-Rr * 0.5)} ${R(cy - Rr * 0.08)} Q ${R(-Rr * 0.42)} ${R(cy - Rr * 0.3)} ${R(-Rr * 0.2)} ${R(cy - Rr * 0.36)}" stroke="#fffbe0" stroke-opacity=".75" stroke-width="${R(Rr * 0.1)}" stroke-linecap="round" fill="none"/>`;
  const hs = R(1.809 * Rr + sw + ol);
  return { svg, hw: R(0.951 * Rr + sw / 2 + ol), hh: hs, gl: -8, gr: 8, gc: 0, gy: R(-hs + 4) };
}

/**
 * Construit l'objet pour `label` (capitales : 'A', 'CH', 'OU'… ou 'STAR') dans la boîte BW × BH.
 */
export function buildObject(label: string, boxW: number, boxH: number): ObjectShape {
  if (label === 'STAR') return buildStar(boxW, boxH);
  const base = Array.from(label).map(baseLetter).join('') || 'M';
  const text = label.length > 0 ? label : 'M';
  // sons à deux lettres : boîte plus large, pour garder la même hauteur de lettre qu'une capitale seule
  const BW = base.length > 1 ? boxW * 1.32 : boxW;
  const BH = boxH;
  const metOf = (i: number) => MET[base[i] ?? 'M'] ?? MET.M!;
  let adv = 0;
  for (let j = 0; j < base.length; j++) adv += metOf(j)[0];
  const inkL = metOf(0)[1];
  const last = metOf(base.length - 1);
  const inkR = adv - last[0] + last[2];
  const inkW = inkR - inkL;
  const fs = Math.min(BH / 0.78, BW / (inkW + 0.075));
  const dx = -((inkL + inkR) / 2 - adv / 2) * fs;
  const baseline = -0.05 * fs;
  const font = `font-family="'Fredoka Variable', Fredoka, sans-serif" font-weight="650" font-size="${R(fs)}" text-anchor="middle" x="${R(dx)}"`;
  const svg =
    `<text ${font} y="${R(baseline + fs * 0.04)}" fill="#c23a54" stroke="#c23a54" stroke-width="${R(fs * 0.06)}" stroke-linejoin="round">${text}</text>` +
    `<text ${font} y="${R(baseline)}" fill="url(#oGrad)" stroke="#c23a54" stroke-width="${R(fs * 0.045)}" stroke-linejoin="round" paint-order="stroke">${text}</text>`;
  const gL = grip(base[0] ?? 'M');
  let gl = base.length > 1 ? gL[1] : gL[0];
  const lastStart = adv - last[0];
  const gR = grip(base[base.length - 1] ?? 'M');
  let gr = lastStart + (base.length > 1 ? gR[0] : gR[1]);
  gl = (gl - adv / 2) * fs + dx;
  gr = (gr - adv / 2) * fs + dx;
  if (gr - gl < 20) {
    const mid = (gl + gr) / 2;
    gl = mid - 10;
    gr = mid + 10;
  }
  // prise du milieu : le centre s'il y a de la matière en haut au centre, sinon la prise de droite
  const gc = base.length === 1 && 'ABCDEFGIOPQRSTZ'.includes(base) ? (gl + gr) / 2 : gr;
  const hh = R((0.703 + 0.05 + 0.025) * fs);
  return { svg, hw: R((inkW / 2 + 0.03) * fs), hh, gl: R(gl), gr: R(gr), gc: R(gc), gy: R(-hh + 0.05 * fs) };
}

/** Dégradés de l'objet (lettre rose, étoile dorée), à poser dans les `defs` de la scène. */
export const OBJECT_DEFS = `<linearGradient id="oGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ff95a5"/><stop offset=".5" stop-color="#ff6f83"/><stop offset="1" stop-color="#f45c74"/>
    </linearGradient>
    <linearGradient id="oStar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffe57a"/><stop offset=".55" stop-color="#ffc928"/><stop offset="1" stop-color="#f7ab12"/>
    </linearGradient>`;

/** Emplacement de l'objet dans une scène ; rempli au rendu. Base en (0,0). */
export const objSlot = (extra = ''): string => `<g class="obj" ${extra}></g>`;
