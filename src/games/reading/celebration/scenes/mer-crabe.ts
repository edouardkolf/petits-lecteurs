// @ts-nocheck — portage fidèle des maquettes JS validées (art en chaînes SVG) ; l'API publique est typée dans types.ts.
// Mer · crabe : sur un îlot de sable, le sable frémit… le crabe jaillit en portant l'objet au-dessus de sa tête
// entre ses pinces, puis danse de côté (gauche, droite, gauche) et s'arrête, tout fier.
import * as L from '../lib';
import type { SceneModule } from '../types';
const { anim, sparkle, sparkleAnim, objSlot, r2 } = L;

const HX = 206; // trou dans le sable
const HY = 668;
const S = 1.4;
const CARRY = -166; // base de l'objet (repère du crabe, px)
const BOX = [180, 112];
const C = {
  shell: '#f0643c',
  shellLt: '#ff8a5c',
  shellDk: '#d24a26',
  belly: '#ffb48c',
  ink: '#3d2c1e',
};
const CLAW_X = 'Math.max(Math.min(hw*0.72,60),24)';

function leg(side, i) {
  const s = side;
  const y0 = -16 - i * 9;
  const x0 = s * (38 - i * 2);
  const kx = s * (56 + i * 4);
  const fx = s * (62 + i * 6);
  return `<path d="M ${x0} ${y0} Q ${kx} ${y0 - 14} ${fx} ${-2 + i * 0}" stroke="${C.shellDk}" stroke-width="6.5" stroke-linecap="round" fill="none"/>`;
}

/** Corps du crabe (sans les bras), repère : milieu du dessous, au ras du sable. */
function crabBody(p) {
  return `<g class="${p}-legsL">${[0, 1, 2].map((i) => leg(-1, i)).join('')}</g>
    <g class="${p}-legsR">${[0, 1, 2].map((i) => leg(1, i)).join('')}</g>
    <path d="M -14 -58 L -18 -84 M 14 -58 L 18 -84" stroke="${C.shell}" stroke-width="7" stroke-linecap="round"/>
    <ellipse cx="0" cy="-32" rx="47" ry="31" fill="${C.shell}"/>
    <path d="M -44 -24 Q 0 -4 44 -24 Q 40 -4 0 -2 Q -40 -4 -44 -24 Z" fill="${C.belly}"/>
    <ellipse cx="-12" cy="-50" rx="20" ry="7" fill="${C.shellLt}" opacity=".8"/>
    <circle cx="-26" cy="-30" r="5" fill="#ff8f7a" opacity=".55"/><circle cx="26" cy="-30" r="5" fill="#ff8f7a" opacity=".55"/>
    <path d="M -9 -32 Q 0 -24 9 -32" stroke="${C.ink}" stroke-width="2.6" stroke-linecap="round" fill="none"/>
    <g class="${p}-eyes">
      <circle cx="-18" cy="-88" r="10.5" fill="#ffffff"/><circle cx="18" cy="-88" r="10.5" fill="#ffffff"/>
      <circle cx="-16.5" cy="-87" r="5.6" fill="${C.ink}"/><circle cx="19.5" cy="-87" r="5.6" fill="${C.ink}"/>
      <circle cx="-14.8" cy="-89" r="2" fill="#fff"/><circle cx="21.2" cy="-89" r="2" fill="#fff"/>
    </g>
    <g class="${p}-happy" opacity="0">
      <circle cx="-18" cy="-88" r="10.5" fill="#ffffff"/><circle cx="18" cy="-88" r="10.5" fill="#ffffff"/>
      <path d="M -23 -86 Q -18 -92 -13 -86 M 13 -86 Q 18 -92 23 -86" stroke="${C.ink}" stroke-width="2.8" stroke-linecap="round" fill="none"/>
    </g>`;
}

/** Bras + pinces (en px, positions selon la largeur de l'objet). side = -1 | 1 */
function arm(side) {
  const sx = side * 54;
  const sy = -52;
  const cx = side < 0 ? `{-${CLAW_X}}` : `{${CLAW_X}}`;
  const ex = side < 0 ? `{-${CLAW_X}-26}` : `{${CLAW_X}+26}`;
  const f = side; // les doigts s'ouvrent vers l'extérieur
  return `<path data-t="d=M ${sx} ${sy} Q ${ex} ${sy - 40} ${cx} ${CARRY + 14}" stroke="${C.shell}" stroke-width="13" stroke-linecap="round" fill="none"/>
    <g data-t="transform=translate(${cx} ${CARRY}) scale(1.12)">
      <path d="M ${-14 * f} 4 C ${-20 * f} -10 ${-12 * f} -22 ${-2 * f} -24 C ${-6 * f} -14 ${-6 * f} -6 ${-2 * f} 2 Z" fill="${C.shell}"/>
      <path d="M ${4 * f} 2 C ${10 * f} -8 ${18 * f} -14 ${22 * f} -10 C ${24 * f} -2 ${16 * f} 10 ${6 * f} 14 Z" fill="${C.shell}"/>
      <ellipse cx="${-2 * f}" cy="12" rx="17" ry="14" fill="${C.shell}"/>
      <ellipse cx="${-6 * f}" cy="7" rx="6" ry="3.5" fill="${C.shellLt}" opacity=".8"/>
    </g>`;
}

function islet() {
  return `<g>
    <ellipse cx="${HX}" cy="${HY + 22}" rx="196" ry="38" fill="#ffffff" opacity=".55"/>
    <ellipse cx="${HX}" cy="${HY + 16}" rx="178" ry="34" fill="#e8d29a"/>
    <path d="M ${HX - 170} ${HY + 12} Q ${HX - 150} ${HY - 26} ${HX} ${HY - 28} Q ${HX + 150} ${HY - 26} ${HX + 170} ${HY + 12} Q ${HX} ${HY + 34} ${HX - 170} ${HY + 12} Z" fill="#f6e7b8"/>
    <path d="M ${HX - 120} ${HY - 14} Q ${HX - 60} ${HY - 26} ${HX + 10} ${HY - 24}" stroke="#fff6d8" stroke-width="5" stroke-linecap="round" fill="none"/>
    <g transform="translate(${HX + 120} ${HY + 4})"><path d="M -10 4 Q 0 -14 10 4 Z" fill="#ffc2c7"/><path d="M 0 4 L 0 -8 M -5 4 L -2 -6 M 5 4 L 2 -6" stroke="#ff8fab" stroke-width="1.4"/></g>
    <g transform="translate(${HX - 132} ${HY + 6}) rotate(-14) scale(.8)"><path d="M 0 -14 L 4 -4 L 14 -3 L 6 4 L 9 14 L 0 8 L -9 14 L -6 4 L -14 -3 L -4 -4 Z" fill="#ff9a5a" stroke="#ff9a5a" stroke-width="4" stroke-linejoin="round"/></g>
    <ellipse cx="${HX}" cy="${HY}" rx="60" ry="14" fill="#d9bf86"/>
    <ellipse cx="${HX}" cy="${HY + 2}" rx="50" ry="10" fill="#b99a5e"/>
  </g>`;
}

function grains() {
  return [-44, -26, -10, 8, 24, 42]
    .map((dx, i) => `<g class="cr-g${i}"><circle r="${i % 2 ? 4 : 5.5}" fill="${i % 2 ? '#e8d29a' : '#f6e7b8'}"/></g>`)
    .join('');
}

function css() {
  let c = L.actorsCss() + L.checkButtonCss();
  // anticipation : le sable frémit
  c += anim('cr-mound', [
    [0, { sx: 1, sy: 1 }],
    [0.08, { sx: 1.05, sy: 1.5 }, 'io'],
    [0.16, { sx: 1, sy: 1 }, 'io'],
    [0.24, { sx: 1.08, sy: 1.8 }, 'io'],
    [0.32, { sx: 1, sy: 1 }],
  ], { origin: '0 0' });
  // jaillissement, puis danse de côté
  const dance = [
    [0, { x: 0, y: 330 }],
    [0.32, { x: 0, y: 330 }, 'o'],
    [0.6, { x: 0, y: -16 }, 'io'],
    [0.72, { x: 0, y: 0 }],
  ];
  const steps = [[0.86, -38], [1.14, 34], [1.42, -24], [1.7, 0]];
  let t = 0.86;
  for (const [ts, x] of steps) {
    dance.push([ts, { y: 0 }, 'io']);
    dance.push([ts + 0.1, { x: (x + (dance[dance.length - 2][1].x || 0)) / 2, y: -10 }, 'io']);
    dance.push([ts + 0.22, { x, y: 0 }]);
    t = ts;
  }
  void t;
  dance.push([2.02, { y: 0 }, 'o'], [2.14, { y: -22 }, 'i'], [2.26, { y: 0 }]);
  c += anim('cr-pos', dance);
  c += anim('cr-squash', [
    [0.6, { sx: 0.92, sy: 1.08 }],
    [0.72, { sx: 1.08, sy: 0.92 }],
    [0.84, { sx: 1, sy: 1 }],
    [2.24, { sx: 1, sy: 1 }, 'o'],
    [2.28, { sx: 1.08, sy: 0.92 }, 'o'],
    [2.4, { sx: 1, sy: 1 }],
  ]);
  const legs = (k) => {
    const fr = [[0, { r: 0 }]];
    for (const [ts] of steps) fr.push([ts, { r: 0 }, 'io'], [ts + 0.1, { r: 8 * k }, 'io'], [ts + 0.22, { r: 0 }]);
    return fr;
  };
  c += anim('cr-c-legsL', legs(1), { origin: '-30px -20px' });
  c += anim('cr-c-legsR', legs(-1), { origin: '30px -20px' });
  // l'objet tangue pendant la danse
  const sway = [[0, { r: 0 }], [0.72, { r: 0 }, 'io']];
  [[0.96, -5], [1.24, 5], [1.52, -4], [1.8, 2], [2.0, 0]].forEach(([ts, r]) => sway.push([ts, { r }, 'io']));
  c += anim('cr-sway', sway);
  c += L.happyCss('cr-c', 2.1);
  [-44, -26, -10, 8, 24, 42].forEach((dx, i) => {
    c += anim(`cr-g${i}`, [
      [0, { x: dx * 0.6, y: 0, o: 0 }],
      [0.34, { x: dx * 0.6, y: 0, o: 0 }, 'l'],
      [0.36, { o: 1 }, 'l'],
      ...L.arc(0.36, 0.86, [dx * 0.6, 0], [dx * 2.8, 30 + (i % 3) * 6], 60 + (i % 2) * 26, { n: 8 }),
      [1.2, { o: 1 }, 'l'],
      [1.4, { o: 0 }],
    ]);
  });
  c += sparkleAnim('cr-sp1', 2.2, 2.85) + sparkleAnim('cr-sp2', 2.3, 2.95) + sparkleAnim('cr-sp3', 2.25, 3.0);
  return c;
}

function svg() {
  const clip = `<clipPath id="cr-clip"><path d="M -50 -50 H ${L.W + 50} V ${HY} H ${HX + 50} A 50 10 0 0 1 ${HX - 50} ${HY} H -50 Z"/></clipPath>`;
  return `
  <defs>${clip}</defs>
  ${L.seaBackground({ waves: [8, 9, 10, 11] })}
  ${islet()}
  <g class="actors">
    <g transform="translate(${HX} ${HY})"><g class="cr-mound"><ellipse cx="0" cy="0" rx="22" ry="6" fill="#e8d29a"/></g></g>
    <g transform="translate(${HX} ${HY - 2})">${grains()}</g>
    <g clip-path="url(#cr-clip)">
      <g transform="translate(${HX} ${HY})"><g class="cr-pos"><g class="cr-squash">
        <g transform="translate(0 ${CARRY})"><g class="cr-sway"><g transform="translate(0 ${-CARRY})">
          <g transform="translate(0 ${CARRY})">${objSlot()}</g>
          ${arm(-1)}${arm(1)}
        </g></g></g>
        <g transform="scale(${S})">${crabBody('cr-c')}</g>
      </g></g></g>
    </g>
    ${sparkle('cr-sp1', 60, 560, 1.3)}${sparkle('cr-sp2', 360, 520, 1.1)}${sparkle('cr-sp3', 330, 400, 1.6)}
  </g>
  ${L.seaBeach()}
  <g class="actors">${L.checkButton()}</g>`;
}

export const scene: SceneModule = {
  title: 'Fête de la mer · crabe',
  box: BOX,
  svg,
  css,
};
