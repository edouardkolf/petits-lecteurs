// @ts-nocheck — portage fidèle des maquettes JS validées (art en chaînes SVG) ; l'API publique est typée dans types.ts.
// Mer · dauphin (révisé) : l'objet flotte sur l'eau ; le dauphin bondit PAR-DESSUS en grand arc, plouf,
// puis sort la tête à côté de l'objet et sourit. Aucune ouverture de la lettre n'est utilisée.
import * as L from '../lib';
import type { SceneModule } from '../types';
const { anim, arc, arcStart, sparkle, sparkleAnim, splash, splashCss, objSlot } = L;

const WL = 740; // ligne d'eau (là où le dauphin perce la surface)
const X_O = 178;
const Y_O = 706; // base de l'objet flottant
const J0 = [-6, 820];
const J1 = [396, 820];
const JH = 322; // sommet du centre à y = 498
const TJ0 = 0.7;
const TJ1 = 2.1;
const BOX = [170, 120];

function dolphin(p) {
  return `<g class="${p}">
    <path d="M -58 4 C -68 -2 -78 -14 -88 -18 C -85 -8 -81 -1 -77 4 C -81 8 -86 18 -86 27 C -77 20 -68 12 -58 10 Z" fill="#3f86c6"/>
    <path d="M -8 -26 C -6 -42 4 -50 15 -50 C 8 -42 8 -32 14 -23 Z" fill="#3f86c6"/>
    <path d="M -64 6 C -44 -18 4 -32 44 -20 C 58 -16 66 -8 76 -6 C 85 -4 85 2 77 4 C 64 7 54 12 40 16 C 4 26 -38 22 -64 6 Z" fill="#4f9ad8"/>
    <path d="M -42 12 C -10 19 22 16 50 9 C 60 7 70 5 77 4 C 64 7 54 12 40 16 C 6 25 -22 23 -42 12 Z" fill="#dff1ff"/>
    <path d="M -34 -12 C -12 -23 14 -25 34 -19" stroke="#86c3ef" stroke-width="4.5" stroke-linecap="round" fill="none"/>
    <path d="M 8 9 C 4 23 -6 30 -15 32 C -11 22 -6 14 -2 9 Z" fill="#3f86c6"/>
    <circle cx="50" cy="2" r="4.4" fill="#ff9aa9" opacity=".55"/>
    <g class="${p}-eye"><circle cx="46" cy="-7" r="4.4" fill="#24496b"/><circle cx="47.3" cy="-8.4" r="1.6" fill="#fff"/></g>
    <path d="M 59 2.5 Q 67 7 75 2" stroke="#24496b" stroke-width="2" stroke-linecap="round" fill="none"/>
  </g>`;
}

/** Dauphin dressé hors de l'eau, tourné vers la gauche (vers l'objet) ; origine à la ligne d'eau. */
function dolphinUp(p) {
  return `<g class="${p}">
    <path d="M 22 -46 C 32 -50 40 -60 42 -70 C 34 -68 26 -62 21 -56 Z" fill="#3f86c6"/>
    <path d="M -26 12 C -30 -28 -26 -60 -8 -78 C 4 -90 20 -88 26 -74 C 33 -56 32 -20 30 12 Z" fill="#4f9ad8"/>
    <path d="M -22 12 C -24 -16 -20 -40 -12 -54 C -4 -44 -2 -20 -2 12 Z" fill="#dff1ff"/>
    <path d="M -12 -70 C -28 -70 -42 -66 -50 -59 C -46 -52 -30 -51 -12 -53 Z" fill="#4f9ad8"/>
    <path d="M -48 -57 C -38 -53 -26 -52 -13 -54 L -12 -51 C -28 -49 -42 -51 -48 -57 Z" fill="#dff1ff"/>
    <path d="M -2 -80 C 6 -86 16 -84 20 -76" stroke="#86c3ef" stroke-width="4.5" stroke-linecap="round" fill="none"/>
    <circle cx="-15" cy="-60" r="4.6" fill="#ff9aa9" opacity=".55"/>
    <g class="${p}-eyes"><circle cx="-4" cy="-68" r="4.6" fill="#24496b"/><circle cx="-2.6" cy="-69.5" r="1.6" fill="#fff"/></g>
    <g class="${p}-happy" opacity="0"><path d="M -8.5 -67 Q -4 -72.5 0.5 -67" stroke="#24496b" stroke-width="2.4" stroke-linecap="round" fill="none"/></g>
    <path d="M -46 -56 Q -32 -48 -17 -53" stroke="#24496b" stroke-width="2.2" stroke-linecap="round" fill="none"/>
    <g transform="translate(-18 -26)"><g class="${p}-flip"><path d="M 0 0 C -14 -2 -24 -10 -29 -21 C -17 -17 -8 -13 2 -8 Z" fill="#3f86c6"/></g></g>
  </g>`;
}

function css() {
  let c = L.actorsCss() + L.checkButtonCss();
  // l'objet flotte (balancement doux), frémit quand le dauphin passe, tangue à la vague du plouf
  c += anim('me-bob', [[0, { y: 0 }], [0.7, { y: -6 }], [1.4, { y: 0 }], [2.1, { y: -6 }], [2.8, { y: 0 }], [3.5, { y: -5 }], [4, { y: 0 }]]);
  c += anim('me-tilt', [
    [0, { r: 0 }],
    [1.25, { r: 0 }, 'io'],
    [1.45, { r: 4, y: -10 }, 'io'],
    [1.65, { r: -2, y: 0 }, 'io'],
    [2.0, { r: 0 }, 'io'],
    [2.2, { r: 3 }, 'io'],
    [2.45, { r: -1.5 }, 'io'],
    [2.7, { r: 0 }],
  ], { origin: `${X_O}px ${Y_O}px` });
  c += anim('me-ring', [[0, { sx: 1, o: 0.9 }], [0.7, { sx: 1.06, o: 0.6 }], [1.4, { sx: 1, o: 0.9 }], [2.1, { sx: 1.06, o: 0.6 }], [2.8, { sx: 1, o: 0.9 }], [3.5, { sx: 1.05, o: 0.7 }], [4, { sx: 1, o: 0.9 }]], { origin: `${X_O}px ${Y_O}px` });
  // aileron qui approche, puis plonge
  c += anim('me-fin', [
    [0, { x: 16, y: WL + 2, o: 1 }],
    [0.5, { x: 50, y: WL + 2 }, 'i'],
    [0.66, { x: 60, y: WL + 34 }],
    [3.99, { x: 60, y: WL + 34 }],
  ]);
  c += anim('me-wake', [[0, { x: 16, y: WL + 6, sx: 0.6, o: 0.8 }], [0.5, { x: 50, sx: 1, o: 0.8 }, 'o'], [0.8, { x: 56, sx: 1.4, o: 0 }]]);
  // le saut, par-dessus l'objet
  c += anim('me-dol', [
    [0, { ...arcStart(0, J0, J1, JH, { rot: true })[1], o: 1 }],
    arcStart(TJ0, J0, J1, JH, { rot: true }),
    ...arc(TJ0, TJ1, J0, J1, JH, { n: 28, rot: true, hang: 0.8 }),
  ]);
  c += anim('me-dshadow', [[0, { x: 60, sx: 0.3, o: 0 }], [0.85, { x: 70, sx: 0.4, o: 0 }, 'io'], [1.4, { x: 206, sx: 1, o: 1 }, 'io'], [1.95, { x: 340, sx: 0.4, o: 0 }]]);
  c += splashCss('me-sp1', 0.76) + splashCss('me-sp2', 2.0);
  // la tête ressort près de l'objet et le regarde
  c += anim('me-head', [
    [0, { y: 110 }],
    [2.15, { y: 110 }, 'back'],
    [2.5, { y: 0 }, 'io'],
    [3.0, { y: 5 }, 'io'],
    [3.5, { y: 0 }],
  ]);
  c += anim('me-up-flip', [[0, { r: 0 }], [2.45, { r: 0 }, 'io'], [2.65, { r: 28 }, 'io'], [2.85, { r: 0 }, 'io'], [3.05, { r: 22 }, 'io'], [3.25, { r: 0 }]]);
  c += L.happyCss('me-up', 2.6);
  c += anim('me-head-ring', [[0, { s: 0.2, o: 0 }], [2.25, { s: 0.2, o: 0 }, 'o'], [2.45, { s: 1, o: 1 }]]);
  c += sparkleAnim('me-s1', 2.3, 2.95) + sparkleAnim('me-s2', 2.38, 3.05) + sparkleAnim('me-s3', 2.26, 2.9);
  return c;
}

function svg() {
  return `
  <defs><clipPath id="me-water"><rect x="-50" y="-50" width="${L.W + 100}" height="${WL + 50}"/></clipPath></defs>
  ${L.seaBackground({ waves: [9, 10] })}
  <g class="actors">
    <g clip-path="url(#me-water)">
      <g class="me-wake"><path d="M -60 0 Q -30 -5 0 0" stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none"/></g>
      <g class="me-fin"><path d="M -14 0 C -10 -18 2 -28 14 -28 C 8 -18 8 -8 14 0 Z" fill="#3f86c6"/></g>
    </g>
    <g transform="translate(0 ${Y_O + 6})"><g class="me-dshadow"><ellipse rx="70" ry="8" fill="#1d5f96" opacity=".18"/></g></g>
    <!-- le dauphin passe derrière l'objet flottant quand il jaillit, puis bien au-dessus -->
    <g clip-path="url(#me-water)">
      <g class="me-dol"><g transform="scale(1.2)">${dolphin('me-dolphin')}</g></g>
    </g>
    <g class="me-ring"><ellipse cx="${X_O}" cy="${Y_O + 2}" data-t="rx={hw+16}" rx="80" ry="11" fill="#2f86bf" opacity=".22"/>
      <ellipse cx="${X_O}" cy="${Y_O + 2}" data-t="rx={hw+16}" rx="80" ry="11" fill="none" stroke="#ffffff" stroke-width="3.5"/></g>
    <g class="me-tilt"><g transform="translate(${X_O} ${Y_O})"><g class="me-bob">${objSlot()}</g></g></g>
    <g class="me-ring"><path data-t="d=M {${X_O}-hw-14} ${Y_O + 4} Q {${X_O}-hw*0.5} ${Y_O + 16} ${X_O} ${Y_O + 14} T {${X_O}+hw+14} ${Y_O + 4}" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" fill="none"/></g>
    ${splash('me-sp1', 24, WL + 2, 1)}
    ${splash('me-sp2', 366, WL + 2, 1.2)}
    <g transform="translate(352 ${WL + 2})"><g class="me-head-ring"><ellipse rx="42" ry="9" fill="#ffffff" opacity=".85"/></g></g>
    <g clip-path="url(#me-water)">
      <g transform="translate(352 ${WL})"><g class="me-head">
        <g transform="scale(1.3)">${dolphinUp('me-up')}</g>
      </g></g>
    </g>
    ${sparkle('me-s1', 70, 560, 1.3)}${sparkle('me-s2', 300, 560, 1.1)}${sparkle('me-s3', 250, 450, 1.6)}
  </g>
  ${L.seaBeach()}
  <g class="actors">${L.checkButton()}</g>`;
}

export const scene: SceneModule = {
  title: 'Fête de la mer · dauphin',
  box: BOX,
  svg,
  css,
};
