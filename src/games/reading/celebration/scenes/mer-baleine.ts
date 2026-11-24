// @ts-nocheck — portage fidèle des maquettes JS validées (art en chaînes SVG) ; l'API publique est typée dans types.ts.
// Mer · baleine : l'objet flotte ; une grande ombre passe dessous… la baleine fait surface et le soulève,
// souffle : l'objet monte tout en haut du jet d'eau, puis redescend doucement se poser sur sa tête.
import * as L from '../lib';
import type { SceneModule } from '../types';
const { anim, sparkle, sparkleAnim, splash, splashCss, objSlot } = L;

const WL = 724; // ligne d'eau de la baleine
const BX = 190; // évent (x)
const BY = 652; // évent (y) baleine sortie
const FLOAT = 712; // base de l'objet qui flotte au début
const TOP = 396; // base de l'objet au sommet du jet
const RISE = 150; // décalage de la baleine cachée
const BOX = [180, 110];
const C = { body: '#5a78c8', bodyDk: '#4862ad', belly: '#d6e5f7', ink: '#24365e', fluke: '#4f6cbd' };

/** Baleine de profil tournée vers la gauche ; origine = évent (haut de la tête). */
function whale(p, { under = false } = {}) {
  return `<g>
    <path d="M -168 92 C -176 34 -128 -4 -52 -6 C 30 -8 120 12 178 64 C 196 80 200 110 190 140 L -150 150 C -164 130 -168 110 -168 92 Z" fill="${C.body}"/>
    <path d="M -166 96 C -150 118 -100 128 -40 126 L -40 150 L -150 150 C -162 132 -166 114 -166 96 Z" fill="${C.belly}"/>
    <path d="M -150 120 L -60 128 M -146 134 L -60 140" stroke="#b7cdea" stroke-width="3" stroke-linecap="round"/>
    ${under ? '' : `
    <path d="M -120 6 C -80 -6 -30 -10 20 -6" stroke="#7d97db" stroke-width="7" stroke-linecap="round" fill="none"/>
    <ellipse cx="0" cy="-2" rx="9" ry="3.6" fill="${C.bodyDk}"/>
    <circle cx="-126" cy="40" r="8" fill="#ff9aa9" opacity=".55"/>
    <g class="${p}-eyes"><circle cx="-104" cy="22" r="8.6" fill="${C.ink}"/><circle cx="-101" cy="18.8" r="3" fill="#fff"/></g>
    <g class="${p}-happy" opacity="0"><path d="M -113 24 Q -104 13 -95 24" stroke="${C.ink}" stroke-width="3.4" stroke-linecap="round" fill="none"/></g>
    <path d="M -164 46 Q -148 60 -128 54" stroke="${C.ink}" stroke-width="3.2" stroke-linecap="round" fill="none"/>
    <path d="M 40 10 C 56 14 70 20 80 28" stroke="#7d97db" stroke-width="5" stroke-linecap="round" fill="none" opacity=".7"/>`}
  </g>`;
}

function fluke() {
  return `<g>
    <path d="M -10 80 C -8 40 -4 10 0 -6 C 4 10 10 40 12 80 Z" fill="${C.fluke}"/>
    <path d="M 0 -4 C -12 -22 -34 -30 -52 -26 C -40 -18 -26 -10 -6 4 Z" fill="${C.fluke}"/>
    <path d="M 0 -4 C 12 -22 34 -30 52 -26 C 40 -18 26 -10 6 4 Z" fill="${C.fluke}"/>
    <path d="M -46 -25 C -32 -24 -18 -16 -6 -6" stroke="#7d97db" stroke-width="3" stroke-linecap="round" fill="none"/>
  </g>`;
}

function css() {
  let c = L.actorsCss() + L.checkButtonCss();
  // ombre sous l'eau qui grossit (anticipation)
  c += anim('wh-shade', [[0, { sx: 0.4, sy: 0.4, o: 0 }], [0.05, { o: 0.25 }, 'o'], [0.42, { sx: 1, sy: 1, o: 0.35 }, 'l'], [0.5, { o: 0 }]], { origin: `${BX - 10}px ${WL + 40}px` });
  // la baleine fait surface, puis se balance doucement
  c += anim('wh-pos', [
    [0, { y: RISE }],
    [0.3, { y: RISE }, 'o'],
    [0.66, { y: -6 }, 'io'],
    [0.82, { y: 0 }, 'io'],
    [1.6, { y: 3 }, 'io'],
    [2.4, { y: 0 }, 'io'],
    [3.2, { y: 3 }, 'io'],
    [4, { y: 0 }],
  ]);
  c += anim('wh-fluke', [
    [0, { y: 120, r: 0 }],
    [0.55, { y: 120, r: 0 }, 'o'],
    [0.95, { y: 0, r: -6 }, 'io'],
    [1.4, { r: 6 }, 'io'],
    [1.9, { r: -5 }, 'io'],
    [2.2, { r: 10 }, 'io'],
    [2.45, { r: -8 }, 'io'],
    [2.7, { r: 6 }, 'io'],
    [3.0, { r: 0 }],
  ], { origin: '0 60px' });
  c += L.happyCss('wh-w', 2.15);
  // l'objet : flotte, monte avec la tête, puis le jet le porte et le repose
  const yHead = BY;
  c += anim('wh-obj', [
    [0, { y: FLOAT }],
    [0.36, { y: FLOAT - 4 }, 'io'],
    [0.5, { y: FLOAT }, 'l'],
    [0.66, { y: yHead - 6 }, 'io'],
    [0.82, { y: yHead }, 'o'],
    [0.86, { y: yHead + 3 }, 'io'],
    [1.2, { y: TOP }, 'io'],
    [1.42, { y: TOP - 8 }, 'io'],
    [2.08, { y: yHead }, 'o'],
    [2.16, { y: yHead + 3 }, 'io'],
    [2.3, { y: yHead }, 'io'],
    [2.4, { y: yHead }, 'io'],
    [3.2, { y: yHead + 3 }, 'io'],
    [4, { y: yHead }],
  ]);
  c += anim('wh-osway', [[0, { r: 0 }], [1.15, { r: 0 }, 'io'], [1.35, { r: -3 }, 'io'], [1.6, { r: 3 }, 'io'], [1.85, { r: -2 }, 'io'], [2.08, { r: 0 }]]);
  c += anim('wh-ring', [[0, { o: 1, sx: 1 }], [0.4, { o: 1, sx: 1.08 }, 'o'], [0.56, { o: 0, sx: 1.3 }]], { origin: `${BX}px ${FLOAT}px` });
  // le jet : colonne (échelle verticale) + couronne (suit l'objet)
  const H0 = 6;
  const col = (h) => h / 100;
  c += anim('wh-col', [
    [0, { sy: col(H0), o: 0 }],
    [0.84, { sy: col(H0), o: 0 }, 'step'],
    [0.86, { sy: col(H0), o: 1 }, 'io'],
    [1.2, { sy: col(BY - TOP) }, 'io'],
    [1.42, { sy: col(BY - TOP + 8) }, 'io'],
    [2.08, { sy: col(H0), o: 1 }, 'step'],
    [2.1, { o: 0 }],
  ]);
  c += anim('wh-crown', [
    [0, { s: 0.3, o: 0 }],
    [0.84, { s: 0.3, o: 0 }, 'o'],
    [0.9, { s: 1, o: 1 }],
    [1.9, { s: 1, o: 1 }, 'io'],
    [2.08, { s: 0.4, o: 0 }],
  ]);
  for (let i = 0; i < 6; i += 1) {
    const side = i % 2 ? 1 : -1;
    const t0 = 1.0 + i * 0.12;
    c += anim(`wh-drop${i}`, [
      [0, { x: 0, y: 0, o: 0 }],
      [t0, { x: 0, y: 0, o: 0 }, 'l'],
      [t0 + 0.02, { o: 1 }, 'l'],
      ...L.arc(t0 + 0.02, t0 + 0.7, [0, 0], [side * (40 + i * 6), 150 + i * 10], 30, { n: 8 }),
      [t0 + 0.72, { o: 0 }],
    ]);
  }
  // petit « pfff » final, tout léger
  c += anim('wh-puff', [[0, { s: 0.2, o: 0, y: 0 }], [2.2, { s: 0.2, o: 0, y: 0 }, 'o'], [2.32, { s: 1, o: 1, y: -12 }, 'o'], [2.9, { s: 1.4, o: 0, y: -34 }]]);
  c += splashCss('wh-sp', 0.56);
  c += sparkleAnim('wh-s1', 2.2, 2.85) + sparkleAnim('wh-s2', 2.3, 2.95) + sparkleAnim('wh-s3', 2.25, 3.0);
  return c;
}

function svg() {
  const crown = `<g data-t="transform=scale({(hw*1.1+34)/100} 1)">
      <path d="M -50 0 Q -62 -14 -44 -18 Q -40 -30 -24 -24 Q -16 -36 0 -28 Q 16 -36 24 -24 Q 40 -30 44 -18 Q 62 -14 50 0 Q 0 14 -50 0 Z" fill="#ffffff"/>
      <path d="M -40 -4 Q -20 4 0 2 Q 20 4 40 -4" stroke="#bfe6f7" stroke-width="4" stroke-linecap="round" fill="none"/>
    </g>`;
  return `
  <defs>
    <clipPath id="wh-above"><rect x="-50" y="-50" width="${L.W + 100}" height="${WL + 50}"/></clipPath>
    <clipPath id="wh-below"><rect x="-50" y="${WL}" width="${L.W + 100}" height="${L.H}"/></clipPath>
    <linearGradient id="wh-colg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#bfe6f7"/><stop offset=".35" stop-color="#ffffff"/><stop offset=".7" stop-color="#ffffff"/><stop offset="1" stop-color="#bfe6f7"/></linearGradient>
  </defs>
  ${L.seaBackground({ waves: [9, 10] })}
  <g class="actors">
    <g class="wh-shade"><ellipse cx="${BX - 10}" cy="${WL + 40}" rx="170" ry="34" fill="#1d4f86"/></g>
    <g class="wh-ring"><ellipse cx="${BX}" cy="${FLOAT + 2}" data-t="rx={hw+16}" rx="80" ry="11" fill="none" stroke="#ffffff" stroke-width="3.5"/></g>
    <g clip-path="url(#wh-above)">
      <g transform="translate(${BX + 196} ${WL - 70})"><g class="wh-fluke">${fluke()}</g></g>
      <g transform="translate(${BX} ${BY})"><g class="wh-pos">${whale('wh-w')}</g></g>
    </g>
    <g clip-path="url(#wh-below)" opacity=".28">
      <g transform="translate(${BX} ${BY})"><g class="wh-pos">${whale('wh-u', { under: true })}</g></g>
    </g>
    <path d="M ${BX - 178} ${WL} Q ${BX - 120} ${WL + 8} ${BX - 60} ${WL + 2} T ${BX + 60} ${WL + 2} T ${BX + 190} ${WL}" stroke="#ffffff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".85"/>
    ${splash('wh-sp', BX - 40, WL + 2, 1.6)}
    <g transform="translate(${BX} ${BY})"><g class="wh-pos">
      <g class="wh-col"><path d="M -13 0 C -11 -30 -14 -70 -19 -100 L 19 -100 C 14 -70 11 -30 13 0 Z" fill="url(#wh-colg)"/></g>
    </g></g>
    <g transform="translate(${BX} 0)"><g class="wh-obj">
      <g class="wh-crown">${crown}</g>
      ${[0, 1, 2, 3, 4, 5].map((i) => `<g class="wh-drop${i}"><ellipse rx="${i % 2 ? 4 : 5}" ry="${i % 2 ? 5.5 : 7}" fill="#ffffff"/></g>`).join('')}
      <g class="wh-osway">${objSlot()}</g>
    </g></g>
    ${sparkle('wh-s1', 60, 520, 1.3)}${sparkle('wh-s2', 350, 500, 1.1)}${sparkle('wh-s3', 330, 400, 1.6)}
  </g>
  ${L.seaBeach()}
  <g class="actors">${L.checkButton()}</g>`;
}

export const scene: SceneModule = {
  title: 'Fête de la mer · baleine',
  box: BOX,
  svg,
  css,
};
