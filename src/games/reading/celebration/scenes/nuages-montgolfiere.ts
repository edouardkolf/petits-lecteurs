// @ts-nocheck — portage fidèle des maquettes JS validées (art en chaînes SVG) ; l'API publique est typée dans types.ts.
// Nuages : une petite montgolfière pilotée par un oiseau monte de la mer de nuages ; le M pend sous la nacelle et se balance.
import * as L from '../lib';
import type { SceneModule } from '../types';
const { anim, sparkle, sparkleAnim, objSlot, W, H } = L;

const K = 2.05; // échelle de la montgolfière de la carte
const BOX = [170, 116];
const ROPE = 46; // longueur des cordes jusqu'aux points de prise de l'objet

// Trajet du point d'appui (sous la nacelle) : [t, x, y]
const WAY = [
  [0, 96, 930],
  [0.8, 160, 640],
  [1.6, 264, 512],
  [2.2, 214, 478],
  [2.6, 206, 474],
];

/** Catmull-Rom échantillonnée : trajectoire souple sans arrêt aux points de passage. */
function path(step = 0.1) {
  const P = [WAY[0], ...WAY, WAY[WAY.length - 1]];
  const fr = [];
  for (let i = 1; i < P.length - 2; i += 1) {
    const [t0, x0, y0] = P[i - 1];
    const [t1, x1, y1] = P[i];
    const [t2, x2, y2] = P[i + 1];
    const [t3, x3, y3] = P[i + 2];
    void t0;
    void t3;
    const n = Math.max(2, Math.round((t2 - t1) / step));
    for (let j = i === 1 ? 0 : 1; j <= n; j += 1) {
      const u = j / n;
      const cr = (a, b, c, d) =>
        0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
      // en fin de course on ralentit doucement
      const last = i === P.length - 3;
      const tt = t1 + (t2 - t1) * (last ? Math.sin((u * Math.PI) / 2) : u);
      fr.push([tt, { x: cr(x0, x1, x2, x3), y: cr(y0, y1, y2, y3) }, 'l']);
    }
  }
  return fr;
}

function bird() {
  return `<g transform="translate(1 -35) scale(1.55)">
    <circle r="9" fill="#5fb3f0"/>
    <ellipse cx="2.4" cy="3" rx="5" ry="4.2" fill="#e4f4ff"/>
    <path d="M -2 -7.5 Q 0 -12 3 -10 Q 1 -9 1 -7.5 Z" fill="#3f97da"/>
    <g class="nu-eyes"><circle cx="3.2" cy="-2.2" r="1.45" fill="#24496b"/><circle cx="3.7" cy="-2.7" r=".5" fill="#fff"/></g>
    <path class="nu-happy" opacity="0" d="M 1.6 -2 Q 3.2 -4 4.8 -2" stroke="#24496b" stroke-width="1" stroke-linecap="round" fill="none"/>
    <path d="M 7.6 -1.6 L 11.6 0 L 7.6 1.6 Z" fill="#ffa62b"/>
    <circle cx="5.6" cy="1.8" r="1.5" fill="#ff9aa9" opacity=".6"/>
    <g transform="translate(-4 0)"><g class="nu-wing"><ellipse cx="-3" cy="0" rx="4.2" ry="2.6" fill="#3f97da"/></g></g>
  </g>`;
}

function balloon() {
  return `<g transform="scale(${K})">
    <path d="M -15 -54 L -11 -22 M 15 -54 L 11 -22" stroke="#8b5a2b" stroke-width="1.4"/>
    <g transform="translate(0 -10)">
    <path d="M -17 -44 Q -38 -66 -34 -90 Q -27 -116 0 -116 Q 27 -116 34 -90 Q 38 -66 17 -44 Z" fill="#ef5350"/>
    <path d="M 17 -44 Q 38 -66 34 -90 Q 30 -106 18 -113 Q 30 -84 10 -44 Z" fill="#d84343"/>
    <path d="M -7 -44 Q -20 -76 -10 -116 L 10 -116 Q 20 -76 7 -44 Z" fill="#ffd23f"/>
    <path d="M -26 -60 Q -36 -80 -30 -98 L -24 -104 Q -30 -80 -18 -52 Z" fill="#ffd23f" opacity=".9"/>
    <path d="M -24 -96 Q -20 -108 -8 -112" stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".6"/>
    <rect x="-18" y="-48" width="36" height="7" rx="3.5" fill="#c94040"/>
    </g>
    ${bird()}
    <rect x="-12" y="-24" width="24" height="18" rx="3" fill="#b5793d"/>
    <path d="M -12 -18 H 12" stroke="#8b5a2b" stroke-width="2"/>
    <path d="M -6 -24 V -6 M 2 -24 V -6" stroke="#9c6630" stroke-width="1.2" opacity=".7"/>
    <rect x="-13" y="-25.5" width="26" height="4" rx="2" fill="#c68a4e"/>
  </g>`;
}

/** Cordes + objet suspendus ; pivot sous la nacelle. Les cordes vont aux points de prise du dessus de l'objet. */
function hanging() {
  const bx = 9 * K; // coins du fond de la nacelle
  return `<g class="nu-swing">
    <path data-t="d=M ${-bx} 0 L {gl} ${ROPE} M ${bx} 0 L {gr} ${ROPE}" stroke="#8b5a2b" stroke-width="2.6" stroke-linecap="round" fill="none"/>
    <g data-t="transform=translate(0 {${ROPE}-gy})">${objSlot()}</g>
    <circle data-t="cx={gl}" cy="${ROPE + 1}" r="4" fill="#8b5a2b"/><circle data-t="cx={gr}" cy="${ROPE + 1}" r="4" fill="#8b5a2b"/>
  </g>`;
}

const { skyCloud: cloud, seaOfClouds } = L;

function css() {
  let c = L.actorsCss() + L.checkButtonCss();
  c += anim('nu-pos', path());
  c += anim('nu-tilt', [[0, { r: 0 }], [0.6, { r: 5 }], [1.3, { r: 2 }], [1.9, { r: -4 }], [2.5, { r: 1.5 }], [3.0, { r: 0 }]]);
  c += anim('nu-swing', [
    [0, { r: 0 }],
    [0.4, { r: 8 }],
    [0.85, { r: 11 }],
    [1.3, { r: 2 }],
    [1.75, { r: -9 }],
    [2.15, { r: -6 }],
    [2.5, { r: 3 }],
    [2.85, { r: -2.5 }],
    [3.2, { r: 1 }],
    [3.5, { r: 0 }],
  ]);
  c += anim('nu-wing', [[0, { r: 0 }], [2.2, { r: 0 }, 'io'], [2.38, { r: 70 }, 'io'], [2.56, { r: 20 }, 'io'], [2.74, { r: 70 }, 'io'], [2.92, { r: 0 }]], { origin: '0 0' });
  c += anim('nu-eyes', [[0, { o: 1 }], [2.2, { o: 1 }, 'step'], [2.22, { o: 0 }]]);
  c += anim('nu-happy', [[0, { o: 0 }], [2.2, { o: 0 }, 'step'], [2.22, { o: 1 }]]);
  // oiseaux lointains qui battent des ailes
  const flap = [];
  for (let t = 0; t <= 4; t += 0.25) flap.push([t, { sy: (t / 0.25) % 2 ? 0.45 : 1 }]);
  c += anim('nu-far', flap);
  c += sparkleAnim('nu-s1', 2.3, 2.95) + sparkleAnim('nu-s2', 2.38, 3.05) + sparkleAnim('nu-s3', 2.26, 2.9);
  return c;
}

function svg() {
  return `
  ${L.cloudsBackground()}
  <g transform="translate(300 250)"><g class="nu-far"><path d="M -8 0 Q -4 -5 0 0 Q 4 -5 8 0" stroke="#6f8fb8" stroke-width="2.2" stroke-linecap="round" fill="none"/></g></g>
  <g transform="translate(326 268) scale(.8)"><g class="nu-far"><path d="M -8 0 Q -4 -5 0 0 Q 4 -5 8 0" stroke="#6f8fb8" stroke-width="2.4" stroke-linecap="round" fill="none"/></g></g>
  <g class="actors">
    <g class="nu-pos"><g class="nu-tilt">
      <g transform="translate(0 ${-6 * K})">${hanging()}</g>
      ${balloon()}
    </g></g>
    ${sparkle('nu-s1', 96, 560, 1.3)}${sparkle('nu-s2', 318, 540, 1.1)}${sparkle('nu-s3', 310, 300, 1.4)}
  </g>
  ${seaOfClouds()}
  <g class="actors">${L.checkButton()}</g>`;
}

export const scene: SceneModule = {
  title: 'Fête des nuages · montgolfière',
  box: BOX,
  svg,
  css,
};
