// @ts-nocheck — portage fidèle des maquettes JS validées (art en chaînes SVG) ; l'API publique est typée dans types.ts.
// Nuages · licorne : l'objet en équilibre sur son dos, la licorne saute de nuage en nuage ;
// de petites étincelles douces naissent à chaque atterrissage. Elle finit en haut, toute fière.
import * as L from '../lib';
import type { SceneModule } from '../types';
const { anim, sparkle, sparkleAnim, objSlot, platformCloud } = L;

const S = 1.4;
const CLOUDS = [
  // [x, y du dessus, largeur]
  [64, 716, 230],
  [180, 626, 230],
  [276, 536, 250],
];
const STAND = [[-44, 708], ...CLOUDS.map(([x, y]) => [x, y + 2])];
const LEAPS = [
  [0, 0.36, 0, 1, 80],
  [0.52, 0.92, 1, 2, 100],
  [1.08, 1.5, 2, 3, 100],
];
const LAST = STAND[3];
const BACK = [-16 * S, -86 * S]; // point d'appui sur le dos (px)
const SHIFT = '{-Math.max(0,hw-10)}'; // un objet large glisse vers la croupe pour ne pas cacher la tête
const PIV = [30 * S, -84 * S];
const HEAD = [[1.6, 0], [1.85, -10], [2.1, 0], [2.3, 4], [2.5, 0]];
const BOX = [180, 108];
const C = {
  body: '#ffffff',
  shade: '#ebe4f8',
  hoof: '#b9a3e6',
  ink: '#3d2c1e',
  muzzle: '#ffe1ea',
  horn: '#ffd45c',
  hornDk: '#efae2a',
  mane: ['#ff9ec4', '#c9a6ff', '#8fd0ff', '#9eeccb', '#ffe08a'],
};

function leg(x, cls, far) {
  return `<g transform="translate(${x} -46)"><g class="${cls}">
    <rect x="-5.5" y="-4" width="11" height="44" rx="5.5" fill="${far ? C.shade : C.body}" class="un-ol"/>
    <path d="M -6 38 L 6 38 L 6.5 46 L -6.5 46 Z" fill="${C.hoof}" stroke="${C.hoof}" stroke-width="2" stroke-linejoin="round"/>
  </g></g>`;
}

/** Licorne de profil, tournée vers la droite ; repère : entre les sabots. */
function unicorn(p) {
  const M = C.mane;
  return `<g class="${p}-squash">
    ${leg(-26, `${p}-legB2`, true)}${leg(32, `${p}-legF2`, true)}
    <g transform="translate(-50 -72)"><g class="${p}-tail">
      <path d="M 0 0 C -22 -4 -32 14 -26 34 C -20 24 -12 16 0 10 Z" fill="${M[0]}"/>
      <path d="M 0 4 C -16 6 -22 24 -16 42 C -10 30 -4 20 4 12 Z" fill="${M[1]}"/>
      <path d="M 2 8 C -8 14 -10 30 -4 46 C 0 34 4 24 8 14 Z" fill="${M[2]}"/>
    </g></g>
    <ellipse cx="-6" cy="-62" rx="47" ry="27" fill="${C.body}" class="un-ol"/>
    <path d="M -50 -54 C -40 -38 20 -34 40 -50 C 36 -38 20 -34 -6 -34 C -30 -34 -46 -42 -50 -54 Z" fill="${C.shade}"/>
    ${leg(-36, `${p}-legB`, false)}${leg(24, `${p}-legF`, false)}
    <g class="${p}-head">
      <path d="M 18 -80 C 26 -96 34 -112 44 -122 L 66 -112 C 56 -100 46 -82 40 -60 Z" fill="${C.body}" class="un-ol"/>
      <ellipse cx="56" cy="-116" rx="22" ry="18" fill="${C.body}" class="un-ol"/>
      <path d="M 22 -78 C 30 -94 38 -108 46 -118 L 62 -110 C 52 -98 44 -82 38 -62 Z" fill="${C.body}"/>
      <ellipse cx="22" cy="-68" rx="19" ry="14" fill="${C.body}"/>
      <ellipse cx="72" cy="-107" rx="13" ry="11" fill="${C.muzzle}"/>
      <ellipse cx="78" cy="-110" rx="1.8" ry="2.4" fill="#e59ab0"/>
      <path d="M 70 -101 Q 75 -98 80 -102" stroke="${C.ink}" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      <path d="M 38 -128 L 40 -146 L 50 -132 Z" fill="${C.body}" class="un-ol"/><path d="M 41 -131 L 42 -141 L 47 -133 Z" fill="${C.muzzle}"/>
      <path d="M 54 -134 L 66 -176 L 64 -132 Z" fill="${C.horn}"/>
      <path d="M 55.5 -139 L 64.5 -142 M 57 -148 L 64.8 -151 M 59 -157 L 65.2 -160 M 61.5 -166 L 65.6 -168" stroke="${C.hornDk}" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="62" cy="-104" r="4.4" fill="#ff9ab0" opacity=".55"/>
      <g class="${p}-eyes"><circle cx="58" cy="-120" r="5.4" fill="${C.ink}"/><circle cx="59.8" cy="-122" r="1.9" fill="#fff"/>
        <path d="M 55 -125 l -3 -3 M 58 -126 l -1 -4" stroke="${C.ink}" stroke-width="1.6" stroke-linecap="round"/></g>
      <g class="${p}-happy" opacity="0"><path d="M 53 -119 Q 58 -125 63 -119" stroke="${C.ink}" stroke-width="2.6" stroke-linecap="round" fill="none"/></g>
      <g class="${p}-mane">
        <path d="M 46 -132 C 34 -134 24 -124 22 -112 C 30 -116 38 -120 46 -122 Z" fill="${M[0]}"/>
        <path d="M 40 -122 C 26 -122 16 -110 14 -96 C 22 -102 32 -108 40 -110 Z" fill="${M[1]}"/>
        <path d="M 34 -110 C 20 -108 10 -96 8 -82 C 16 -88 26 -94 32 -96 Z" fill="${M[2]}"/>
        <path d="M 28 -96 C 16 -94 6 -84 4 -70 C 12 -76 20 -80 26 -82 Z" fill="${M[3]}"/>
        <path d="M 52 -134 C 52 -128 56 -124 62 -124 C 60 -130 56 -134 52 -134 Z" fill="${M[4]}"/>
      </g>
    </g>
  </g>`;
}

function track() {
  const pts = [[0, ...STAND[0], 0]];
  for (const [t0, t1, a, b, h] of LEAPS) {
    const [x0, y0] = STAND[a];
    const [x1, y1] = STAND[b];
    pts.push([t0, x0, y0, 0]);
    const n = 12;
    for (let i = 1; i <= n; i += 1) {
      const tau = i / n;
      const u = tau + (0.6 / (2 * Math.PI)) * Math.sin(2 * Math.PI * tau);
      const x = x0 + (x1 - x0) * u;
      const y = y0 + (y1 - y0) * u - 4 * h * u * (1 - u);
      const dy = y1 - y0 - 4 * h * (1 - 2 * u);
      const r = Math.max(-20, Math.min(20, ((Math.atan2(dy, x1 - x0) * 180) / Math.PI) * 0.35));
      pts.push([t0 + (t1 - t0) * tau, x, y, i === n ? 0 : r]);
    }
  }
  return pts;
}

function css() {
  let c = L.actorsCss() + L.checkButtonCss();
  c += '.un-ol{stroke:#d3c4ef;stroke-width:2.6px}\n';
  const pts = track();
  c += anim('un-pos', pts.map(([t, x, y, r]) => [t, { x, y, r }, 'l']));
  const rot = (x, y, r, [bx, by]) => {
    const a = (r * Math.PI) / 180;
    return [x + bx * Math.cos(a) - by * Math.sin(a), y + bx * Math.sin(a) + by * Math.cos(a)];
  };
  const objFr = pts.map(([t, x, y, r]) => {
    const [ox, oy] = rot(x, y, r, BACK);
    return [t, { x: ox, y: oy, r: r * 0.8 }, 'l'];
  });
  // petit rebond de l'objet à chaque atterrissage
  for (const [, t1] of LEAPS) {
    const i = objFr.findIndex((f) => f[0] >= t1 - 1e-6);
    const base = objFr[i][1];
    objFr.push([t1 + 0.08, { ...base, y: base.y - 10 }, 'io'], [t1 + 0.16, { ...base }, 'l']);
  }
  objFr.sort((a, b) => a[0] - b[0]);
  // les « suivantes » du saut d'après repartent de la bonne place : on retire ce qui chevauche
  const clean = objFr.filter((f, i, arr) => !(i > 0 && Math.abs(f[0] - arr[i - 1][0]) < 1e-6));
  c += anim('un-obj', clean);
  const sq = [[0, { sx: 1, sy: 1 }]];
  for (const [t0, t1] of LEAPS) {
    if (t0 > 0.3) sq.push([t0 - 0.1, { sx: 1, sy: 1 }, 'io'], [t0 - 0.02, { sx: 1.05, sy: 0.92 }, 'o'], [t0 + 0.06, { sx: 0.97, sy: 1.04 }, 'io'], [t0 + 0.16, { sx: 1, sy: 1 }]);
    sq.push([t1 - 0.02, { sx: 0.97, sy: 1.04 }, 'o'], [t1 + 0.05, { sx: 1.07, sy: 0.92 }, 'o'], [t1 + 0.16, { sx: 1, sy: 1 }]);
  }
  c += anim('un-u-squash', sq);
  const legs = (fold) => {
    const fr = [[0, { r: 0 }]];
    for (const [t0, t1] of LEAPS) fr.push([t0, { r: 0 }, 'o'], [t0 + 0.1, { r: fold }, 'io'], [t1 - 0.12, { r: fold * 0.3 }, 'io'], [t1, { r: 0 }]);
    return fr;
  };
  c += anim('un-u-legF', legs(-55)) + anim('un-u-legF2', legs(-45)) + anim('un-u-legB', legs(40)) + anim('un-u-legB2', legs(32));
  c += anim('un-u-tail', [[0, { r: 0 }], [0.4, { r: 10 }, 'io'], [0.9, { r: -6 }, 'io'], [1.4, { r: 10 }, 'io'], [1.9, { r: -8 }, 'io'], [2.4, { r: 6 }, 'io'], [2.9, { r: -4 }, 'io'], [3.4, { r: 0 }]]);
  c += anim('un-u-mane', [[0, { r: 0 }], [1.5, { r: 0 }, 'io'], [1.62, { r: -6 }, 'io'], [1.85, { r: 3 }, 'io'], [2.1, { r: 0 }]], { origin: '40px -110px' });
  c += anim('un-u-head', [[0, { r: 0 }], ...HEAD.map(([t, r]) => [t, { r }, 'io'])], { origin: `${PIV[0] / S}px ${PIV[1] / S}px` });
  c += L.happyCss('un-u', 2.15);
  // étincelles douces à chaque atterrissage, en couleurs pastel
  LEAPS.forEach(([, t1], i) => {
    c += sparkleAnim(`un-l${i}a`, t1 - 0.02, t1 + 0.5) + sparkleAnim(`un-l${i}b`, t1 + 0.04, t1 + 0.56) + sparkleAnim(`un-l${i}c`, t1, t1 + 0.6);
  });
  c += sparkleAnim('un-sp1', 2.2, 2.85) + sparkleAnim('un-sp2', 2.3, 2.95) + sparkleAnim('un-sp3', 2.25, 3.0);
  return c;
}

function svg() {
  const landSparks = STAND.slice(1)
    .map(([x, y], i) => `${sparkle(`un-l${i}a`, x - 56, y - 14, 1.1, '#ffd6e8')}${sparkle(`un-l${i}b`, x + 52, y - 20, 0.9, '#e6dbff')}${sparkle(`un-l${i}c`, x + 4, y + 8, 0.8, '#fff6c2')}`)
    .join('');
  return `
  ${L.cloudsBackground({ skip: [3, 4] })}
  ${CLOUDS.map(([x, y, w]) => `<g transform="translate(${x} ${y})">${platformCloud(w)}</g>`).join('')}
  <g class="actors">
    <g class="un-pos"><g transform="scale(${S})">${unicorn('un-u')}</g></g>
    <g class="un-obj"><g data-t="transform=translate(${SHIFT} 0)">${objSlot()}</g></g>
    ${landSparks}
    ${sparkle('un-sp1', 70, 420, 1.3, '#ffd6e8')}${sparkle('un-sp2', 380, 360, 1.1, '#e6dbff')}${sparkle('un-sp3', 130, 300, 1.5)}
  </g>
  ${L.seaOfClouds()}
  <g class="actors">${L.checkButton()}</g>`;
}

export const scene: SceneModule = {
  title: 'Fête des nuages · licorne',
  box: BOX,
  svg,
  css,
};
