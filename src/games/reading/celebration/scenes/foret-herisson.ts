// @ts-nocheck — portage fidèle des maquettes JS validées (art en chaînes SVG) ; l'API publique est typée dans types.ts.
// Forêt · hérisson : roulé en boule, il arrive en roulant et pousse l'objet, qui bascule vers l'avant,
// se redresse en retombant et rebondit ; le hérisson se déroule et se met debout à côté.
import * as L from '../lib';
import type { SceneModule } from '../types';
const { anim, arc, sparkle, sparkleAnim, puff, puffAnim, objSlot, r2 } = L;

const G = 652; // sol
const S = 1.45; // échelle du hérisson
const BR = 44 * S; // rayon de la boule
const START = 486; // centre de la boule à t = 0 (hors champ)
const CONTACT = 388; // centre de la boule au contact
const E0 = CONTACT - BR + 2; // bord droit de l'objet au départ
const D1 = 72; // 1re culbute
const D2 = 24; // petit rebond
const E2 = E0 - D1 - D2; // bord droit final
const STOP = E2 + 84; // centre final du hérisson
const BOX = [190, 112];
const T_HIT = 0.5;

const C = {
  spine: '#8a5a3b',
  spineDk: '#6e4529',
  spineLt: '#b48056',
  face: '#f6dcb6',
  belly: '#f0d0a4',
  ink: '#3d2c1e',
  feet: '#7a4a2a',
};

/** Couronne de piquants (polygone en zigzag) autour de (cx, cy). */
function spikes(cx, cy, r, n, a0, a1, len, fill) {
  const pts = [];
  for (let i = 0; i <= n * 2; i += 1) {
    const a = ((a0 + ((a1 - a0) * i) / (n * 2)) * Math.PI) / 180;
    const rr = i % 2 ? r + len : r;
    pts.push(`${r2(cx + Math.cos(a) * rr)} ${r2(cy + Math.sin(a) * rr)}`);
  }
  return `<path d="M ${cx} ${cy} L ${pts.join(' L ')} Z" fill="${fill}" stroke="${fill}" stroke-width="3" stroke-linejoin="round"/>`;
}
/** Petits traits clairs de piquants. */
function quills(cx, cy, r0, r1, angles, col) {
  return angles
    .map((d) => {
      const a = (d * Math.PI) / 180;
      return `M ${r2(cx + Math.cos(a) * r0)} ${r2(cy + Math.sin(a) * r0)} L ${r2(cx + Math.cos(a + 0.12) * r1)} ${r2(cy + Math.sin(a + 0.12) * r1)}`;
    })
    .map((d) => `<path d="${d}" stroke="${col}" stroke-width="3.2" stroke-linecap="round"/>`)
    .join('');
}

/** Hérisson debout, de face (repère : entre les pieds). */
function hedgehog(p) {
  return `<g class="${p}-squash">
    ${spikes(0, -58, 45, 14, 150, 390, 11, C.spineDk)}
    <circle cx="0" cy="-58" r="45" fill="${C.spine}"/>
    ${quills(0, -58, 28, 43, [190, 215, 240, 265, 290, 315, 340, 5], C.spineLt)}
    <ellipse cx="-13" cy="-3" rx="11" ry="6" fill="${C.feet}"/><ellipse cx="13" cy="-3" rx="11" ry="6" fill="${C.feet}"/>
    <ellipse cx="0" cy="-28" rx="27" ry="27" fill="${C.belly}"/>
    <g transform="translate(-25 -36)"><g class="${p}-armL"><ellipse cx="0" cy="11" rx="6.5" ry="13" fill="${C.feet}"/></g></g>
    <g transform="translate(25 -36)"><g class="${p}-armR"><ellipse cx="0" cy="11" rx="6.5" ry="13" fill="${C.feet}"/></g></g>
    <g class="${p}-head">
      <circle cx="-25" cy="-90" r="8" fill="${C.face}"/><circle cx="25" cy="-90" r="8" fill="${C.face}"/>
      <circle cx="-25" cy="-90" r="4.2" fill="#e9a99a"/><circle cx="25" cy="-90" r="4.2" fill="#e9a99a"/>
      <path d="M -32 -70 C -32 -92 -16 -100 0 -100 C 16 -100 32 -92 32 -70 C 32 -56 18 -46 0 -46 C -18 -46 -32 -56 -32 -70 Z" fill="${C.face}"/>
      <path d="M -30 -80 L -24 -92 L -18 -84 L -12 -98 L -6 -88 L 0 -101 L 6 -88 L 12 -98 L 18 -84 L 24 -92 L 30 -80 C 26 -96 14 -104 0 -104 C -14 -104 -26 -96 -30 -80 Z" fill="${C.spine}" stroke="${C.spine}" stroke-width="2" stroke-linejoin="round"/>
      <ellipse cx="0" cy="-56" rx="13" ry="10" fill="#fbe8cc"/>
      <circle cx="-21" cy="-62" r="5" fill="#ff8f7a" opacity=".45"/><circle cx="21" cy="-62" r="5" fill="#ff8f7a" opacity=".45"/>
      <g class="${p}-eyes">
        <circle cx="-12" cy="-73" r="5" fill="${C.ink}"/><circle cx="12" cy="-73" r="5" fill="${C.ink}"/>
        <circle cx="-10.4" cy="-74.8" r="1.8" fill="#fff"/><circle cx="13.6" cy="-74.8" r="1.8" fill="#fff"/>
      </g>
      <g class="${p}-happy" opacity="0"><path d="M -16 -72 Q -12 -78 -8 -72 M 8 -72 Q 12 -78 16 -72" stroke="${C.ink}" stroke-width="2.8" stroke-linecap="round" fill="none"/></g>
      <ellipse cx="0" cy="-61" rx="5.8" ry="4.4" fill="#2b1d14"/><ellipse cx="-1.6" cy="-62.4" rx="1.8" ry="1.1" fill="#fff" opacity=".7"/>
      <path d="M -5 -52 Q 0 -48 5 -52" stroke="${C.ink}" stroke-width="2" stroke-linecap="round" fill="none"/>
    </g>
  </g>`;
}

/** Hérisson roulé en boule (centre en 0,0), petit museau rentré visible. */
function ball() {
  return `<g>
    ${spikes(0, 0, 38, 16, 0, 360, 11, C.spineDk)}
    <circle r="39" fill="${C.spine}"/>
    ${quills(0, 0, 14, 35, [0, 45, 90, 135, 180, 225, 270, 315], C.spineLt)}
    <path d="M 8 30 C 22 26 32 14 33 2 C 25 8 15 14 4 17 Z" fill="${C.face}"/>
    <path d="M 18 16 Q 22 13 26 15" stroke="${C.ink}" stroke-width="2.2" stroke-linecap="round" fill="none"/>
    <circle cx="10" cy="24" r="3.6" fill="#2b1d14"/>
  </g>`;
}

/** Position de la boule (centre) : arrivée, contact, poursuite ralentie, arrêt. Rotation = roulement. */
function ballFrames() {
  const fr = [];
  const pts = [];
  const seg = (t0, t1, x0, x1, ease, n) => {
    for (let i = 0; i <= n; i += 1) {
      const u = i / n;
      pts.push([t0 + (t1 - t0) * u, x0 + (x1 - x0) * ease(u)]);
    }
  };
  seg(0, T_HIT, START, CONTACT, (u) => u * (1.15 - 0.15 * u), 6);
  seg(T_HIT, 0.62, CONTACT, CONTACT + 6, (u) => Math.sin((u * Math.PI) / 2), 2);
  seg(0.62, 1.4, CONTACT + 6, STOP, (u) => 1 - (1 - u) * (1 - u), 8);
  let rot = 0;
  let px = pts[0][1];
  for (const [t, x] of pts) {
    rot += ((x - px) / BR) * (180 / Math.PI);
    px = x;
    fr.push([t, { x, y: G - BR, r: rot }, 'l']);
  }
  fr.push([1.48, { x: STOP + 3, r: rot + 4 }, 'io'], [1.56, { x: STOP, r: rot }]);
  return fr;
}

function css() {
  let c = L.actorsCss() + L.checkButtonCss() + L.treeCrownCss(30);
  c += anim('he-ball', ballFrames());
  c += anim('he-bsq', [
    [0, { sx: 1, sy: 1 }],
    [T_HIT, { sx: 1, sy: 1 }, 'o'],
    [T_HIT + 0.05, { sx: 0.88, sy: 1.08 }, 'io'],
    [T_HIT + 0.16, { sx: 1, sy: 1 }],
    [1.5, { sx: 1, sy: 1 }, 'io'],
    [1.6, { sx: 1.14, sy: 0.84 }],
  ], { origin: `0 ${BR}px` });
  c += anim('he-ballvis', [[0, { o: 1 }], [1.6, { o: 1 }, 'step'], [1.62, { o: 0 }]]);
  c += anim('he-bshadow', [...ballFrames().map(([t, p, e]) => [t, { x: p.x, o: 1 }, e]), [1.6, { o: 1 }, 'step'], [1.62, { o: 0 }]]);
  // hérisson debout
  c += anim('he-stand', [
    [0, { o: 0, sx: 1.1, sy: 0.6 }],
    [1.6, { o: 0, sx: 1.1, sy: 0.6 }, 'step'],
    [1.62, { o: 1 }, 'back'],
    [1.82, { sx: 1, sy: 1 }],
    [1.98, { sx: 1, sy: 1, y: 0 }, 'o'],
    [2.1, { y: -20 }, 'i'],
    [2.22, { y: 0, sx: 1.08, sy: 0.92 }, 'o'],
    [2.34, { sx: 1, sy: 1 }],
  ], { origin: `${STOP}px ${G}px` });
  c += anim('he-h-armL', [[0, { r: 0 }], [1.8, { r: 0 }, 'back'], [2.1, { r: 140 }], [2.3, { r: 120 }, 'io'], [2.5, { r: 140 }, 'io'], [2.7, { r: 125 }]]);
  c += anim('he-h-armR', [[0, { r: 0 }], [1.8, { r: 0 }, 'back'], [2.1, { r: -140 }], [2.3, { r: -120 }, 'io'], [2.5, { r: -140 }, 'io'], [2.7, { r: -125 }]]);
  c += anim('he-h-head', [[1.7, { r: 0 }], [1.85, { r: -6 }], [2.0, { r: 0 }]], { origin: '0 -60px' });
  c += L.happyCss('he-h', 2.15);
  // objet : repère du bord droit (décalage -hw appliqué en dehors) ; il tourne autour de son centre
  const cy = [G, -0.5];
  const P0 = [E0, cy];
  const P1 = [E0 - D1, cy];
  const P2 = [E2, cy];
  c += anim('he-opos', [
    [0, { x: E0, y: cy }],
    [T_HIT, { x: E0, y: cy }, 'o'],
    [T_HIT + 0.08, { x: E0 - 4, y: [G - 6, -0.5] }, 'io'],
    [0.6, { x: E0, y: cy }, 'l'],
    ...arc(0.6, 1.12, P0, P1, 96, { n: 14 }),
    ...arc(1.12, 1.36, P1, P2, 24, { n: 6 }),
  ]);
  const rots = [[0, { r: 0 }], [T_HIT, { r: 0 }, 'o'], [T_HIT + 0.08, { r: -7 }, 'io'], [0.6, { r: 0 }, 'l']];
  // bascule vers l'avant (≈ un demi-tour de culbute) puis se redresse en retombant, petit rebond, tient debout
  rots.push([0.84, { r: -95 }, 'io'], [1.08, { r: 6 }, 'io'], [1.16, { r: 0 }, 'io'], [1.26, { r: -6 }, 'io'], [1.38, { r: 2 }, 'io'], [1.5, { r: 0 }]);
  c += anim('he-orot', rots);
  c += anim('he-osq', [
    [0, { sx: 1, sy: 1 }],
    [1.1, { sx: 1, sy: 1 }, 'o'],
    [1.14, { sx: 1.08, sy: 0.9 }, 'o'],
    [1.22, { sx: 1, sy: 1 }],
    [1.35, { sx: 1, sy: 1 }, 'o'],
    [1.39, { sx: 1.07, sy: 0.92 }, 'o'],
    [1.5, { sx: 0.98, sy: 1.02 }, 'io'],
    [1.62, { sx: 1, sy: 1 }],
  ]);
  const shadowFr = [[0, { x: E0, s: 1 }], [0.6, { x: E0, s: 1 }, 'l']];
  for (let i = 1; i <= 8; i += 1) {
    const u = i / 8;
    shadowFr.push([0.6 + 0.52 * u, { x: E0 - D1 * u, s: 1 - 0.5 * 4 * u * (1 - u) }, 'l']);
  }
  shadowFr.push([1.24, { x: E0 - D1 - D2 * 0.5, s: 0.92 }, 'l'], [1.36, { x: E2, s: 1 }]);
  c += anim('he-oshadow', shadowFr);
  c += puffAnim('he-d1', 1.12) + puffAnim('he-d2', 1.37);
  c += sparkleAnim('he-sp1', 2.2, 2.85) + sparkleAnim('he-sp2', 2.3, 2.95) + sparkleAnim('he-sp3', 2.25, 3.0);
  return c;
}

function svg() {
  return `
  ${L.forestBackground(30)}
  <g class="actors">
    <g data-t="transform=translate({-hw} ${G + 2})"><g class="he-oshadow"><ellipse data-t="rx={hw*0.95+8}" rx="60" ry="9" fill="#28401a" opacity=".2"/></g></g>
    <g transform="translate(0 ${G + 2})"><g class="he-bshadow"><ellipse rx="${BR * 0.95}" ry="9" fill="#28401a" opacity=".2"/></g></g>
    <g data-t="transform=translate({-hw} 0)">
      <g class="he-opos"><g class="he-orot"><g data-t="transform=translate(0 {hh/2})"><g class="he-osq">${objSlot()}</g></g></g></g>
    </g>
    <g data-t="transform=translate({-hw} 0)">${puff('he-d1', E0 - D1, G + 2, 0.9)}${puff('he-d2', E2, G + 2, 0.8)}</g>
    <g class="he-ballvis"><g class="he-ball"><g class="he-bsq"><g transform="scale(${S})">${ball()}</g></g></g></g>
    <g class="he-stand"><g transform="translate(${STOP} ${G}) scale(${S})">${hedgehog('he-h')}</g></g>
    ${sparkle('he-sp1', 120, 520, 1.3)}${sparkle('he-sp2', 230, 470, 1.1)}${sparkle('he-sp3', 360, 470, 1.6)}
    ${L.checkButton()}
  </g>`;
}

export const scene: SceneModule = {
  title: 'Fête de la forêt · hérisson',
  box: BOX,
  svg,
  css,
};
