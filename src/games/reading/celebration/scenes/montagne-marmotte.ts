// @ts-nocheck — portage fidèle des maquettes JS validées (art en chaînes SVG) ; l'API publique est typée dans types.ts.
// Montagne : la marmotte guette depuis son terrier, jaillit en brandissant le M bien haut et siffle.
import * as L from '../lib';
import type { SceneModule } from '../types';
const { anim, arc, sparkle, sparkleAnim, objSlot, W, H } = L;

const HX = 206; // centre du trou
const HY = 666;
const MK = 1.22; // échelle du monticule
const HRX = 54 * MK;
const HRY = 17 * MK;
const FEET = 682; // pieds de la marmotte sortie
const SC = 1.6;
const PEEK = 130; // décalage (px) : seuls les oreilles et les yeux dépassent
const DEEP = 330; // tout caché, M compris
const CARRY = -192; // base de l'objet brandi (repère de la marmotte, en px)
const BOX = [190, 120];

const C = {
  fur: '#bd8c5a', // flancs fauves
  back: '#7d5330', // dos et calotte plus foncés
  belly: '#f1dcb8',
  muzzle: '#f7e8cf',
  ink: '#3d2c1e',
  nose: '#3b2618',
  tail: '#5c3b21',
  feet: '#6b4526',
};

function marmotArm(side) {
  // inclinaison fixe selon la largeur de l'objet : les pattes viennent sous l'objet, au plus près de son centre
  const px = 'Math.max(11,Math.min(30,hw*0.5/1.6))';
  const d = `{${side === 'L' ? '' : '-'}Math.asin((22-${px})/58)*180/Math.PI}`;
  return `<g transform="translate(${side === 'L' ? -22 : 22} -60)"><g data-t="transform=rotate(${d})"><g class="ma-arm${side}">
    <path d="M 0 0 L 0 56" stroke="${C.back}" stroke-width="12.5" stroke-linecap="round"/>
    <ellipse cx="0" cy="58" rx="8.6" ry="7.8" fill="#d9a774"/>
    <path d="M -4 63 l 0 3 M 0 64 l 0 3 M 4 63 l 0 3" stroke="#6b4526" stroke-width="1.6" stroke-linecap="round"/>
  </g></g></g>`;
}

/** Marmotte de face, debout : tête large et plate, petites oreilles rondes sur les côtés,
 *  deux grandes incisives, dos et calotte foncés, queue courte. Repère : entre les pieds. */
function marmot() {
  return `<g class="ma-squash">
    <g class="ma-tail"><path d="M 24 -14 C 42 -14 52 -24 52 -38" stroke="${C.tail}" stroke-width="12" stroke-linecap="round" fill="none"/>
      <path d="M 50 -32 C 52 -38 52 -42 50 -46" stroke="#3f2815" stroke-width="10" stroke-linecap="round" fill="none"/></g>
    <ellipse cx="-15" cy="-3" rx="12" ry="6" fill="${C.feet}"/><ellipse cx="15" cy="-3" rx="12" ry="6" fill="${C.feet}"/>
    <path d="M -36 -6 C -44 -34 -40 -64 -18 -78 L 18 -78 C 40 -64 44 -34 36 -6 Q 0 6 -36 -6 Z" fill="${C.back}"/>
    <path d="M -30 -6 C -36 -32 -32 -60 -14 -74 L 14 -74 C 32 -60 36 -32 30 -6 Q 0 4 -30 -6 Z" fill="${C.fur}"/>
    <ellipse cx="0" cy="-34" rx="20" ry="27" fill="${C.belly}"/>
    ${marmotArm('L')}${marmotArm('R')}
    <g class="ma-head">
      <circle cx="-30" cy="-102" r="7" fill="${C.back}"/><circle cx="30" cy="-102" r="7" fill="${C.back}"/>
      <circle cx="-30" cy="-102" r="3.6" fill="#c98f6a"/><circle cx="30" cy="-102" r="3.6" fill="#c98f6a"/>
      <ellipse cx="0" cy="-91" rx="34" ry="24" fill="${C.fur}"/>
      <path d="M -31 -98 C -28 -112 -14 -116 0 -116 C 14 -116 28 -112 31 -98 C 22 -104 10 -106 0 -106 C -10 -106 -22 -104 -31 -98 Z" fill="${C.back}"/>
      <g class="ma-face">
        <g class="ma-puff" opacity="0"><circle cx="-15" cy="-80" r="10" fill="${C.muzzle}"/><circle cx="15" cy="-80" r="10" fill="${C.muzzle}"/></g>
        <ellipse cx="0" cy="-81" rx="19" ry="12.5" fill="${C.muzzle}"/>
        <circle cx="-22" cy="-86" r="4.6" fill="#ff8f7a" opacity=".45"/><circle cx="22" cy="-86" r="4.6" fill="#ff8f7a" opacity=".45"/>
        <g class="ma-eyes">
          <circle cx="-13" cy="-97" r="4.6" fill="${C.ink}"/><circle cx="13" cy="-97" r="4.6" fill="${C.ink}"/>
          <circle cx="-11.6" cy="-98.6" r="1.6" fill="#fff"/><circle cx="14.4" cy="-98.6" r="1.6" fill="#fff"/>
        </g>
        <g class="ma-happy" opacity="0"><path d="M -17 -96 Q -13 -102 -9 -96 M 9 -96 Q 13 -102 17 -96" stroke="${C.ink}" stroke-width="2.8" stroke-linecap="round" fill="none"/></g>
        <path d="M -6.5 -90 Q 0 -93 6.5 -90 Q 5 -85.5 0 -85.5 Q -5 -85.5 -6.5 -90 Z" fill="${C.nose}"/>
        <path d="M -10 -84 Q -5 -80.5 0 -84 Q 5 -80.5 10 -84" stroke="${C.nose}" stroke-width="1.9" stroke-linecap="round" fill="none"/>
        <g class="ma-whistle" opacity="0"><ellipse cx="0" cy="-70" rx="3.6" ry="3.4" fill="#6b3a2a"/></g>
        <rect x="-5.2" y="-83.5" width="10.4" height="11" rx="2.2" fill="#ffffff" stroke="#e2d6c4" stroke-width="1"/>
        <path d="M 0 -83 V -73" stroke="#d9ccb8" stroke-width="1.3"/>
        <path d="M -27 -84 l -8 -1.5 M -27 -80 l -8 1.5 M 27 -84 l 8 -1.5 M 27 -80 l 8 1.5" stroke="#8a6a4c" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>
      </g>
    </g>
  </g>`;
}

/** Petites marques de sifflement, de part et d'autre de la tête. */
function whistleMarks() {
  const one = (side, i) => {
    const r = 13 + i * 10;
    const d = side > 0 ? `M ${r * 0.55} ${-r * 0.8} Q ${r} 0 ${r * 0.55} ${r * 0.8}` : `M ${-r * 0.55} ${-r * 0.8} Q ${-r} 0 ${-r * 0.55} ${r * 0.8}`;
    return `<g class="ma-w${side > 0 ? 'R' : 'L'}${i}"><path d="${d}" stroke="#2f6f9f" stroke-opacity=".8" stroke-width="4.6" stroke-linecap="round" fill="none"/></g>`;
  };
  return [1, -1].map((s) => `<g transform="translate(${HX + s * 56} ${FEET - 84 * SC})">${[0, 1, 2].map((i) => one(s, i)).join('')}</g>`).join('');
}

function crumbs() {
  return [
    [-40, 7], [-22, 5], [-6, 6], [10, 5], [26, 6], [44, 7],
  ]
    .map(([dx, r], i) => `<g class="ma-c${i}"><circle r="${r * 1.4}" fill="${i % 2 ? '#8a6038' : '#a87a4a'}"/></g>`)
    .join('');
}

function css() {
  let c = L.actorsCss() + L.checkButtonCss();
  c += anim('ma-pos', [
    [0, { y: PEEK }],
    [0.25, { y: PEEK - 10 }, 'io'],
    [0.56, { y: PEEK - 10 }, 'i'],
    [0.68, { y: DEEP }, 'l'],
    [0.72, { y: DEEP }, 'o'],
    [1.0, { y: -18 }, 'io'],
    [1.14, { y: 0 }, 'io'],
    [2.14, { y: 0 }, 'o'],
    [2.27, { y: -14 }, 'i'],
    [2.4, { y: 0 }],
  ]);
  c += anim('ma-squash', [
    [0.72, { sx: 0.94, sy: 1.08 }],
    [0.95, { sx: 0.94, sy: 1.08 }],
    [1.14, { sx: 1.07, sy: 0.92 }],
    [1.28, { sx: 1, sy: 1 }],
    [2.1, { sx: 1, sy: 1 }],
    [2.15, { sx: 1.05, sy: 0.94 }],
    [2.24, { sx: 1, sy: 1 }],
    [2.4, { sx: 1, sy: 1 }],
    [2.46, { sx: 1.05, sy: 0.94 }],
    [2.56, { sx: 1, sy: 1 }],
  ]);
  c += anim('ma-face', [[0, { x: 0 }], [0.1, { x: -5 }, 'io'], [0.3, { x: -5 }, 'io'], [0.42, { x: 5 }, 'io'], [0.58, { x: 5 }, 'io'], [0.7, { x: 0 }]]);
  c += anim('ma-head', [[1.3, { r: 0 }], [1.55, { r: -5 }], [1.85, { r: 5 }], [2.1, { r: 0 }]], { origin: '0 -70px' });
  c += anim('ma-armL', [[0, { r: 8 }], [0.69, { r: 8 }, 'step'], [0.7, { r: 180 }], [2.0, { r: 180 }]]);
  c += anim('ma-armR', [[0, { r: -8 }], [0.69, { r: -8 }, 'step'], [0.7, { r: -180 }], [2.0, { r: -180 }]]);
  c += anim('ma-tail', [[0, { r: 0 }], [1.2, { r: 0 }, 'io'], [1.4, { r: 14 }, 'io'], [1.6, { r: -6 }, 'io'], [1.8, { r: 12 }, 'io'], [2.0, { r: 0 }], [2.2, { r: 0 }, 'io'], [2.4, { r: 14 }, 'io'], [2.6, { r: 0 }]], { origin: '24px -14px' });
  c += anim('ma-m', [
    [0, { y: 120 }],
    [0.69, { y: 120 }, 'step'],
    [0.7, { y: CARRY }, 'io'],
    [0.96, { y: CARRY - 6 }, 'io'],
    [1.14, { y: CARRY, r: 0 }, 'io'],
    [1.4, { r: -4 }, 'io'],
    [1.62, { r: 4 }, 'io'],
    [1.84, { r: -3 }, 'io'],
    [2.04, { r: 2 }, 'io'],
    [2.2, { r: 0 }],
  ]);
  const sw = (cls, on, off) => anim(cls, [[0, { o: 0 }], [on, { o: 0 }, 'step'], [on + 0.02, { o: 1 }], [off, { o: 1 }, 'step'], [off + 0.02, { o: 0 }]]);
  c += sw('ma-whistle', 1.3, 2.12) + sw('ma-puff', 1.3, 2.12);
  c += anim('ma-smile', [[0, { o: 1 }], [1.3, { o: 1 }, 'step'], [1.32, { o: 0 }], [2.12, { o: 0 }, 'step'], [2.14, { o: 1 }]]);
  c += anim('ma-eyes', [[0, { o: 1 }], [2.12, { o: 1 }, 'step'], [2.14, { o: 0 }]]);
  c += anim('ma-happy', [[0, { o: 0 }], [2.12, { o: 0 }, 'step'], [2.14, { o: 1 }]]);
  for (const side of ['L', 'R']) {
    [0, 1, 2].forEach((i) => {
      // deux vagues de trois traits, l'une après l'autre
      const a = 1.36 + i * 0.07;
      const b = 1.8 + i * 0.07;
      const dx = side === 'R' ? 6 : -6;
      c += anim(`ma-w${side}${i}`, [
        [0, { o: 0, s: 0.7, x: 0 }],
        [a, { o: 0, s: 0.7, x: 0 }, 'o'],
        [a + 0.08, { o: 1, s: 1 }, 'io'],
        [a + 0.26, { o: 1, s: 1.05, x: dx * 0.5 }, 'io'],
        [a + 0.38, { o: 0, s: 1.1, x: dx }, 'l'],
        [b, { o: 0, s: 0.7, x: 0 }, 'o'],
        [b + 0.08, { o: 1, s: 1 }, 'io'],
        [b + 0.26, { o: 1, s: 1.05, x: dx * 0.5 }, 'io'],
        [b + 0.38, { o: 0, s: 1.1, x: dx }],
      ]);
    });
  }
  [[-40, 7], [-22, 5], [-6, 6], [10, 5], [26, 6], [44, 7]].forEach(([dx], i) => {
    const end = [dx * 3.1, 26 + (i % 3) * 8];
    c += anim(`ma-c${i}`, [
      [0, { x: dx * 1.3, y: 0, o: 0 }],
      [0.74, { x: dx * 1.3, y: 0, o: 0 }, 'l'],
      [0.76, { o: 1 }, 'l'],
      ...arc(0.76, 1.22, [dx * 1.3, 0], end, 46 + (i % 2) * 22, { n: 8 }),
      [1.4, { o: 1 }, 'l'],
      [1.6, { o: 0 }],
    ]);
  });
  c += sparkleAnim('ma-s1', 2.3, 2.95) + sparkleAnim('ma-s2', 2.38, 3.05) + sparkleAnim('ma-s3', 2.26, 2.9);
  return c;
}

const { rock } = L;

function svg() {
  const clip = `<clipPath id="ma-clip"><path d="M -50 -50 H ${W + 50} V ${HY} H ${HX + HRX} A ${HRX} ${HRY} 0 0 1 ${HX - HRX} ${HY} H -50 Z"/></clipPath>`;
  return `
  <defs>${clip}</defs>
  ${L.mountainBackground()}
  <g transform="translate(${HX} ${HY}) scale(${MK}) translate(${-HX} ${-HY})">
    <ellipse cx="${HX}" cy="${HY + 34}" rx="118" ry="14" fill="rgba(40,50,30,.16)"/>
    <path d="M ${HX - 112} ${HY + 32} Q ${HX - 100} ${HY - 34} ${HX} ${HY - 38} Q ${HX + 100} ${HY - 34} ${HX + 112} ${HY + 32} Q ${HX} ${HY + 46} ${HX - 112} ${HY + 32} Z" fill="#c69a68"/>
    <path d="M ${HX - 112} ${HY + 32} Q ${HX - 108} ${HY + 8} ${HX - 96} ${HY - 4} Q ${HX - 84} ${HY + 22} ${HX} ${HY + 26} Q ${HX + 84} ${HY + 22} ${HX + 96} ${HY - 4} Q ${HX + 108} ${HY + 8} ${HX + 112} ${HY + 32} Q ${HX} ${HY + 46} ${HX - 112} ${HY + 32} Z" fill="#b0855a"/>
    <path d="M ${HX - 70} ${HY - 26} Q ${HX - 30} ${HY - 40} ${HX + 20} ${HY - 36}" stroke="#d9b282" stroke-width="5" stroke-linecap="round" fill="none"/>
    <ellipse cx="${HX}" cy="${HY}" rx="60" ry="22" fill="#9a6e45"/>
    <ellipse cx="${HX}" cy="${HY}" rx="54" ry="17" fill="#4a3222"/>
    <ellipse cx="${HX}" cy="${HY + 5}" rx="42" ry="10" fill="#36231a"/>
    ${L.grass(HX - 100, HY + 30, 1.3, '#6aa84f')}${L.grass(HX + 98, HY + 30, 1.3, '#6aa84f')}
    ${rock(HX + 84, HY + 34, 0.7)}${rock(HX - 80, HY + 36, 0.6)}
  </g>
  <g class="actors">
    <g transform="translate(${HX} ${HY - 2})">${crumbs()}</g>
    <g clip-path="url(#ma-clip)">
      <g transform="translate(${HX} ${FEET})"><g class="ma-pos">
        <g class="ma-m">${objSlot()}</g>
        <g transform="scale(${SC})">${marmot()}</g>
      </g></g>
    </g>
    ${whistleMarks()}
    ${sparkle('ma-s1', 96, 400, 1.3)}${sparkle('ma-s2', 318, 372, 1.1)}${sparkle('ma-s3', 206, 262, 1.6)}
    ${L.checkButton()}
  </g>`;
}

export const scene: SceneModule = {
  title: 'Fête de la montagne · marmotte',
  box: BOX,
  svg,
  css,
};
