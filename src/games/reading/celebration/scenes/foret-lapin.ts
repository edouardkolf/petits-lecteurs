// @ts-nocheck — portage fidèle des maquettes JS validées (art en chaînes SVG) ; l'API publique est typée dans types.ts.
// Forêt · lapin : ses oreilles dépassent d'un buisson ; il en jaillit, saute par-dessus l'objet,
// atterrit de l'autre côté, se retourne et s'assoit fièrement à côté.
import * as L from '../lib';
import type { SceneModule } from '../types';
const { anim, sparkle, sparkleAnim, puff, puffAnim, objSlot, r2 } = L;

const G = 664;
const S = 1.45;
const BUSH = [96, 606]; // buisson au pied du chêne, un peu en arrière de l'objet
const B0 = [100, 540]; // départ du bond (sommet du buisson), repère : centre du corps
const B1 = [334, G]; // arrivée (pieds) = lapin assis
const LEAP_H = 130;
const T0 = 0.42;
const T1 = 1.2;
const RF = B1[0];
const GAP = 64; // de son centre au bord droit de l'objet
const BOX = [170, 112];
const OX = '{' + (RF - GAP) + '-hw}'; // centre de l'objet

const C = {
  fur: '#d8bc9c',
  furDk: '#b9987a',
  belly: '#fff4e4',
  ear: '#f6b0bb',
  ink: '#3d2c1e',
  nose: '#f08a9c',
};

/** Lapin assis, de face (repère : entre les pieds). */
function rabbitSit(p) {
  return `<g class="${p}-squash">
    <circle cx="27" cy="-16" r="11" fill="#ffffff"/>
    <ellipse cx="0" cy="-34" rx="29" ry="33" fill="${C.fur}"/>
    <ellipse cx="0" cy="-30" rx="18" ry="24" fill="${C.belly}"/>
    <ellipse cx="-17" cy="-5" rx="15" ry="7.5" fill="${C.belly}"/><ellipse cx="17" cy="-5" rx="15" ry="7.5" fill="${C.belly}"/>
    <path d="M -24 -6 l 4 -3 M -18 -7 l 3 -3 M 24 -6 l -4 -3 M 18 -7 l -3 -3" stroke="${C.furDk}" stroke-width="1.6" stroke-linecap="round"/>
    <ellipse cx="-9" cy="-44" rx="6" ry="8" fill="${C.fur}"/><ellipse cx="9" cy="-44" rx="6" ry="8" fill="${C.fur}"/>
    <g class="${p}-head">
      <g transform="translate(-11 -98)"><g class="${p}-earL">
        <path d="M -9 4 C -16 -24 -12 -58 -2 -64 C 8 -58 10 -24 7 4 Z" fill="${C.fur}"/>
        <path d="M -5 0 C -10 -22 -8 -48 -2 -54 C 4 -48 5 -22 3 0 Z" fill="${C.ear}"/>
      </g></g>
      <g transform="translate(11 -98) rotate(10)"><g class="${p}-earR">
        <path d="M -7 4 C -10 -24 -8 -50 2 -58 C 12 -54 16 -30 9 4 Z" fill="${C.fur}"/>
        <path d="M -3 0 C -5 -22 -3 -42 2 -48 C 8 -44 10 -24 5 0 Z" fill="${C.ear}"/>
      </g></g>
      <ellipse cx="0" cy="-80" rx="29" ry="25" fill="${C.fur}"/>
      <ellipse cx="-7" cy="-69" rx="9" ry="7" fill="${C.belly}"/><ellipse cx="7" cy="-69" rx="9" ry="7" fill="${C.belly}"/>
      <circle cx="-19" cy="-72" r="4.6" fill="#ff8f7a" opacity=".45"/><circle cx="19" cy="-72" r="4.6" fill="#ff8f7a" opacity=".45"/>
      <g class="${p}-eyes">
        <circle cx="-11" cy="-84" r="5.2" fill="${C.ink}"/><circle cx="11" cy="-84" r="5.2" fill="${C.ink}"/>
        <circle cx="-9.3" cy="-86" r="1.9" fill="#fff"/><circle cx="12.7" cy="-86" r="1.9" fill="#fff"/>
      </g>
      <g class="${p}-happy" opacity="0"><path d="M -15 -83 Q -11 -89 -7 -83 M 7 -83 Q 11 -89 15 -83" stroke="${C.ink}" stroke-width="2.8" stroke-linecap="round" fill="none"/></g>
      <g class="${p}-nose"><path d="M -4 -75 Q 0 -77 4 -75 Q 2 -71 0 -71 Q -2 -71 -4 -75 Z" fill="${C.nose}"/></g>
      <path d="M 0 -71 L 0 -67 M -4 -65 Q 0 -66 0 -67 Q 0 -66 4 -65" stroke="${C.ink}" stroke-width="1.6" stroke-linecap="round" fill="none"/>
    </g>
  </g>`;
}

/** Lapin en plein bond, de profil tourné vers la gauche (repère : centre du corps). */
function rabbitLeap() {
  return `<g>
    <path d="M 26 4 C 40 10 58 14 70 12 C 72 18 66 22 58 22 C 44 22 30 18 20 14 Z" fill="${C.fur}"/>
    <ellipse cx="64" cy="17" rx="10" ry="5" fill="${C.belly}"/>
    <circle cx="44" cy="-14" r="10" fill="#ffffff"/>
    <ellipse cx="6" cy="-4" rx="42" ry="22" fill="${C.fur}"/>
    <ellipse cx="0" cy="6" rx="28" ry="11" fill="${C.belly}"/>
    <path d="M -24 8 C -36 14 -48 18 -58 18 C -60 22 -54 25 -46 24 C -36 22 -26 18 -18 14 Z" fill="${C.fur}"/>
    <path d="M -28 -26 C -12 -40 18 -42 40 -36 C 30 -32 10 -30 -6 -26 Z" fill="${C.fur}"/>
    <path d="M -24 -27 C -10 -36 14 -38 32 -35 C 20 -32 6 -30 -8 -27 Z" fill="${C.ear}"/>
    <path d="M -30 -22 C -16 -30 8 -30 30 -26 C 20 -22 2 -20 -14 -18 Z" fill="${C.furDk}"/>
    <circle cx="-38" cy="-12" r="21" fill="${C.fur}"/>
    <ellipse cx="-52" cy="-6" rx="9" ry="7" fill="${C.belly}"/>
    <circle cx="-41" cy="-16" r="4.6" fill="${C.ink}"/><circle cx="-42.4" cy="-17.6" r="1.6" fill="#fff"/>
    <circle cx="-38" cy="-6" r="4" fill="#ff8f7a" opacity=".45"/>
    <path d="M -59 -9 Q -57 -12 -55 -10 Q -56 -7 -59 -9 Z" fill="${C.nose}"/>
  </g>`;
}

function bigBush() {
  return `<g transform="translate(${BUSH[0]} ${BUSH[1]}) scale(.82)"><g class="la-bush">
    <ellipse cx="0" cy="4" rx="80" ry="12" fill="#28401a" opacity=".18"/>
    <circle cx="-48" cy="-26" r="34" fill="#58a646"/><circle cx="46" cy="-28" r="36" fill="#4f9a3f"/>
    <circle cx="-8" cy="-56" r="44" fill="#67b853"/><circle cx="34" cy="-64" r="28" fill="#5fae4c"/>
    <rect x="-80" y="-30" width="164" height="32" rx="16" fill="#58a646"/>
    <circle cx="-22" cy="-76" r="12" fill="#86cc6a"/><circle cx="-56" cy="-40" r="8" fill="#86cc6a"/>
    <circle cx="16" cy="-46" r="5.5" fill="#e63946"/><circle cx="-30" cy="-26" r="5.5" fill="#e63946"/><circle cx="52" cy="-30" r="5.5" fill="#e63946"/><circle cx="-60" cy="-14" r="5" fill="#e63946"/>
  </g></g>`;
}

function leaf(i) {
  return `<g class="la-leaf${i}"><path d="M 0 -8 Q 9 -2 0 9 Q -9 -2 0 -8 Z" fill="${i % 2 ? '#86cc6a' : '#5fb14f'}"/><path d="M 0 -6 L 0 7" stroke="#3f8f45" stroke-width="1.3"/></g>`;
}
const LEAVES = [[-50, -80, -40], [-14, -120, -90], [26, -110, 50], [60, -70, 120], [-70, -40, -150], [70, -30, 80]];

/** Trajectoire du bond (parabole), orientée selon la pente mais adoucie. */
function leapFrames() {
  const fr = [];
  const n = 18;
  for (let i = 0; i <= n; i += 1) {
    const u = i / n;
    const v = u + (0.7 / (2 * Math.PI)) * Math.sin(2 * Math.PI * u);
    const x = B0[0] + (B1[0] - B0[0]) * v;
    const y = B0[1] + (B1[1] - 20 - B0[1]) * v - 4 * LEAP_H * v * (1 - v);
    const dx = B1[0] - B0[0];
    const dy = B1[1] - 20 - B0[1] - 4 * LEAP_H * (1 - 2 * v);
    const th = (Math.atan2(dy, dx) * 180) / Math.PI;
    fr.push([T0 + (T1 - T0) * u, { x, y, r: th * 0.55, o: 1 }, 'l']);
  }
  return fr;
}

function css() {
  let c = L.actorsCss() + L.checkButtonCss() + L.treeCrownCss(30);
  // les oreilles dépassent du buisson et frémissent
  c += anim('la-peek', [
    [0, { y: 0, o: 1 }],
    [0.12, { y: -6 }, 'io'],
    [0.22, { y: 0 }, 'io'],
    [0.3, { y: -8 }, 'i'],
    [0.42, { y: 30, o: 1 }, 'step'],
    [0.44, { o: 0 }],
  ]);
  c += anim('la-bush', [
    [0, { sx: 1, sy: 1 }],
    [0.34, { sx: 1, sy: 1 }, 'o'],
    [0.42, { sx: 1.06, sy: 0.92 }, 'o'],
    [0.56, { sx: 0.97, sy: 1.04 }, 'io'],
    [0.7, { sx: 1.01, sy: 0.99 }, 'io'],
    [0.82, { sx: 1, sy: 1 }],
  ], { origin: `0 0` });
  LEAVES.forEach(([dx, dy, rr], i) => {
    c += anim(`la-leaf${i}`, [
      [0, { x: 0, y: -40, o: 0, r: 0 }],
      [0.4, { x: 0, y: -40, o: 0, r: 0 }, 'o'],
      [0.44, { o: 1 }, 'o'],
      [0.8, { x: dx, y: dy, r: rr }, 'i'],
      [1.3, { x: dx * 1.3, y: dy + 90, r: rr * 1.8, o: 1 }, 'l'],
      [1.5, { y: dy + 110, o: 0 }],
    ]);
  });
  // bond (profil)
  c += anim('la-leap', [
    [0, { x: B0[0], y: B0[1] + 40, r: -40, o: 0 }],
    [T0 - 0.02, { x: B0[0], y: B0[1] + 40, r: -40, o: 0 }, 'step'],
    ...leapFrames(),
    [T1 + 0.02, { o: 0 }],
  ]);
  c += anim('la-legs', [[0, { sx: 1 }], [T0, { sx: 1.08 }], [0.8, { sx: 1.12 }], [T1, { sx: 0.95 }]]);
  // assis (face)
  c += anim('la-sit', [
    [0, { x: B1[0], o: 0, sx: 1.2, sy: 0.75 }],
    [T1, { x: B1[0], o: 0, sx: 1.2, sy: 0.75 }, 'step'],
    [T1 + 0.02, { o: 1 }, 'o'],
    [1.36, { sx: 0.96, sy: 1.05, y: 0 }, 'io'],
    [1.5, { sx: 1, sy: 1 }, 'io'],
    [1.84, { y: 0, sx: 1, sy: 1 }, 'o'],
    [1.96, { y: -18, sx: 0.96, sy: 1.05 }, 'i'],
    [2.08, { y: 0, sx: 1.08, sy: 0.92 }, 'o'],
    [2.2, { sx: 0.99, sy: 1.04 }, 'io'],
    [2.5, { sx: 1, sy: 1.03 }],
  ], { origin: `0 ${G}px` });
  c += anim('la-r-earL', [[0, { r: 0 }], [1.6, { r: -14 }, 'o'], [1.8, { r: 4 }, 'io'], [2.05, { r: -4 }, 'io'], [2.3, { r: 0 }]]);
  c += anim('la-r-earR', [[0, { r: 0 }], [1.6, { r: 16 }, 'o'], [1.8, { r: -3 }, 'io'], [2.05, { r: 5 }, 'io'], [2.3, { r: 0 }, 'io'], [2.5, { r: 10 }, 'io'], [2.7, { r: 0 }]]);
  c += anim('la-r-nose', [[0, { sy: 1 }], [2.4, { sy: 1 }], [2.48, { sy: 0.7 }], [2.56, { sy: 1 }], [2.64, { sy: 0.7 }], [2.72, { sy: 1 }]], { origin: '0 -74px' });
  c += L.happyCss('la-r', 2.15);
  c += anim('la-shadow', [
    [0, { x: B1[0], s: 0.2, o: 0 }],
    [0.9, { x: B1[0] - 40, s: 0.4, o: 0 }, 'o'],
    [T1, { x: B1[0], s: 1, o: 1 }],
    [1.84, { s: 1 }, 'o'],
    [1.96, { s: 0.8 }, 'i'],
    [2.08, { s: 1 }],
  ]);
  c += puffAnim('la-d', T1);
  c += anim('la-opop', [[0, { sx: 1, sy: 1 }], [0.8, { sx: 1, sy: 1 }, 'io'], [0.9, { sx: 0.97, sy: 1.04 }, 'io'], [1.0, { sx: 1, sy: 1 }]]);
  c += sparkleAnim('la-sp1', 2.2, 2.85) + sparkleAnim('la-sp2', 2.3, 2.95) + sparkleAnim('la-sp3', 2.25, 3.0);
  return c;
}

function svg() {
  return `
  ${L.forestBackground(30)}
  <g class="actors">
    <g class="la-shadow"><ellipse cx="0" cy="${G + 2}" rx="${34 * S}" ry="8" fill="#28401a" opacity=".2"/></g>
    <g data-t="transform=translate(${OX} ${G + 2})"><ellipse data-t="rx={hw*0.95+8}" rx="60" ry="9" fill="#28401a" opacity=".2"/></g>
    <g transform="translate(${BUSH[0] - 4} ${BUSH[1] - 62})"><g class="la-peek">
      <g transform="scale(${S})">
        <path d="M -14 10 C -20 -14 -16 -40 -6 -46 C 4 -40 6 -14 4 10 Z" fill="${C.fur}"/><path d="M -10 6 C -14 -12 -12 -32 -6 -38 C 0 -32 1 -12 0 6 Z" fill="${C.ear}"/>
        <path d="M 6 10 C 2 -14 6 -40 16 -44 C 26 -38 26 -14 20 10 Z" fill="${C.fur}"/><path d="M 10 6 C 8 -12 10 -30 16 -36 C 22 -30 21 -12 18 6 Z" fill="${C.ear}"/>
      </g>
    </g></g>
    ${bigBush()}
    <g transform="translate(${BUSH[0]} ${BUSH[1]})">${LEAVES.map((_, i) => leaf(i)).join('')}</g>
    <g class="la-leap"><g transform="scale(${-S} ${S})"><g class="la-legs">${rabbitLeap()}</g></g></g>
    <g data-t="transform=translate(${OX} ${G})"><g class="la-opop">${objSlot()}</g></g>
    <g class="la-sit"><g transform="translate(0 ${G}) scale(${S})">${rabbitSit('la-r')}</g></g>
    ${puff('la-d', B1[0], G + 2, 0.9)}
    ${sparkle('la-sp1', 236, 470, 1.3)}${sparkle('la-sp2', 390, 520, 1.1)}${sparkle('la-sp3', 260, 400, 1.6)}
    ${L.checkButton()}
  </g>`;
}

export const scene: SceneModule = {
  title: 'Fête de la forêt · lapin',
  box: BOX,
  svg,
  css,
};
