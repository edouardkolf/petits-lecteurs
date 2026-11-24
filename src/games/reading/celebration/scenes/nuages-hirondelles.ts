// @ts-nocheck — portage fidèle des maquettes JS validées (art en chaînes SVG) ; l'API publique est typée dans types.ts.
// Nuages · hirondelles : trois hirondelles portent l'objet avec des petits rubans, traversent le ciel en vague,
// le déposent sur un gros nuage, lâchent les rubans (il reste un nœud) et volettent au-dessus.
import * as L from '../lib';
import type { SceneModule } from '../types';
const { anim, sparkle, sparkleAnim, objSlot, platformCloud } = L;

const S = 1.45;
const CLOUD = [206, 646, 320];
const BASE_Y = CLOUD[1] - 2;
const T_SET = 1.5;
const T_REL = 1.62;
const BOX = [180, 108];
// oiseaux (pieds) dans le repère de l'objet (base au centre) : [x, dy au-dessus du sommet]
const CARRY = [[-100, 66], [0, 100], [100, 66]];
const HOVER = [[-110, 100], [0, 140], [110, 100]];
const RIBBON = ['#ff8fb1', '#ffd45c', '#7fd8b6'];
const GRIP = ['gl', 'gc', 'gr'];
const C = { back: '#2c4c8f', wing: '#223d78', belly: '#ffffff', face: '#e4673f', ink: '#1d2540' };

/** Hirondelle de profil, tournée vers la droite ; repère : ses pattes (point d'attache du ruban). */
function swallow(i) {
  return `<g transform="scale(${S})">
    <path d="M -12 -12 L -46 -2 L -32 -12 L -48 -22 L -12 -18 Z" fill="${C.back}"/>
    <ellipse cx="0" cy="-14" rx="18" ry="11" fill="${C.back}"/>
    <ellipse cx="3" cy="-9" rx="13" ry="6.5" fill="${C.belly}"/>
    <circle cx="14" cy="-20" r="10" fill="${C.back}"/>
    <ellipse cx="19" cy="-15" rx="6.5" ry="5" fill="${C.face}"/>
    <circle cx="20" cy="-27" r="3" fill="${C.face}"/>
    <path d="M 23 -22 L 29 -19.5 L 23 -17.5 Z" fill="${C.ink}"/>
    <g class="hi-eyes"><circle cx="16.5" cy="-22" r="2.9" fill="${C.ink}"/><circle cx="17.4" cy="-23" r="1" fill="#fff"/></g>
    <g class="hi-happy" opacity="0"><path d="M 13.8 -21.5 Q 16.5 -25 19.2 -21.5" stroke="${C.ink}" stroke-width="1.6" stroke-linecap="round" fill="none"/></g>
    <circle cx="10" cy="-14" r="2.6" fill="#ff9aa9" opacity=".6"/>
    <path d="M -2 -3 L -2 0 M 2 -3 L 2 0" stroke="${C.ink}" stroke-width="1.6" stroke-linecap="round"/>
    <g transform="translate(-2 -20)"><g class="hi-wing${i}">
      <path d="M 0 0 C -8 -14 -22 -26 -38 -30 C -28 -18 -16 -6 -2 4 Z" fill="${C.wing}"/>
      <path d="M -6 -6 C -12 -14 -20 -20 -28 -24" stroke="#4a6ab0" stroke-width="2" stroke-linecap="round" fill="none"/>
    </g></g>
  </g>`;
}

function bow() {
  return `<g class="hi-bow">
    <path d="M 0 0 C -10 -12 -24 -12 -22 0 C -20 10 -8 6 0 0 Z" fill="${RIBBON[0]}"/>
    <path d="M 0 0 C 10 -12 24 -12 22 0 C 20 10 8 6 0 0 Z" fill="${RIBBON[0]}"/>
    <path d="M -2 2 L -10 16 L -5 14 L -3 18 Z M 2 2 L 10 16 L 5 14 L 3 18 Z" fill="#f4729a"/>
    <circle r="5" fill="#f4729a"/>
  </g>`;
}

const WAY = [
  [0, -64, 400],
  [0.55, 110, 370],
  [1.05, 236, 470],
  [T_SET, CLOUD[0], BASE_Y],
];

function css() {
  let c = L.actorsCss() + L.checkButtonCss();
  // trajet du groupe (objet + rubans + oiseaux) : vague douce, puis descente sur le nuage
  const fr = [];
  for (let i = 0; i < WAY.length - 1; i += 1) {
    const [t0, x0, y0] = WAY[i];
    const [t1, x1, y1] = WAY[i + 1];
    const n = 6;
    for (let j = i === 0 ? 0 : 1; j <= n; j += 1) {
      const u = j / n;
      const e = i === WAY.length - 2 ? Math.sin((u * Math.PI) / 2) : (1 - Math.cos(u * Math.PI)) / 2;
      const ey = i === WAY.length - 2 ? e : (1 - Math.cos(u * Math.PI)) / 2;
      fr.push([t0 + (t1 - t0) * u, { x: x0 + (x1 - x0) * e, y: y0 + (y1 - y0) * ey, r: i === 0 ? 3 * Math.sin(u * Math.PI) : i === 1 ? -3 * Math.sin(u * Math.PI) : 0 }, 'l']);
    }
  }
  fr.push([T_SET + 0.06, { y: BASE_Y + 4 }, 'io'], [T_SET + 0.2, { y: BASE_Y }]);
  c += anim('hi-flock', fr);
  c += anim('hi-osq', [[0, { sx: 1, sy: 1 }], [T_SET - 0.02, { sx: 1, sy: 1 }, 'o'], [T_SET + 0.06, { sx: 1.05, sy: 0.93 }, 'io'], [T_SET + 0.2, { sx: 1, sy: 1 }]]);
  // oiseaux : en formation, puis ils lâchent et montent former un arc au-dessus
  CARRY.forEach(([x, dy], i) => {
    const [hx, hdy] = HOVER[i];
    c += anim(`hi-b${i}`, [
      [0, { x, y: [-dy, -1] }],
      [0.4 + i * 0.1, { y: [-dy - 6, -1] }, 'io'],
      [0.9 + i * 0.1, { y: [-dy + 4, -1] }, 'io'],
      [T_REL, { x, y: [-dy, -1] }, 'io'],
      [T_REL + 0.45 + i * 0.05, { x: hx, y: [-hdy, -1] }, 'io'],
      [2.4 + i * 0.1, { y: [-hdy - 8, -1] }, 'io'],
      [3.0 + i * 0.1, { y: [-hdy, -1] }, 'io'],
      [3.6, { y: [-hdy - 6, -1] }],
    ]);
    const flap = [];
    for (let t = 0, k = 0; t <= 4.001; t += 0.16, k += 1) flap.push([Math.min(4, t + i * 0.05), { r: k % 2 ? 40 : -18 }, 'io']);
    c += anim(`hi-wing${i}`, flap);
  });
  c += anim('hi-rib', [[0, { o: 1 }], [T_REL, { o: 1 }, 'l'], [T_REL + 0.2, { o: 0 }]]);
  c += anim('hi-bow', [[0, { s: 0, o: 0 }], [T_REL + 0.05, { s: 0, o: 0 }, 'back'], [T_REL + 0.3, { s: 1, o: 1 }]]);
  c += L.happyCss('hi', 2.15);
  c += anim('hi-shadow', [[0, { o: 0, s: 0.4 }], [1.1, { o: 0, s: 0.5 }, 'io'], [T_SET, { o: 1, s: 1 }]]);
  c += sparkleAnim('hi-sp1', 2.2, 2.85) + sparkleAnim('hi-sp2', 2.3, 2.95) + sparkleAnim('hi-sp3', 2.25, 3.0);
  return c;
}

function svg() {
  const ribbons = CARRY.map(([x, dy], i) => {
    const g = GRIP[i];
    return `<path data-t="d=M ${x} {-hh-${dy}} Q {(${x}+${g})/2+${i === 1 ? 10 : -8 + i * 8}} {(-hh-${dy}+gy)/2} {${g}} {gy}" stroke="${RIBBON[i]}" stroke-width="5" stroke-linecap="round" fill="none"/>
      <circle data-t="cx={${g}}|cy={gy}" r="4.5" fill="${RIBBON[i]}"/>`;
  }).join('');
  return `
  ${L.cloudsBackground({ skip: [3, 4] })}
  <g transform="translate(${CLOUD[0]} ${CLOUD[1]})">${platformCloud(CLOUD[2])}</g>
  <g class="actors">
    <g transform="translate(${CLOUD[0]} ${BASE_Y + 4})"><g class="hi-shadow"><ellipse data-t="rx={hw*0.9+8}" rx="60" ry="7" fill="#b9cfe9" opacity=".8"/></g></g>
    <g class="hi-flock">
      <g class="hi-osq">${objSlot()}</g>
      <g class="hi-rib">${ribbons}</g>
      <g data-t="transform=translate({gc} {gy+2}) scale(1.35)">${bow()}</g>
      ${CARRY.map((_, i) => `<g class="hi-b${i}">${swallow(i)}</g>`).join('')}
    </g>
    ${sparkle('hi-sp1', 60, 560, 1.3)}${sparkle('hi-sp2', 360, 560, 1.1)}${sparkle('hi-sp3', 330, 300, 1.5)}
  </g>
  ${L.seaOfClouds()}
  <g class="actors">${L.checkButton()}</g>`;
}

export const scene: SceneModule = {
  title: 'Fête des nuages · hirondelles',
  box: BOX,
  svg,
  css,
};
