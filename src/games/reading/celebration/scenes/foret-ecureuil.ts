// @ts-nocheck — portage fidèle des maquettes JS validées (art en chaînes SVG) ; l'API publique est typée dans types.ts.
// Forêt · écureuil (révisé) : il sort du chêne en serrant l'objet dans ses bras comme un gros gland,
// fait deux bonds, le pose à côté de lui et le présente.
import * as L from '../lib';
import type { SceneModule } from '../types';
const { anim, arc, arcStart, sparkle, sparkleAnim, squirrel, SQ, puff, puffAnim, objSlot } = L;

const GROUND = 640;
const TREE_DY = 30;
const HOLLOW = [84, 452 + TREE_DY];
const LAND = [168, GROUND];
const HOP1 = [219, GROUND];
const HOP2 = [270, GROUND];
const S = 1.9;
const CARRY_Y = -8;
const GAP = 68; // écart entre l'objet posé et l'écureuil
const BOX = [184, 104];

function shadowFrames() {
  const fr = [
    [0, { x: 150, y: GROUND + 2, s: 0.3, o: 0 }],
    [0.62, { x: 150, y: GROUND + 2, s: 0.4, o: 0 }, 'l'],
    [0.85, { x: LAND[0], s: 1, o: 1 }, 'l'],
  ];
  for (const [t0, t1, a, b] of [
    [0.85, 1.15, LAND, HOP1],
    [1.15, 1.45, HOP1, HOP2],
  ]) {
    for (let i = 1; i <= 6; i += 1) {
      const u = i / 6;
      fr.push([t0 + (t1 - t0) * u, { x: a[0] + (b[0] - a[0]) * u, s: 1 - 0.35 * 4 * u * (1 - u) }, 'l']);
    }
  }
  fr.push([1.9, { s: 1 }, 'o'], [2.03, { s: 0.8 }, 'i'], [2.16, { s: 1 }]);
  return fr;
}

const SQUASH = [
  [0.34, { sx: 1, sy: 1 }],
  [0.41, { sx: 1.1, sy: 0.87 }, 'o'],
  [0.5, { sx: 0.94, sy: 1.08 }],
  [0.62, { sx: 1, sy: 1 }],
  [0.82, { sx: 0.97, sy: 1.04 }, 'o'],
  [0.87, { sx: 1.1, sy: 0.88 }, 'o'],
  [0.96, { sx: 1, sy: 1 }],
  [1.12, { sx: 0.97, sy: 1.04 }, 'o'],
  [1.17, { sx: 1.1, sy: 0.88 }, 'o'],
  [1.26, { sx: 1, sy: 1 }],
  [1.42, { sx: 0.97, sy: 1.04 }, 'o'],
  [1.47, { sx: 1.08, sy: 0.9 }, 'o'],
  [1.56, { sx: 1, sy: 1 }],
];

function css() {
  let c = '';
  c += L.actorsCss() + L.checkButtonCss() + L.treeCrownCss(TREE_DY);
  c += anim('fo-peek', [[0, { o: 1 }], [0.1, { o: 1 }], [0.14, { o: 0 }]]);
  c += anim('fo-blink', [[0, { sy: 1 }], [0.03, { sy: 0.1 }], [0.06, { sy: 1 }]], { origin: `84px ${424 + TREE_DY}px` });
  c += anim('fo-car', [
    [0, { x: HOLLOW[0], y: HOLLOW[1], s: 0.25, o: 0 }],
    [0.1, { s: 0.25, o: 0 }, 'back'],
    [0.36, { s: 1, o: 1 }, 'l'],
    arcStart(0.42, HOLLOW, LAND, 70),
    ...arc(0.42, 0.85, HOLLOW, LAND, 70, { n: 12 }),
    ...arc(0.85, 1.15, LAND, HOP1, 38, { n: 8 }),
    ...arc(1.15, 1.45, HOP1, HOP2, 38, { n: 8 }),
  ]);
  c += anim('fo-shadow', shadowFrames());
  // corps : bonds, puis petit saut de joie
  c += anim('fo-sq-squash', [
    ...SQUASH,
    [1.86, { sx: 1, sy: 1 }],
    [1.92, { sx: 1.08, sy: 0.9 }, 'o'],
    [2.0, { sx: 0.96, sy: 1.05 }],
    [2.16, { sx: 1, sy: 1 }],
    [2.2, { sx: 1.08, sy: 0.9 }],
    [2.3, { sx: 1, sy: 1 }],
  ]);
  c += anim('fo-carry', SQUASH);
  c += anim('fo-sq-lean', [
    [1.46, { r: 0, y: 0 }, 'io'],
    [1.6, { r: -9 }, 'io'],
    [1.8, { r: 0 }],
    [1.92, { y: 0 }, 'o'],
    [2.05, { y: -22 }, 'i'],
    [2.18, { y: 0 }],
  ]);
  // l'objet : serré contre le ventre, puis posé à gauche (écart dépendant de sa largeur)
  c += anim('fo-o', [
    [0, { x: 0, y: CARRY_Y }],
    [1.47, { x: 0, y: CARRY_Y }, 'o'],
    [1.58, { x: [-GAP * 0.45, -0.45], y: -34, r: -4 }, 'i'],
    [1.7, { x: [-GAP, -1], y: 3, r: 0, sx: 1.06, sy: 0.92 }, 'o'],
    [1.82, { y: 0, sx: 0.98, sy: 1.02 }, 'io'],
    [1.95, { sx: 1, sy: 1 }],
  ]);
  c += anim('fo-oshadow', [[0, { o: 0, x: [-GAP, -1] }], [1.64, { o: 0 }, 'o'], [1.72, { o: 1 }]]);
  c += anim('fo-hug', [[0, { o: 1 }], [1.54, { o: 1 }, 'step'], [1.56, { o: 0 }]]);
  c += anim('fo-free', [[0, { o: 0 }], [1.54, { o: 0 }, 'step'], [1.56, { o: 1 }]]);
  c += anim('fo-sq-armL', [
    [0, { r: 60 }],
    [1.56, { r: 60 }, 'io'],
    [1.75, { r: 30 }, 'io'],
    [2.1, { r: 18 }],
  ]);
  c += anim('fo-sq-armR', [
    [0, { r: 20 }],
    [1.56, { r: 20 }, 'io'],
    [1.8, { r: -12 }],
    [2.1, { r: -12 }, 'back'],
    [2.35, { r: -150 }, 'io'],
    [2.6, { r: -128 }, 'io'],
    [2.85, { r: -150 }, 'io'],
    [3.1, { r: -135 }],
  ]);
  c += anim('fo-sq-tail', [[0, { r: 0 }], [0.9, { r: 9 }], [1.5, { r: -7 }], [2.2, { r: 10 }], [2.8, { r: -3 }], [3.4, { r: 0 }]]);
  c += L.happyCss('fo-sq', 2.15);
  c += puffAnim('fo-dust', 1.69);
  c += sparkleAnim('fo-sp1', 2.2, 2.85) + sparkleAnim('fo-sp2', 2.3, 2.95) + sparkleAnim('fo-sp3', 2.25, 3.0);
  return c;
}

function svg() {
  const pawX = '{-Math.min(hw+2,74)}';
  const pawXr = '{Math.min(hw+2,74)}';
  const pawY = `{${CARRY_Y}-hh*0.42}`;
  const armW = 11.5 * S;
  // bras « câlin » : derrière l'objet, pattes devant sur ses bords
  const hugBehind = `<g class="fo-hug">
      <path data-t="d=M ${-15 * S} ${-50 * S} L ${pawX} ${pawY}" stroke="${SQ.furDark}" stroke-width="${armW}" stroke-linecap="round" fill="none"/>
      <path data-t="d=M ${15 * S} ${-50 * S} L ${pawXr} ${pawY}" stroke="${SQ.furDark}" stroke-width="${armW}" stroke-linecap="round" fill="none"/>
    </g>`;
  const hugPaws = `<g class="fo-hug">
      <ellipse data-t="cx=${pawX}|cy=${pawY}" rx="${7.2 * S}" ry="${6.4 * S}" fill="${SQ.furDark}"/>
      <ellipse data-t="cx=${pawXr}|cy=${pawY}" rx="${7.2 * S}" ry="${6.4 * S}" fill="${SQ.furDark}"/>
      <path data-t="d=M ${pawX} {${CARRY_Y}-hh*0.42-3} m -4 0 l 0 6 m 4 -7 l 0 7 m 4 -6 l 0 6" stroke="#a9521f" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>
      <path data-t="d=M ${pawXr} {${CARRY_Y}-hh*0.42-3} m -4 0 l 0 6 m 4 -7 l 0 7 m 4 -6 l 0 6" stroke="#a9521f" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>
    </g>`;
  return `
  ${L.forestBackground(TREE_DY)}
  <g class="actors">
    <g class="fo-peek"><g class="fo-blink">
      <circle cx="76" cy="${424 + TREE_DY}" r="3.6" fill="#ffe9b0"/><circle cx="92" cy="${424 + TREE_DY}" r="3.6" fill="#ffe9b0"/>
    </g></g>
    <g transform="translate(${HOP2[0]} ${GROUND + 2})"><g class="fo-oshadow"><ellipse data-t="rx={hw*0.95+8}" rx="60" ry="9" fill="#28401a" opacity=".2"/></g></g>
    <g class="fo-shadow"><ellipse rx="${24 * S}" ry="${5 * S}" fill="#28401a" opacity=".2"/></g>
    <g class="fo-car">
      <g class="fo-sq-squash"><g class="fo-sq-lean">
        <g transform="scale(${S})">${squirrel('fo-sq', { parts: 'back' })}</g>
        ${hugBehind}
        <g class="fo-free"><g transform="scale(${S})">${squirrel('fo-sq', { parts: 'arms' })}</g></g>
      </g></g>
      <g class="fo-carry"><g class="fo-o">${objSlot()}</g></g>
      <g class="fo-sq-squash"><g class="fo-sq-lean">
        <g transform="scale(${S})">${squirrel('fo-sq', { parts: 'head' })}</g>
        ${hugPaws}
      </g></g>
    </g>
    <g transform="translate(${HOP2[0]} 0)"><g class="fo-oshadow">${puff('fo-dust', 0, GROUND, 1.1)}</g></g>
    ${sparkle('fo-sp1', 150, 500, 1.3)}${sparkle('fo-sp2', 40, 560, 1.1)}${sparkle('fo-sp3', 352, 430, 1.6)}
    ${L.checkButton()}
  </g>`;
}

export const scene: SceneModule = {
  title: 'Fête de la forêt · écureuil',
  box: BOX,
  svg,
  css,
};
