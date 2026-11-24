// @ts-nocheck — portage fidèle des maquettes JS validées (art en chaînes SVG) ; l'API publique est typée dans types.ts.
// Montagne · bouquetin : l'objet posé en équilibre sur ses grandes cornes recourbées, le bouquetin bondit
// de rocher en rocher jusqu'au plus haut, puis prend la pose, tout fier.
import * as L from '../lib';
import type { SceneModule } from '../types';
const { anim, sparkle, sparkleAnim, objSlot, bigRock, puff, puffAnim } = L;

const S = 1.25;
const ROCKS = [
  // [x du sommet, y du sommet, largeur, hauteur]
  [70, 714, 170, 78],
  [170, 632, 150, 76],
  [256, 550, 170, 84],
];
const STAND = [[-34, 708], ...ROCKS.map(([x, y]) => [x - 4, y + 1])];

const BOX = [180, 108];
let HORN; // sommet des cornes (px), fixé après la génération des cornes
const PIV = [30 * S, -80 * S]; // pivot de la tête (px)
const HEAD = [[1.5, 0], [1.75, -9], [2.0, 0], [2.16, 4], [2.32, 0]];
const LEAPS = [
  [0, 0.38, 0, 1, 70],
  [0.52, 0.92, 1, 2, 90],
  [1.06, 1.46, 2, 3, 90],
];
const LAST = STAND[3];

const C = {
  body: '#a38b6b', // gris-brun
  back: '#80694f',
  belly: '#e6d8c0',
  leg: '#5c4a38',
  hoof: '#2f241a',
  horn: '#8e7a5c',
  hornLt: '#ab9673',
  hornFar: '#6f5d45',
  ridge: '#6a5840',
  ink: '#3d2c1e',
  muzzle: '#cdb38f',
};

/** Corne épaisse, en arc vers l'arrière, bourrelets sur le bord avant (génération par échantillonnage). */
const HORN_PTS = (() => {
  const B = [50, -116];
  const C1 = [56, -170];
  const C2 = [10, -200];
  const E = [-28, -176];
  const bez = (t) => {
    const u = 1 - t;
    return [0, 1].map((k) => u * u * u * B[k] + 3 * u * u * t * C1[k] + 3 * u * t * t * C2[k] + t * t * t * E[k]);
  };
  const n = 28;
  const outer = [];
  const inner = [];
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    const p = bez(t);
    const q = bez(Math.min(1, t + 0.01));
    const r = bez(Math.max(0, t - 0.01));
    const dx = q[0] - r[0];
    const dy = q[1] - r[1];
    const l = Math.hypot(dx, dy);
    const nx = -dy / l; // normale vers l extérieur (côté avant/haut de l arc)
    const ny = dx / l;
    const w = 11 * (1 - t) + 2.5 * t;
    const bump = i > 1 && i < n - 2 && i % 3 === 0 ? 3.2 * (1 - t * 0.6) : 0;
    outer.push([p[0] + nx * (w + bump), p[1] + ny * (w + bump)]);
    inner.push([p[0] - nx * w, p[1] - ny * w]);
  }
  return { outer, inner, ridges: [4, 7, 10, 13, 16, 19, 22].map((i) => [outer[i], inner[i]]) };
})();
const HORN_TOP = HORN_PTS.outer.reduce((m, p) => (p[1] < m[1] ? p : m));

function horn(dx, dy, fill, ridges) {
  const { outer, inner } = HORN_PTS;
  const d = `M ${outer.map(([x, y]) => `${L.r2(x)} ${L.r2(y)}`).join(' L ')} L ${inner.slice().reverse().map(([x, y]) => `${L.r2(x)} ${L.r2(y)}`).join(' L ')} Z`;
  const rid = ridges
    ? HORN_PTS.ridges.map(([o, i]) => `<path d="M ${L.r2(o[0])} ${L.r2(o[1])} Q ${L.r2((o[0] + i[0]) / 2 + 2)} ${L.r2((o[1] + i[1]) / 2 + 2)} ${L.r2(i[0])} ${L.r2(i[1])}" stroke="${C.ridge}" stroke-width="2.2" stroke-linecap="round" fill="none"/>`).join('')
    : '';
  return `<g transform="translate(${dx} ${dy})"><path d="${d}" fill="${fill}" stroke="${fill}" stroke-width="2" stroke-linejoin="round"/>
    ${ridges ? `<path d="M ${outer.slice(2, 18).map(([x, y]) => `${L.r2(x - 2)} ${L.r2(y + 3)}`).join(' L ')}" stroke="${C.hornLt}" stroke-width="3" stroke-linecap="round" fill="none"/>` : ''}${rid}</g>`;
}

function leg(x, cls, far) {
  return `<g transform="translate(${x} -48)"><g class="${cls}">
    <path d="M 0 0 L 0 24" stroke="${far ? C.back : C.body}" stroke-width="15" stroke-linecap="round"/>
    <path d="M 0 20 L 0 42" stroke="${far ? '#463828' : C.leg}" stroke-width="11" stroke-linecap="round"/>
    <path d="M -6.5 41 L 6.5 41 L 7 48 L -6.5 48 Z" fill="${C.hoof}" stroke="${C.hoof}" stroke-width="2" stroke-linejoin="round"/>
  </g></g>`;
}

/** Bouquetin des Alpes de profil, tourné vers la droite ; repère : entre les sabots. */
function ibex(p) {
  return `<g class="${p}-squash">
    ${leg(-26, `${p}-legB2`, true)}${leg(34, `${p}-legF2`, true)}
    <g transform="translate(-52 -80)"><g class="${p}-tail"><path d="M 0 0 C -7 -4 -9 -11 -6 -15 C -2 -10 2 -5 3 0 Z" fill="${C.back}"/></g></g>
    <path d="M -56 -64 C -58 -90 -32 -100 0 -98 C 28 -98 46 -90 52 -74 C 56 -58 48 -42 32 -40 L -40 -40 C -54 -42 -56 -52 -56 -64 Z" fill="${C.body}"/>
    <path d="M -54 -72 C -48 -92 -26 -98 0 -97 C 22 -97 38 -93 46 -84 C 30 -88 12 -88 -6 -86 C -26 -84 -44 -80 -54 -72 Z" fill="${C.back}"/>
    <path d="M -44 -46 C -20 -38 14 -38 36 -46 C 30 -40 14 -38 -4 -38 C -24 -38 -38 -40 -44 -46 Z" fill="${C.leg}" opacity=".55"/>
    ${leg(-36, `${p}-legB`, false)}${leg(24, `${p}-legF`, false)}
    <g class="${p}-head">
      ${horn(-9, 3, C.hornFar, false)}
      ${horn(0, 0, C.horn, true)}
      <path d="M 18 -88 C 28 -104 40 -116 50 -122 L 70 -110 C 60 -98 50 -80 44 -60 Z" fill="${C.body}"/>
      <path d="M 40 -118 C 34 -120 28 -118 24 -112 C 30 -110 36 -110 42 -112 Z" fill="${C.back}"/>
      <ellipse cx="62" cy="-114" rx="19" ry="16" fill="${C.body}"/>
      <ellipse cx="77" cy="-106" rx="12" ry="10" fill="${C.muzzle}"/>
      <path d="M 66 -97 C 70 -92 70 -86 66 -82 C 63 -86 62 -92 63 -97 Z" fill="${C.leg}"/>
      <ellipse cx="85.5" cy="-109" rx="2.6" ry="2" fill="${C.ink}"/>
      <path d="M 79 -101 Q 83 -99 86 -102" stroke="${C.ink}" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      <circle cx="68" cy="-104" r="4.2" fill="#ff8f7a" opacity=".45"/>
      <g class="${p}-eyes"><circle cx="63" cy="-118" r="4.9" fill="${C.ink}"/><circle cx="64.6" cy="-119.8" r="1.7" fill="#fff"/></g>
      <g class="${p}-happy" opacity="0"><path d="M 58.5 -117 Q 63 -123 67.5 -117" stroke="${C.ink}" stroke-width="2.6" stroke-linecap="round" fill="none"/></g>
    </g>
  </g>`;
}

HORN = [HORN_TOP[0] * S, (HORN_TOP[1] + 2) * S];

/** Échantillonne la position (pieds) et l'assiette (r) sur toute la durée. */
function track() {
  const pts = [];
  const push = (t, x, y, r) => pts.push([t, x, y, r]);
  push(0, ...STAND[0], 0);
  for (const [t0, t1, a, b, h] of LEAPS) {
    const [x0, y0] = STAND[a];
    const [x1, y1] = STAND[b];
    push(t0, x0, y0, 0);
    const n = 12;
    for (let i = 1; i <= n; i += 1) {
      const tau = i / n;
      const u = tau + (0.6 / (2 * Math.PI)) * Math.sin(2 * Math.PI * tau);
      const x = x0 + (x1 - x0) * u;
      const y = y0 + (y1 - y0) * u - 4 * h * u * (1 - u);
      const dy = y1 - y0 - 4 * h * (1 - 2 * u);
      const r = Math.max(-22, Math.min(22, ((Math.atan2(dy, x1 - x0) * 180) / Math.PI) * 0.4));
      push(t0 + (t1 - t0) * tau, x, y, i === n ? 0 : r);
    }
  }
  return pts;
}

function css() {
  let c = L.actorsCss() + L.checkButtonCss();
  const pts = track();
  c += anim('bq-pos', pts.map(([t, x, y, r]) => [t, { x, y, r }, 'l']));
  // l'objet suit le sommet des cornes (on fait tourner le décalage avec l'assiette), en restant presque droit
  c += anim(
    'bq-obj',
    pts.map(([t, x, y, r]) => {
      const a = (r * Math.PI) / 180;
      const ox = HORN[0] * Math.cos(a) - HORN[1] * Math.sin(a);
      const oy = HORN[0] * Math.sin(a) + HORN[1] * Math.cos(a);
      return [t, { x: x + ox, y: y + oy, r: r * 0.6 }, 'l'];
    }).concat(
      HEAD.map(([t, r]) => {
        // l'objet suit les cornes quand la tête se redresse
        const a = (r * Math.PI) / 180;
        const vx = HORN[0] - PIV[0];
        const vy = HORN[1] - PIV[1];
        return [t, { x: LAST[0] + PIV[0] + vx * Math.cos(a) - vy * Math.sin(a), y: LAST[1] + PIV[1] + vx * Math.sin(a) + vy * Math.cos(a), r: r * 0.5 }, 'io'];
      }),
    ),
  );
  const sq = [[0, { sx: 1, sy: 1 }]];
  for (const [t0, t1] of LEAPS) {
    sq.push([t1 - 0.02, { sx: 0.97, sy: 1.04 }, 'o'], [t1 + 0.05, { sx: 1.08, sy: 0.9 }, 'o'], [t1 + 0.16, { sx: 1, sy: 1 }]);
    if (t0 > 0.3) sq.push([t0 - 0.1, { sx: 1, sy: 1 }, 'io'], [t0 - 0.02, { sx: 1.05, sy: 0.92 }, 'o'], [t0 + 0.06, { sx: 0.97, sy: 1.04 }, 'io'], [t0 + 0.16, { sx: 1, sy: 1 }]);
  }
  c += anim('bq-b-squash', sq);
  // pattes : repliées en l'air
  const legs = (fold) => {
    const fr = [[0, { r: 0 }]];
    for (const [t0, t1] of LEAPS) fr.push([t0, { r: 0 }, 'o'], [t0 + 0.1, { r: fold }, 'io'], [t1 - 0.12, { r: fold * 0.3 }, 'io'], [t1, { r: 0 }]);
    return fr;
  };
  c += anim('bq-b-legF', legs(-55)) + anim('bq-b-legF2', legs(-45)) + anim('bq-b-legB', legs(40)) + anim('bq-b-legB2', legs(32));
  c += anim('bq-b-head', [[0, { r: 0 }], ...HEAD.map(([t, r]) => [t, { r }, 'io'])], { origin: `${PIV[0] / S}px ${PIV[1] / S}px` });
  c += anim('bq-b-tail', [[0, { r: 0 }], [1.5, { r: 0 }], [1.6, { r: -25 }], [1.7, { r: 10 }], [1.8, { r: -25 }], [1.9, { r: 0 }], [2.4, { r: 0 }], [2.5, { r: -25 }], [2.6, { r: 10 }], [2.7, { r: 0 }]]);
  c += L.happyCss('bq-b', 2.15);
  c += puffAnim('bq-d1', LEAPS[1][1]) + puffAnim('bq-d2', LEAPS[2][1]);
  c += sparkleAnim('bq-sp1', 2.2, 2.85) + sparkleAnim('bq-sp2', 2.3, 2.95) + sparkleAnim('bq-sp3', 2.25, 3.0);
  return c;
}

function svg() {
  return `
  ${L.mountainBackground({ rocks: false })}
  ${L.rock(352, 778, 1.2)}${L.rock(300, 520, 0.9)}
  ${[...ROCKS].reverse().map(([x, y, w, h], i) => bigRock(x, y, w, h, { flip: i === 1 })).join('')}
  <g class="actors">
    ${puff('bq-d1', STAND[2][0], STAND[2][1], 0.8, '#eef2f5')}${puff('bq-d2', STAND[3][0], STAND[3][1], 0.8, '#eef2f5')}
    <g class="bq-pos"><g transform="scale(${S})">${ibex('bq-b')}</g></g>
    <g class="bq-obj">${objSlot()}</g>
    ${sparkle('bq-sp1', 70, 520, 1.3)}${sparkle('bq-sp2', 380, 420, 1.1)}${sparkle('bq-sp3', 150, 380, 1.6)}
    ${L.checkButton()}
  </g>`;
}

export const scene: SceneModule = {
  title: 'Fête de la montagne · bouquetin',
  box: BOX,
  svg,
  css,
};
