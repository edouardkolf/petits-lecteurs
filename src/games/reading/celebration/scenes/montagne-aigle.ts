// @ts-nocheck — portage fidèle des maquettes JS validées (art en chaînes SVG) ; l'API publique est typée dans types.ts.
// Montagne · aigle : un aigle tout rond et souriant arrive en planant, l'objet serré dans ses serres,
// le dépose sur un gros rocher, puis se perche à côté et replie ses ailes.
import * as L from '../lib';
import type { SceneModule } from '../types';
const { anim, sparkle, sparkleAnim, objSlot, bigRock, puff, puffAnim } = L;

const S = 1.2;
const ROCK = [196, 604, 330, 96]; // sommet (x, y), largeur, hauteur
const TOP = ROCK[1] + 2;
const OX = 160; // centre de l'objet posé
const GAP = 70; // du bord droit de l'objet aux pattes de l'aigle perché
const T_SET = 1.36; // l'objet touche le rocher
const T_REL = 1.46; // l'aigle le lâche
const T_PERCH = 1.86;
const BOX = [180, 110];
const C = {
  body: '#8a5a35',
  bodyLt: '#a87148',
  dark: '#6b4426',
  head: '#ffffff',
  headSh: '#e3e9ef',
  beak: '#ffb829',
  beakDk: '#e39213',
  leg: '#f2b53a',
  ink: '#2e2a26',
};

/** Aile déployée (pivot à l'épaule, vers la droite) ; miroir pour la gauche. */
function wing(side, cls) {
  return `<g transform="translate(${side * 24} -70) scale(${side} 1)"><g class="${cls}">
    <path d="M -2 -8 C 30 -30 84 -36 128 -18 L 120 -6 L 128 2 L 110 6 L 116 15 L 94 15 L 98 25 L 74 22 L 74 31 L 52 24 C 34 22 12 18 -2 12 Z" fill="${C.body}"/>
    <path d="M 84 -28 C 100 -28 116 -24 128 -18 L 120 -6 L 128 2 L 110 6 L 116 15 L 94 15 L 98 25 L 86 22 C 90 8 90 -10 84 -28 Z" fill="${C.dark}"/>
    <path d="M 4 -10 C 28 -24 56 -28 76 -26 C 64 -16 40 -8 6 0 Z" fill="${C.bodyLt}"/>
    <path d="M 20 10 Q 30 4 40 12 M 44 14 Q 54 8 62 16" stroke="${C.dark}" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".6"/>
  </g></g>`;
}

/** Aigle de face ; repère : point de prise des serres (0,0). Pattes dessinées à part (en px). */
function eagle(p) {
  return `<g class="${p}-squash">
    <path d="M -16 -34 L 16 -34 L 24 -8 L 12 -12 L 6 -4 L 0 -12 L -6 -4 L -12 -12 L -24 -8 Z" fill="#f4f6f8" stroke="#dfe4ea" stroke-width="1.5" stroke-linejoin="round"/>
    ${wing(-1, `${p}-wingL`)}${wing(1, `${p}-wingR`)}
    <ellipse cx="0" cy="-58" rx="31" ry="34" fill="${C.body}"/>
    <path d="M -18 -70 Q -12 -62 -6 -70 Q 0 -62 6 -70 Q 12 -62 18 -70 M -14 -52 Q -8 -44 -2 -52 Q 4 -44 10 -52 M -8 -36 Q -2 -28 4 -36" stroke="${C.bodyLt}" stroke-width="3" stroke-linecap="round" fill="none"/>
    <g class="${p}-head">
      <path d="M -10 -122 Q -6 -134 0 -124 Q 6 -136 10 -122 Z" fill="${C.head}"/>
      <circle cx="0" cy="-100" r="27" fill="${C.head}"/>
      <path d="M -26 -92 Q 0 -70 26 -92 Q 22 -76 0 -74 Q -22 -76 -26 -92 Z" fill="${C.headSh}"/>
      <circle cx="-18" cy="-92" r="4.6" fill="#ff8f7a" opacity=".45"/><circle cx="18" cy="-92" r="4.6" fill="#ff8f7a" opacity=".45"/>
      <g class="${p}-eyes">
        <circle cx="-11" cy="-104" r="5.6" fill="${C.ink}"/><circle cx="11" cy="-104" r="5.6" fill="${C.ink}"/>
        <circle cx="-9.2" cy="-106" r="2" fill="#fff"/><circle cx="12.8" cy="-106" r="2" fill="#fff"/>
      </g>
      <g class="${p}-happy" opacity="0"><path d="M -16 -103 Q -11 -109 -6 -103 M 6 -103 Q 11 -109 16 -103" stroke="${C.ink}" stroke-width="2.8" stroke-linecap="round" fill="none"/></g>
      <path d="M -9 -96 Q 0 -101 9 -96 Q 8 -88 2 -84 Q 0 -81 -1 -85 Q -6 -88 -9 -96 Z" fill="${C.beak}"/>
      <path d="M 2 -84 Q 0 -81 -1 -85 Q 1 -86 3 -87 Z" fill="${C.beakDk}"/>
    </g>
  </g>`;
}

/** Pattes et serres, en px, selon les points de prise de l'objet (gl, gr). */
function legs(p) {
  const hip = 12 * S;
  const top = -32 * S;
  const foot = (side) => {
    const x = side < 0 ? '{Math.max(gl,-34)}' : '{Math.min(gr,34)}';
    return `<path data-t="d=M ${side * hip} ${top} L ${x} -4" stroke="${C.leg}" stroke-width="${6 * S}" stroke-linecap="round" fill="none"/>
      <g data-t="transform=translate(${x} 0)">
        <path d="M -9 2 Q -10 -6 -4 -6 M 0 3 Q 0 -6 0 -6 M 9 2 Q 10 -6 4 -6" stroke="${C.ink}" stroke-width="3" stroke-linecap="round" fill="none"/>
        <ellipse cx="0" cy="-4" rx="8" ry="5" fill="${C.leg}"/>
      </g>`;
  };
  const perch = [-1, 1].map((side) => `<path d="M ${side * hip} ${top} L ${side * 13} -4" stroke="${C.leg}" stroke-width="${6 * S}" stroke-linecap="round"/>
      <g transform="translate(${side * 13} 0)"><path d="M -9 2 Q -10 -6 -4 -6 M 0 3 Q 0 -6 0 -6 M 9 2 Q 10 -6 4 -6" stroke="${C.ink}" stroke-width="3" stroke-linecap="round" fill="none"/>
      <ellipse cx="0" cy="-4" rx="8" ry="5" fill="${C.leg}"/></g>`).join('');
  return `<g class="${p}-legs">${foot(-1)}${foot(1)}</g><g class="${p}-plegs">${perch}</g>`;
}

// Trajet du point de prise (serres) jusqu'à la pose de l'objet.
const PERCH_X = [OX + GAP, 1]; // x = OX + GAP + hw
const FLY = [
  [0, 410, 150],
  [0.5, 330, 260],
  [1.0, 190, [TOP - 70, -1]],
  [T_SET, OX, [TOP - 4, -1]],
];
// (la prise est à gy ≈ -hh au-dessus de la base : y de prise = TOP - hh quand l'objet est posé)

function css() {
  let c = L.actorsCss() + L.checkButtonCss();
  // vol : courbe douce, léger tangage ; y peut dépendre de hh (la prise est au sommet de l'objet)
  const fly = [];
  const P = FLY;
  for (let i = 0; i < P.length - 1; i += 1) {
    const [t0, x0, y0] = P[i];
    const [t1, x1, y1] = P[i + 1];
    const n = 6;
    for (let j = i === 0 ? 0 : 1; j <= n; j += 1) {
      const u = j / n;
      const e = i === P.length - 2 ? Math.sin((u * Math.PI) / 2) : u;
      fly.push([t0 + (t1 - t0) * u, { x: L.lin(x0, x1, e), y: L.lin(y0, y1, e), r: i === 0 ? -8 * (1 - u) : i === 1 ? 6 * Math.sin(u * Math.PI) : 0 }, 'l']);
    }
  }
  const hold = [...fly, [T_REL, { x: OX, y: [TOP - 4, -1] }, 'o']];
  // après le lâcher : petit envol vers la droite, puis il se perche (x dépend de la largeur de l'objet)
  const after = [
    [T_REL + 0.14, { x: [OX + GAP * 0.6, 0.6], y: [TOP - 40, -0.75], r: 4 }, 'io'],
    [T_PERCH, { x: PERCH_X, y: TOP, r: 0 }, 'o'],
  ];
  c += anim('ag-pos', [...hold, ...after]);
  // l'objet : suit les serres jusqu'à la pose, puis reste sur le rocher
  c += anim('ag-obj', [...fly.map(([t, p, e]) => [t, { ...p, r: (p.r || 0) * 0.6 }, e]), [T_SET + 0.06, { x: OX, y: [TOP + 3, -1], sx: 1.05, sy: 0.93 }, 'o'], [T_SET + 0.18, { y: [TOP - 4, -1], sx: 1, sy: 1 }]]);
  // ailes : planent (grand angle, petites ondulations), freinent, se replient en se perchant
  const wing = (k) => [
    [0, { r: -6 * k, sx: 1 }],
    [0.3, { r: 4 * k }, 'io'],
    [0.6, { r: -6 * k }, 'io'],
    [0.9, { r: 4 * k }, 'io'],
    [1.1, { r: -18 * k }, 'io'],
    [1.24, { r: 14 * k }, 'io'],
    [1.38, { r: -14 * k }, 'io'],
    [1.52, { r: 16 * k }, 'io'],
    [1.66, { r: -10 * k }, 'io'],
    [T_PERCH, { r: 78 * k, sx: 0.42, sy: 0.82 }, 'back'],
    [2.05, { r: 82 * k }, 'io'],
    [2.25, { r: 76 * k }],
  ];
  c += anim('ag-e-wingL', wing(1).map(([t, p, e]) => [t, { ...p }, e]));
  c += anim('ag-e-wingR', wing(1));
  c += anim('ag-e-squash', [[0, { sx: 1, sy: 1 }], [T_PERCH - 0.04, { sx: 0.96, sy: 1.04 }, 'o'], [T_PERCH + 0.04, { sx: 1.08, sy: 0.92 }, 'o'], [T_PERCH + 0.16, { sx: 1, sy: 1 }], [2.1, { sx: 1, sy: 1 }, 'io'], [2.24, { sx: 1.02, sy: 1.04 }, 'io'], [2.4, { sx: 1, sy: 1 }]]);
  c += anim('ag-e-head', [[0, { r: 0 }], [1.9, { r: 0 }, 'io'], [2.1, { r: -10 }, 'io'], [2.4, { r: -6 }, 'io'], [2.7, { r: -10 }]], { origin: '0 -80px' });
  c += anim('ag-shadow', [[0, { o: 0, x: OX, s: 0.4 }], [0.9, { o: 0, s: 0.5 }, 'io'], [T_SET, { o: 1, s: 1 }]]);
  c += anim('ag-pshadow', [[0, { o: 0, x: PERCH_X, s: 0.3 }], [T_REL + 0.1, { o: 0, s: 0.4 }, 'io'], [T_PERCH, { o: 1, s: 1 }]]);
  c += L.happyCss('ag-e', 2.15);
  c += anim('ag-e-legs', [[0, { o: 1 }], [T_REL + 0.06, { o: 1 }, 'step'], [T_REL + 0.08, { o: 0 }]]);
  c += anim('ag-e-plegs', [[0, { o: 0 }], [T_REL + 0.06, { o: 0 }, 'step'], [T_REL + 0.08, { o: 1 }]]);
  c += puffAnim('ag-d', T_SET + 0.02);
  c += sparkleAnim('ag-sp1', 2.2, 2.85) + sparkleAnim('ag-sp2', 2.3, 2.95) + sparkleAnim('ag-sp3', 2.25, 3.0);
  return c;
}

function svg() {
  return `
  ${L.mountainBackground({ rocks: false })}
  ${L.rock(70, 790, 1.5)}${L.rock(352, 778, 1.2)}${L.rock(300, 520, 0.9)}${L.rock(60, 520, 0.8)}
  ${bigRock(...ROCK)}
  <g class="actors">
    <g transform="translate(0 ${TOP + 1})"><g class="ag-shadow"><ellipse data-t="rx={hw*0.9+6}" rx="60" ry="7" fill="rgba(40,50,60,.22)"/></g></g>
    <g transform="translate(0 ${TOP + 1})"><g class="ag-pshadow"><ellipse rx="34" ry="6" fill="rgba(40,50,60,.22)"/></g></g>
    ${puff('ag-d', OX, TOP, 0.9, '#eef2f5')}
    <g class="ag-pos"><g transform="scale(${S})">${eagle('ag-e')}</g></g>
    <g class="ag-obj"><g data-t="transform=translate(0 {-gy})">${objSlot()}</g></g>
    <g class="ag-pos">${legs('ag-e')}</g>
    ${sparkle('ag-sp1', 60, 470, 1.3)}${sparkle('ag-sp2', 370, 440, 1.1)}${sparkle('ag-sp3', 250, 380, 1.6)}
    ${L.checkButton()}
  </g>`;
}

export const scene: SceneModule = {
  title: 'Fête de la montagne · aigle',
  box: BOX,
  svg,
  css,
};
