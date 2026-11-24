// @ts-nocheck — portage fidèle des maquettes JS validées (art en chaînes SVG) ; l'API publique est typée dans scenes/index.ts.
// Outils communs des scènes de fête (2e tour) : minutage, objet universel (lettre(s) ou étoile),
// décors des quatre mondes. Portage fidèle des maquettes validées (mêmes tracés, mêmes keyframes).
const T = 4; // durée de la ligne de temps des keyframes (s) ; l'animation s'arrête à SETTLE, sur la pose finale.
const W = 412;
const H = 915;
const SETTLE = 3.0; // instant de la pose finale : l'animation joue une seule fois jusque-là puis y reste

const EASE = {
  io: 'ease-in-out',
  i: 'cubic-bezier(.5,0,.9,.6)',
  o: 'cubic-bezier(.2,.7,.4,1)',
  l: 'linear',
  back: 'cubic-bezier(.3,1.7,.5,1)',
  soft: 'cubic-bezier(.35,0,.25,1)',
  step: 'steps(1,end)',
};

const r2 = (n) => Math.round(n * 100) / 100;

// Une coordonnée peut dépendre de la taille réelle de l'objet : [b, k] = b + k·hw (x) ou b + k·hh (y).
// hw = demi-largeur de l'objet affiché, hh = sa hauteur ; posées en variables CSS (--hw, --hh) par la page.
const isPair = (v) => Array.isArray(v);
const pair = (v) => (isPair(v) ? v : [v, 0]);
const lin = (a, b, u) => {
  const A = pair(a);
  const B = pair(b);
  return [A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u];
};
const cssLen = (v, varName) => {
  const [b, k] = pair(v);
  if (!k) return `${r2(b)}px`;
  return `calc(${r2(b)}px + var(${varName}) * ${r2(k)}px)`;
};
// valeurs typiques (objet « M ») pour orienter les trajectoires
const HW0 = 68;
const HH0 = 110;
const num = (v, ref) => pair(v)[0] + pair(v)[1] * ref;

/**
 * Keyframes CSS à partir d'instants en secondes.
 * frames : [t, {x,y,r,s,sx,sy,k,o}, ease?] — les valeurs absentes reprennent la précédente.
 * ease s'applique au segment qui part de cet instant.
 */
function anim(cls, frames, { origin = '0 0' } = {}) {
  const hasO = frames.some((f) => f[1].o !== undefined);
  const hasT = frames.some((f) => Object.keys(f[1]).some((k) => k !== 'o'));
  let st = { x: 0, y: 0, r: 0, sx: 1, sy: 1, k: 0, o: 1 };
  const list = [...frames].sort((a, b) => a[0] - b[0]);
  if (list[0][0] > 0) list.unshift([0, {}, list[0][2]]);
  if (list[list.length - 1][0] < T) list.push([T, {}]);
  const out = [];
  for (const [t, p, e] of list) {
    st = { ...st, ...p };
    if (p.s !== undefined) {
      st.sx = p.s;
      st.sy = p.s;
    }
    const parts = [];
    if (hasT)
      parts.push(
        `transform:translate(${cssLen(st.x, '--hw')},${cssLen(st.y, '--hh')}) rotate(${r2(st.r)}deg)${st.k ? ` skewY(${r2(st.k)}deg)` : ''} scale(${r2(st.sx)},${r2(st.sy)})`,
      );
    if (hasO) parts.push(`opacity:${r2(st.o)}`);
    parts.push(`animation-timing-function:${EASE[e || 'io'] || e}`);
    out.push(`${r2((t / T) * 100)}%{${parts.join(';')}}`);
  }
  return `.${cls}{animation:${cls} ${T}s ${SETTLE / T} forwards;transform-origin:${origin};transform-box:view-box}\n@keyframes ${cls}{${out.join('')}}\n`;
}

/** Bond en parabole (h au-dessus de la droite), échantillonné ; rot : orientation selon la tangente. */
function arc(t0, t1, p0, p1, h, { n = 10, rot = false, rotK = 1, rotOff = 0, extra = {}, hang = 0, ease = 'l' } = {}) {
  const fr = [];
  for (let i = 1; i <= n; i += 1) {
    const tau = i / n;
    const u = tau + (hang / (2 * Math.PI)) * Math.sin(2 * Math.PI * tau);
    const t = t0 + (t1 - t0) * tau;
    const x = lin(p0[0], p1[0], u);
    const yl = lin(p0[1], p1[1], u);
    const y = [yl[0] - 4 * h * u * (1 - u), yl[1]];
    const p = { x: x[1] ? x : x[0], y: y[1] ? y : y[0], ...extra };
    if (rot) {
      const dx = num(p1[0], HW0) - num(p0[0], HW0);
      const dy = num(p1[1], HH0) - num(p0[1], HH0) - 4 * h * (1 - 2 * u);
      p.r = ((Math.atan2(dy, dx) * 180) / Math.PI) * rotK + rotOff;
    }
    fr.push([t, p, ease]);
  }
  return fr;
}

/** Repère de départ d'un arc (même orientation que son premier échantillon). */
function arcStart(t0, p0, p1, h, { rot = false, rotK = 1, rotOff = 0, ease = 'l', extra = {} } = {}) {
  const p = { x: p0[0], y: p0[1], ...extra };
  if (rot) {
    const dx = num(p1[0], HW0) - num(p0[0], HW0);
    p.r = ((Math.atan2(num(p1[1], HH0) - num(p0[1], HH0) - 4 * h, dx) * 180) / Math.PI) * rotK + rotOff;
  }
  return [t0, p, ease];
}

/** Petit saut sur place / squash-stretch d'atterrissage, prêts à l'emploi. */
const land = (t, a = 0.13) => [
  [t - 0.04, { sx: 0.96, sy: 1.05 }, 'o'],
  [t + 0.03, { sx: 1 + a, sy: 1 - a }, 'o'],
  [t + 0.13, { sx: 0.97, sy: 1.03 }, 'io'],
  [t + 0.24, { sx: 1, sy: 1 }],
];

import { objSlot } from './object';

// ---------- Étincelle douce ----------
const SPARK = 'M 0 -9 Q 1 -1 9 0 Q 1 1 0 9 Q -1 1 -9 0 Q -1 -1 0 -9 Z';
function sparkle(cls, x, y, s = 1, fill = '#fff6c2') {
  return `<g transform="translate(${x} ${y}) scale(${s})"><g class="${cls}"><path d="${SPARK}" fill="${fill}"/></g></g>`;
}
/** Étincelle qui naît, tourne un peu et s'éteint entre t0 et t1. */
function sparkleAnim(cls, t0, t1) {
  const m = (t0 + t1) / 2;
  return anim(cls, [
    [0, { s: 0, r: 0 }],
    [t0, { s: 0, r: -20 }, 'o'],
    [m, { s: 1, r: 0 }, 'io'],
    [t1, { s: 0, r: 25 }],
  ]);
}

/** Petit nuage de poussière (trois boules) qui gonfle et s'efface ; posé en (x,y). */
function puff(cls, x, y, s = 1, fill = '#fbf1d3') {
  return [[-1, 0], [1, 1], [0, 2]]
    .map(
      ([d, i]) =>
        `<g transform="translate(${x + d * 34 * s} ${y - (i === 2 ? 4 : 8) * s}) scale(${s})"><g class="${cls}${i}"><circle r="12" fill="${fill}"/><circle cx="9" cy="4" r="8" fill="${fill}"/><circle cx="-9" cy="4" r="7" fill="${fill}"/></g></g>`,
    )
    .join('');
}
function puffAnim(cls, t0, dur = 0.5) {
  return [[-1, 0], [1, 1], [0, 2]]
    .map(([d, i]) =>
      anim(`${cls}${i}`, [
        [0, { s: 0.2, o: 0 }],
        [t0, { s: 0.2, o: 0, x: 0, y: 0 }, 'o'],
        [t0 + 0.05, { s: 0.6, o: 0.95 }, 'o'],
        [t0 + dur, { s: 1.3, o: 0, x: d * 22, y: -12 }],
      ]),
    )
    .join('');
}

/** Yeux qui se ferment en arcs heureux à t (classe -eyes / -happy). */
const happyCss = (p, t) =>
  anim(`${p}-eyes`, [[0, { o: 1 }], [t, { o: 1 }, 'step'], [t + 0.02, { o: 0 }]]) +
  anim(`${p}-happy`, [[0, { o: 0 }], [t, { o: 0 }, 'step'], [t + 0.02, { o: 1 }]]);

/** Clignement (échelle verticale) autour de (ox, oy). */
const blinkCss = (cls, t, origin) =>
  anim(cls, [[0, { sy: 1 }], [t, { sy: 1 }], [t + 0.05, { sy: 0.1 }], [t + 0.1, { sy: 1 }]], { origin });

// ---------- Écureuil (repère : entre les pieds, ~115 de haut avant mise à l'échelle) ----------
const SQ = {
  fur: '#e27d3a',
  furDark: '#c9652b',
  furLight: '#f39d5b',
  cream: '#fde7c9',
  ink: '#3d2c1e',
  nose: '#5d3a1a',
  ear: '#f7ad8e',
};

function squirrelArm(p, side) {
  return `<g transform="translate(${side === 'L' ? -15 : 15} -50)"><g class="${p}-arm${side}">
      <path d="M 0 0 L 0 39" stroke="${SQ.furDark}" stroke-width="11.5" stroke-linecap="round"/>
      <circle cx="0" cy="40" r="6.4" fill="${SQ.furDark}"/>
    </g></g>`;
}

/** Écureuil de face. parts : 'back' (queue, pieds, corps), 'head', 'arms', ou tout. */
function squirrel(p, { parts = 'all' } = {}) {
  const back = `<g transform="translate(13 -20)"><g class="${p}-tail">
      <path d="M 0 0 C 34 2 48 -26 43 -54 C 39 -78 18 -88 5 -77" stroke="${SQ.fur}" stroke-width="30" stroke-linecap="round" fill="none"/>
      <path d="M 9 -5 C 30 -8 39 -28 36 -50" stroke="${SQ.furLight}" stroke-width="8" stroke-linecap="round" fill="none" opacity=".85"/>
      <path d="M 22 -82 C 14 -88 4 -86 -2 -80" stroke="${SQ.furDark}" stroke-width="6" stroke-linecap="round" fill="none" opacity=".5"/>
    </g></g>
    <ellipse cx="-11" cy="-3.5" rx="10.5" ry="5.5" fill="${SQ.furDark}"/>
    <ellipse cx="11" cy="-3.5" rx="10.5" ry="5.5" fill="${SQ.furDark}"/>
    <ellipse cx="0" cy="-31" rx="23" ry="27" fill="${SQ.fur}"/>
    <ellipse cx="0" cy="-27" rx="14" ry="18" fill="${SQ.cream}"/>`;
  const head = `<g class="${p}-head">
      <path d="M -23 -88 Q -29 -116 -14 -113 Q -7 -104 -8 -96 Z" fill="${SQ.fur}"/>
      <path d="M 23 -88 Q 29 -116 14 -113 Q 7 -104 8 -96 Z" fill="${SQ.fur}"/>
      <path d="M -20 -93 Q -23 -108 -15 -107 Q -11 -102 -11 -97 Z" fill="${SQ.ear}"/>
      <path d="M 20 -93 Q 23 -108 15 -107 Q 11 -102 11 -97 Z" fill="${SQ.ear}"/>
      <path d="M -23 -108 Q -28 -122 -17 -127 Q -19 -119 -12 -112 Z M 23 -108 Q 28 -122 17 -127 Q 19 -119 12 -112 Z" fill="${SQ.furDark}"/>
      <circle cx="0" cy="-77" r="25" fill="${SQ.fur}"/>
      <ellipse cx="0" cy="-66" rx="15" ry="11" fill="${SQ.cream}"/>
      <circle cx="-17" cy="-68" r="4.6" fill="#ff8f7a" opacity=".5"/>
      <circle cx="17" cy="-68" r="4.6" fill="#ff8f7a" opacity=".5"/>
      <g class="${p}-eyes">
        <circle cx="-9" cy="-79" r="4.9" fill="${SQ.ink}"/><circle cx="9" cy="-79" r="4.9" fill="${SQ.ink}"/>
        <circle cx="-7.4" cy="-80.8" r="1.8" fill="#fff"/><circle cx="10.6" cy="-80.8" r="1.8" fill="#fff"/>
      </g>
      <g class="${p}-happy" opacity="0">
        <path d="M -13 -78 Q -9 -84 -5 -78 M 5 -78 Q 9 -84 13 -78" stroke="${SQ.ink}" stroke-width="2.8" stroke-linecap="round" fill="none"/>
      </g>
      <ellipse cx="0" cy="-71" rx="3.8" ry="2.7" fill="${SQ.nose}"/>
      <path d="M -5 -65.5 Q -2.5 -62.5 0 -65.5 Q 2.5 -62.5 5 -65.5" stroke="${SQ.nose}" stroke-width="1.8" stroke-linecap="round" fill="none"/>
    </g>`;
  const arms = `${squirrelArm(p, 'L')}${squirrelArm(p, 'R')}`;
  if (parts === 'back') return back;
  if (parts === 'head') return head;
  if (parts === 'arms') return arms;
  return `${back}${arms}${head}`;
}

// ---------- Forêt ----------
function pine(x, y, s, shade = 0) {
  const c = shade ? ['#2f7d4f', '#378a57', '#43995f'] : ['#256b45', '#2f7d4f', '#3a8c5a'];
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="0" rx="16" ry="5" fill="#1c3414" opacity=".2"/>
    <rect x="-3" y="-10" width="6" height="10" rx="2" fill="#6b4422"/>
    <path d="M -18 -8 L 0 -34 L 18 -8 Z" fill="${c[0]}"/>
    <path d="M -15 -22 L 0 -46 L 15 -22 Z" fill="${c[1]}"/>
    <path d="M -11 -36 L 0 -58 L 11 -36 Z" fill="${c[2]}"/>
    <path d="M 0 -34 L 18 -8 L 0 -8 Z M 0 -46 L 15 -22 L 0 -22 Z M 0 -58 L 11 -36 L 0 -36 Z" fill="#0d3320" opacity=".14"/>
  </g>`;
}
function roundTree(x, y, s) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="0" rx="22" ry="6" fill="#28401a" opacity=".18"/>
    <rect x="-4" y="-22" width="8" height="22" rx="3" fill="#8b5a2b"/>
    <circle cx="-12" cy="-30" r="14" fill="#4f9d44"/><circle cx="12" cy="-30" r="14" fill="#468f3c"/>
    <circle cx="0" cy="-42" r="17" fill="#5fb14f"/><circle cx="-5" cy="-47" r="6" fill="#86cc6a"/>
  </g>`;
}
function flower(x, y, fill, s = 1.4) {
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="${fill}">
    <path d="M 0 0 L 0 -10" stroke="#4f9d44" stroke-width="2" stroke-linecap="round"/>
    <circle cx="3.5" cy="-12" r="2.6"/><circle cx="1.1" cy="-8.7" r="2.6"/><circle cx="-2.8" cy="-9.9" r="2.6"/>
    <circle cx="-2.8" cy="-14.1" r="2.6"/><circle cx="1.1" cy="-15.3" r="2.6"/><circle cx="0" cy="-12" r="2" fill="#f4a300"/>
  </g>`;
}
function grass(x, y, s = 1.4, c = '#6aa84f') {
  return `<path transform="translate(${x} ${y}) scale(${s})" d="M -6 0 Q -6 -6 -9 -10 M 0 0 Q 0 -8 1 -13 M 6 0 Q 6 -6 9 -9" stroke="${c}" stroke-width="2.4" stroke-linecap="round" fill="none"/>`;
}
function bush(x, y, s = 1.4) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="0" rx="18" ry="4" fill="#28401a" opacity=".16"/>
    <circle cx="-9" cy="-8" r="9" fill="#58a646"/><circle cx="9" cy="-8" r="9" fill="#4f9a3f"/>
    <circle cx="0" cy="-14" r="11" fill="#67b853"/><circle cx="4" cy="-12" r="2" fill="#e63946"/><circle cx="-6" cy="-7" r="2" fill="#e63946"/>
  </g>`;
}

/** Le grand chêne au creux (tronc centré en x = 84, pied à y = 560 + dy) ; le feuillage frémit. */
function hollowTree(dy = 0) {
  return `<g transform="translate(0 ${dy})">
    <ellipse cx="84" cy="562" rx="74" ry="13" fill="#1c3414" opacity=".22"/>
    <path d="M 26 562 Q 46 554 50 538 L 118 538 Q 122 554 142 562 Z" fill="#7a4e26"/>
    <path d="M 50 556 C 56 500 54 420 44 330 L 124 330 C 114 420 112 500 118 556 Z" fill="#8b5a2b"/>
    <path d="M 62 552 C 66 500 65 430 58 336 L 74 336 C 78 430 78 500 76 552 Z" fill="#a06a36"/>
    <path d="M 104 552 C 102 500 102 430 108 336 L 122 336 C 114 430 112 500 116 552 Z" fill="#6f4520" opacity=".55"/>
    <ellipse cx="84" cy="426" rx="30" ry="35" fill="#6b4422"/>
    <ellipse cx="84" cy="428" rx="23" ry="28" fill="#3e2410"/>
    <path d="M 64 446 Q 84 458 104 446" stroke="#a06a36" stroke-width="5" stroke-linecap="round" fill="none"/>
    <g class="tree-crown">
      <circle cx="30" cy="300" r="52" fill="#3f8f45"/>
      <circle cx="140" cy="300" r="50" fill="#3f8f45"/>
      <circle cx="84" cy="250" r="72" fill="#4f9d44"/>
      <circle cx="38" cy="226" r="46" fill="#5fb14f"/>
      <circle cx="132" cy="220" r="42" fill="#5fb14f"/>
      <circle cx="58" cy="200" r="16" fill="#86cc6a"/>
      <circle cx="138" cy="200" r="10" fill="#86cc6a"/>
      <circle cx="16" cy="276" r="4" fill="#e63946"/><circle cx="118" cy="268" r="4" fill="#e63946"/><circle cx="160" cy="300" r="4" fill="#e63946"/>
    </g>
  </g>`;
}

function forestBackground(dy = 30) {
  const flowers = [
    [36, 700, '#ff8fab'], [120, 752, '#ffd23f'], [385, 700, '#b48cf2'], [300, 752, '#ffffff'],
    [372, 470, '#ff8fab'], [214, 452, '#ffd23f'], [262, 395, '#ffffff'], [24, 640, '#b48cf2'],
    [180, 760, '#ff8fab'], [346, 760, '#ffd23f'], [395, 580, '#ffffff'],
  ];
  const grassAt = [[70, 690], [150, 720], [262, 730], [372, 660], [395, 750], [20, 770], [220, 775], [320, 440], [175, 440], [395, 540]];
  return `
  <defs><linearGradient id="fgnd" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#9fcc76"/><stop offset=".45" stop-color="#b9de8f"/><stop offset="1" stop-color="#c9e89f"/>
  </linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#fgnd)"/>
  <ellipse cx="236" cy="640" rx="230" ry="120" fill="#d3eeaa" opacity=".7"/>
  <ellipse cx="300" cy="860" rx="260" ry="110" fill="#d3eeaa" opacity=".5"/>
  ${[[20, 120], [70, 96], [125, 118], [180, 92], [232, 116], [288, 96], [342, 118], [396, 98]].map(([x, y], i) => pine(x, y, 1.6, i % 2)).join('')}
  ${[[42, 190], [150, 176], [262, 186], [372, 172]].map(([x, y], i) => (i % 2 ? roundTree(x, y, 1.5) : pine(x, y, 1.8, 1))).join('')}
  ${[[218, 262], [330, 250], [395, 300]].map(([x, y], i) => (i === 1 ? roundTree(x, y, 1.7) : pine(x, y, 1.9))).join('')}
  ${bush(368, 380, 1.5)}${bush(392, 820, 1.4)}${bush(24, 830, 1.3)}
  ${grassAt.map(([x, y]) => grass(x, y)).join('')}
  ${flowers.map(([x, y, c]) => flower(x, y, c)).join('')}
  ${hollowTree(dy)}
  `;
}
const treeCrownCss = (dy = 30) =>
  anim('tree-crown', [[0, { r: 0 }], [0.06, { r: -1.4 }], [0.16, { r: 1.4 }], [0.26, { r: -0.9 }], [0.36, { r: 0.4 }], [0.46, { r: 0 }]], { origin: `84px ${330 + dy}px` });

// ---------- Mer ----------
function wave(x, y, s, o = 0.75) {
  return `<path transform="translate(${x} ${y}) scale(${s})" d="M -15 0 Q -7.5 -6 0 0 Q 7.5 -6 15 0" stroke="#ffffff" stroke-opacity="${o}" stroke-width="2.8" stroke-linecap="round" fill="none"/>`;
}
function cloud(x, y, s, shade = '#c2dbf2') {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -40 0 Q -44 -16 -28 -18 Q -24 -36 -4 -32 Q 8 -46 24 -32 Q 42 -32 40 -14 Q 52 -10 46 0 Z" fill="#ffffff"/>
    <path d="M -40 0 Q 0 6 46 0 Q 30 -4 0 -4 Q -28 -4 -40 0 Z" fill="${shade}"/>
  </g>`;
}
const SEA_TOP = 330;
function seaBackground({ waves: skip = [] } = {}) {
  const waves = [
    [60, 380, 0.6], [170, 360, 0.5], [300, 395, 0.6], [380, 365, 0.5], [110, 450, 0.8], [250, 470, 0.8], [360, 440, 0.8],
    [40, 540, 1], [370, 560, 1], [120, 640, 1.2], [300, 680, 1.2], [60, 760, 1.4], [230, 770, 1.3],
  ].filter((_, i) => !skip.includes(i));
  return `
  <defs>
    <linearGradient id="me-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9dbfa"/><stop offset="1" stop-color="#e8f6ff"/></linearGradient>
    <linearGradient id="me-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f97cf"/><stop offset=".35" stop-color="#62bde1"/><stop offset=".75" stop-color="#8fd9e8"/><stop offset="1" stop-color="#b4ebe8"/></linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#me-sky)"/>
  <circle cx="320" cy="150" r="58" fill="#ffffff" opacity=".4"/><circle cx="320" cy="150" r="38" fill="#ffe68a"/>
  ${cloud(92, 150, 1.4)}${cloud(250, 92, 1)}${cloud(370, 232, 0.8)}
  <path d="M 150 210 q 6 -6 12 0 q 6 -6 12 0 M 196 236 q 5 -5 10 0 q 5 -5 10 0" stroke="#6f9cc4" stroke-width="2.4" stroke-linecap="round" fill="none"/>
  <rect y="${SEA_TOP}" width="${W}" height="${H - SEA_TOP}" fill="url(#me-sea)"/>
  <path d="M 312 331 Q 340 314 372 331 Z" fill="#f6e7b8"/>
  <g transform="translate(345 326) scale(.8)">
    <path d="M 0 0 Q -2 -24 6 -42" stroke="#8b5a2b" stroke-width="4.6" stroke-linecap="round" fill="none"/>
    <path d="M 6 -42 Q -10 -49 -22 -35 Q -8 -42 6 -42" fill="#4f9d44"/><path d="M 6 -42 Q 23 -51 31 -33 Q 19 -42 6 -42" fill="#5fb14f"/>
    <path d="M 6 -42 Q 2 -57 -11 -60 Q 2 -51 6 -42" fill="#5fb14f"/><path d="M 6 -42 Q 17 -60 29 -56 Q 15 -51 6 -42" fill="#4f9d44"/>
  </g>
  <g transform="translate(64 330) scale(.9)">
    <path d="M -18 -2 L 18 -2 L 12 7 L -12 7 Z" fill="#e63946"/><path d="M -18 -2 L 18 -2 L 17 1 L -17 1 Z" fill="#ffffff"/>
    <path d="M 0 -2 L 0 -32" stroke="#6e4420" stroke-width="2"/><path d="M 2 -30 L 16 -6 L 2 -6 Z" fill="#fff7e8"/><path d="M -2 -26 L -12 -6 L -2 -6 Z" fill="#ffd23f"/>
  </g>
  ${waves.map(([x, y, s]) => wave(x, y, s)).join('')}`;
}
/** Plage du bas (devant les acteurs marins), comme au 1er tour. */
function seaBeach() {
  return `<path d="M 0 806 Q 60 794 120 802 T 240 800 T ${W} 798 V ${H} H 0 Z" fill="#f6e7b8"/>
  <path d="M 0 806 Q 60 794 120 802 T 240 800 T ${W} 798" stroke="#e8d29a" stroke-width="8" fill="none"/>
  <path d="M 0 798 Q 60 786 120 794 T 240 792 T ${W} 790" stroke="#ffffff" stroke-width="3.5" stroke-opacity=".85" fill="none"/>
  <g transform="translate(56 868) rotate(-12)"><path d="M 0 -14 L 4 -4 L 14 -3 L 6 4 L 9 14 L 0 8 L -9 14 L -6 4 L -14 -3 L -4 -4 Z" fill="#ff9a5a" stroke="#ff9a5a" stroke-width="4" stroke-linejoin="round"/></g>
  <g transform="translate(360 876)"><path d="M -12 4 Q 0 -18 12 4 Z" fill="#ffc2c7"/><path d="M 0 4 L 0 -10 M -6 4 L -3 -8 M 6 4 L 3 -8" stroke="#ff8fab" stroke-width="1.5"/></g>`;
}

/** Gerbe d'eau : collerette d'écume, gouttes en arc, onde. */
function splash(p, x, y, s = 1) {
  const drops = [-34, -18, -4, 12, 28].map(
    (dx, i) => `<g class="${p}-d${i}"><ellipse rx="${i % 2 ? 4.5 : 6}" ry="${i % 2 ? 6 : 7.5}" fill="#ffffff"/></g>`,
  );
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <g class="${p}-ring"><ellipse rx="40" ry="9" fill="none" stroke="#ffffff" stroke-width="4" opacity=".9"/></g>
    <g class="${p}-foam"><path d="M -38 2 Q -40 -18 -26 -10 Q -26 -34 -12 -18 Q -6 -44 4 -20 Q 14 -38 18 -14 Q 32 -28 30 -8 Q 44 -14 40 2 Q 0 12 -38 2 Z" fill="#ffffff"/>
      <path d="M -24 0 Q -20 -8 -12 -4 Q -6 -14 2 -6 Q 10 -12 14 -4 Q 22 -8 26 0 Z" fill="#cfeefa"/></g>
    ${drops.join('')}
  </g>`;
}
function splashCss(p, t0) {
  let c = '';
  c += anim(`${p}-ring`, [[0, { s: 0.2, o: 0 }], [t0, { s: 0.2, o: 0 }, 'o'], [t0 + 0.05, { s: 0.4, o: 1 }, 'o'], [t0 + 0.8, { s: 1.6, o: 0 }]]);
  c += anim(`${p}-foam`, [[0, { sx: 0.2, sy: 0, o: 0 }], [t0, { sx: 0.2, sy: 0, o: 0 }, 'o'], [t0 + 0.14, { sx: 1.05, sy: 1.2, o: 1 }, 'io'], [t0 + 0.32, { sx: 1.12, sy: 0.9, o: 1 }, 'i'], [t0 + 0.6, { sx: 1.25, sy: 0.1, o: 0 }]]);
  [-34, -18, -4, 12, 28].forEach((dx, i) => {
    const h = 40 + ((i * 7) % 3) * 18;
    const end = [dx * 2.2, 2 + ((i * 5) % 3) * 8];
    c += anim(`${p}-d${i}`, [
      [0, { x: 0, y: 0, o: 0, s: 0.6 }],
      [t0, { x: dx * 0.2, y: -4, o: 0, s: 0.6 }, 'l'],
      [t0 + 0.02, { o: 1, s: 1 }, 'l'],
      ...arc(t0 + 0.02, t0 + 0.5, [dx * 0.2, -4], end, h, { n: 8 }),
      [t0 + 0.56, { o: 0, s: 0.4 }],
    ]);
  });
  return c;
}

// ---------- Montagne ----------
function rock(x, y, s) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="2" cy="0" rx="20" ry="5" fill="rgba(40,50,60,.2)"/>
    <path d="M -18 0 Q -20 -14 -8 -20 Q 6 -26 16 -14 Q 22 -6 18 0 Z" fill="#a3afba"/>
    <path d="M -12 -14 Q -2 -24 12 -16 Q 2 -14 -12 -14 Z" fill="#c3ccd4"/>
    <path d="M 8 -16 Q 22 -6 18 0 L 6 0 Q 12 -8 8 -16 Z" fill="#7d8a96" opacity=".6"/>
  </g>`;
}
/** Gros rocher arrondi à sommet presque plat (pour s'y poser) : sommet en (x, y), largeur w, hauteur h. */
function bigRock(x, y, w, h, { flip = false } = {}) {
  const a = w / 2;
  const f = flip ? -1 : 1;
  const R = (n) => r2(n);
  return `<g transform="translate(${x} ${y}) scale(${f} 1)">
    <ellipse cx="${R(a * 0.08)}" cy="${R(h)}" rx="${R(a * 1.12)}" ry="${R(Math.max(7, h * 0.12))}" fill="rgba(40,50,60,.2)"/>
    <path d="M ${R(-a)} ${R(h)} C ${R(-a * 1.1)} ${R(h * 0.55)} ${R(-a * 0.92)} ${R(h * 0.12)} ${R(-a * 0.62)} ${R(h * 0.02)} C ${R(-a * 0.3)} ${R(-h * 0.05)} ${R(a * 0.3)} ${R(-h * 0.05)} ${R(a * 0.62)} ${R(h * 0.02)} C ${R(a * 0.94)} ${R(h * 0.12)} ${R(a * 1.12)} ${R(h * 0.55)} ${R(a)} ${R(h)} Z" fill="#a3afba"/>
    <path d="M ${R(-a * 0.62)} ${R(h * 0.02)} C ${R(-a * 0.3)} ${R(-h * 0.05)} ${R(a * 0.3)} ${R(-h * 0.05)} ${R(a * 0.62)} ${R(h * 0.02)} C ${R(a * 0.7)} ${R(h * 0.06)} ${R(a * 0.76)} ${R(h * 0.12)} ${R(a * 0.8)} ${R(h * 0.2)} C ${R(a * 0.3)} ${R(h * 0.12)} ${R(-a * 0.3)} ${R(h * 0.12)} ${R(-a * 0.84)} ${R(h * 0.22)} C ${R(-a * 0.8)} ${R(h * 0.12)} ${R(-a * 0.72)} ${R(h * 0.06)} ${R(-a * 0.62)} ${R(h * 0.02)} Z" fill="#c6ced6"/>
    <path d="M ${R(a * 0.62)} ${R(h * 0.02)} C ${R(a * 0.94)} ${R(h * 0.12)} ${R(a * 1.12)} ${R(h * 0.55)} ${R(a)} ${R(h)} L ${R(a * 0.5)} ${R(h)} C ${R(a * 0.74)} ${R(h * 0.6)} ${R(a * 0.74)} ${R(h * 0.3)} ${R(a * 0.62)} ${R(h * 0.02)} Z" fill="#7d8a96" opacity=".5"/>
    <path d="M ${R(-a * 0.5)} ${R(h * 0.5)} Q ${R(-a * 0.3)} ${R(h * 0.42)} ${R(-a * 0.1)} ${R(h * 0.52)} M ${R(a * 0.12)} ${R(h * 0.7)} Q ${R(a * 0.26)} ${R(h * 0.64)} ${R(a * 0.36)} ${R(h * 0.74)}" stroke="#8d99a5" stroke-width="3" stroke-linecap="round" fill="none"/>
    ${grass(-a * 0.96, h + 2, 1.2, '#7fae5c')}${grass(a * 0.9, h + 2, 1.1, '#7fae5c')}
  </g>`;
}
function edelweiss(x, y, s = 1.6) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M 0 0 L 0 -6" stroke="#7d9a6a" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M 0 -8 L -6 -11 L -1.5 -9.5 L -4 -14.5 L 0 -10.5 L 4 -14.5 L 1.5 -9.5 L 6 -11 L 1.5 -7.5 L 3.5 -3 L 0 -6.5 L -3.5 -3 L -1.5 -7.5 Z" fill="#ffffff" stroke="#c9d3c4" stroke-width=".8" stroke-linejoin="round"/>
    <circle cx="0" cy="-8.6" r="1.5" fill="#e8d36a"/>
  </g>`;
}
function mpine(x, y, s) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="2" cy="0" rx="17" ry="5" fill="rgba(28,52,20,.2)"/>
    <rect x="-3" y="-10" width="6" height="10" rx="2" fill="#6b4422"/>
    <path d="M -18 -8 L 0 -34 L 18 -8 Z" fill="#256b45"/><path d="M -15 -22 L 0 -46 L 15 -22 Z" fill="#2f7d4f"/><path d="M -11 -36 L 0 -58 L 11 -36 Z" fill="#3a8c5a"/>
    <path d="M 0 -34 L 18 -8 L 0 -8 Z M 0 -46 L 15 -22 L 0 -22 Z M 0 -58 L 11 -36 L 0 -36 Z" fill="#0d3320" opacity=".18"/>
  </g>`;
}
/** Décor de la montagne (ciel, sommets enneigés, alpage, sapins) ; rocks: false pour retirer les petits rochers. */
function mountainBackground({ rocks = true, flowers = true } = {}) {
  return `
  <defs>
    <linearGradient id="ma-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9d8f7"/><stop offset="1" stop-color="#e6f4fc"/></linearGradient>
    <linearGradient id="ma-mead" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b3dc86"/><stop offset=".5" stop-color="#bfe394"/><stop offset="1" stop-color="#d2eeae"/></linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#ma-sky)"/>
  <g transform="translate(70 120)"><path d="M -40 0 Q -44 -16 -28 -18 Q -24 -36 -4 -32 Q 8 -46 24 -32 Q 42 -32 40 -14 Q 52 -10 46 0 Z" fill="#ffffff"/></g>
  <g transform="translate(320 170) scale(.8)"><path d="M -40 0 Q -44 -16 -28 -18 Q -24 -36 -4 -32 Q 8 -46 24 -32 Q 42 -32 40 -14 Q 52 -10 46 0 Z" fill="#ffffff"/></g>
  <path d="M 0 360 L 50 290 L 92 320 L 150 226 L 214 310 L 262 262 L 312 318 L 366 214 L ${W} 270 V 480 H 0 Z" fill="#c6d8ea"/>
  <path d="M 150 226 L 214 310 L 196 310 L 160 250 Z M 366 214 L ${W} 270 L ${W} 290 L 380 236 Z M 262 262 L 312 318 L 296 318 Z" fill="#b2c9df"/>
  <path d="M 150 226 L 170 252 L 160 248 L 150 258 L 140 246 L 132 254 Z M 366 214 L 386 240 L 374 236 L 364 246 L 354 234 L 346 242 Z M 50 290 L 62 306 L 52 302 L 44 308 L 38 302 Z M 262 262 L 276 280 L 266 276 L 258 282 L 250 274 Z" fill="#f4f8fc"/>
  <path d="M 0 420 L 70 352 L 130 396 L 198 336 L 270 404 L 338 350 L ${W} 398 V 500 H 0 Z" fill="#a6bfd8"/>
  <path d="M 198 336 L 270 404 L 240 404 Z M 338 350 L ${W} 398 L 380 398 Z M 70 352 L 130 396 L 104 396 Z" fill="#93afcb"/>
  <path d="M 0 462 Q 110 436 206 452 T ${W} 446 V ${H} H 0 Z" fill="url(#ma-mead)"/>
  <ellipse cx="206" cy="680" rx="210" ry="90" fill="#d2eeae" opacity=".6"/>
  ${mpine(28, 520, 1.6)}${mpine(70, 500, 1.3)}${mpine(388, 512, 1.6)}${mpine(352, 496, 1.25)}${mpine(16, 610, 1.8)}${mpine(398, 640, 1.8)}
  ${rocks ? `${rock(70, 790, 1.5)}${rock(352, 778, 1.2)}${rock(300, 520, 0.9)}${rock(118, 540, 0.8)}` : ''}
  ${flowers ? `${edelweiss(60, 700)}${edelweiss(150, 740)}${edelweiss(360, 690)}${edelweiss(270, 760)}${edelweiss(386, 800, 1.4)}${edelweiss(30, 820, 1.4)}` : ''}
  ${grass(110, 600, 1.4, '#7fae5c')}${grass(310, 610, 1.4, '#7fae5c')}${grass(240, 540, 1.2, '#7fae5c')}${grass(170, 520, 1.2, '#7fae5c')}`;
}

// ---------- Nuages ----------
function skyCloud(x, y, s, shade = '#c2dbf2') {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M -40 0 Q -44 -16 -28 -18 Q -24 -36 -4 -32 Q 8 -46 24 -32 Q 42 -32 40 -14 Q 52 -10 46 0 Z" fill="#ffffff"/>
    <path d="M -40 0 Q 0 7 46 0 Q 30 -5 0 -5 Q -28 -5 -40 0 Z" fill="${shade}"/>
    <path d="M -20 -26 Q -12 -32 -4 -30" stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none"/>
  </g>`;
}
function cloudsBackground({ skip = [] } = {}) {
  const cl = [[330, 120, 1.2], [120, 300, 0.9], [370, 360, 0.75], [40, 560, 1.0], [372, 620, 1.1], [250, 220, 0.6]].filter((_, i) => !skip.includes(i));
  return `
  <defs>
    <linearGradient id="nu-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#a7d5f5"/><stop offset=".6" stop-color="#cbe8fb"/><stop offset="1" stop-color="#fff3e6"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#nu-sky)"/>
  <circle cx="72" cy="128" r="62" fill="#ffffff" opacity=".35"/><circle cx="72" cy="128" r="40" fill="#ffe68a"/>
  ${cl.map(([x, y, s]) => skyCloud(x, y, s)).join('')}`;
}
/** Mer de nuages pleine du bas (devant les acteurs). */
function seaOfClouds() {
  const back = [[-6, 784, 40], [52, 770, 46], [118, 780, 38], [176, 764, 50], [240, 778, 40], [300, 766, 48], [366, 776, 44], [420, 768, 40]];
  const front = [[10, 820, 46], [82, 806, 52], [156, 818, 44], [224, 804, 56], [298, 816, 46], [362, 806, 52], [424, 818, 44]];
  const puffs = (list, fill) => list.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join('');
  return `
    ${puffs(back, '#e4eefa')}<rect x="-10" y="780" width="${W + 20}" height="${H - 780}" fill="#e4eefa"/>
    ${puffs(front, '#ffffff')}<rect x="-10" y="818" width="${W + 20}" height="${H - 818}" fill="#ffffff"/>
    ${front.map(([x, y, r]) => `<path d="M ${x - r * 0.55} ${y - r * 0.55} Q ${x - r * 0.2} ${y - r * 0.85} ${x + r * 0.15} ${y - r * 0.82}" stroke="#ffffff" stroke-width="4" stroke-linecap="round" fill="none"/>`).join('')}
    <path d="M -10 872 Q 60 862 120 874 Q 200 886 280 872 Q 350 862 430 876" stroke="#e3edf8" stroke-width="5" stroke-linecap="round" fill="none"/>`;
}
/** Nuage-plateforme bien dodu (dessus plat-ish en y = 0, centré en x), largeur w. */
function platformCloud(w, { shade = '#c6dbf3' } = {}) {
  const a = w / 2;
  const bumps = [[-0.72, 0.36], [-0.36, 0.5], [0.05, 0.56], [0.42, 0.48], [0.74, 0.34]]
    .map(([fx, fr]) => `<circle cx="${r2(fx * a)}" cy="${r2(-fr * a * 0.32 + a * 0.18)}" r="${r2(fr * a * 0.52)}" fill="#ffffff"/>`)
    .join('');
  return `<g>
    <ellipse cx="0" cy="${r2(a * 0.32)}" rx="${r2(a * 0.95)}" ry="${r2(a * 0.2)}" fill="${shade}"/>
    ${bumps}
    <rect x="${r2(-a * 0.9)}" y="${r2(a * 0.06)}" width="${r2(a * 1.8)}" height="${r2(a * 0.26)}" rx="${r2(a * 0.13)}" fill="#ffffff"/>
    <path d="M ${r2(-a * 0.86)} ${r2(a * 0.3)} Q 0 ${r2(a * 0.42)} ${r2(a * 0.86)} ${r2(a * 0.3)}" stroke="${shade}" stroke-width="${r2(a * 0.07)}" stroke-linecap="round" fill="none"/>
    <path d="M ${r2(-a * 0.5)} ${r2(-a * 0.12)} Q ${r2(-a * 0.38)} ${r2(-a * 0.22)} ${r2(-a * 0.22)} ${r2(-a * 0.2)}" stroke="#ffffff" stroke-width="4" stroke-linecap="round" fill="none"/>
  </g>`;
}

/** Le bouton « continuer » est un vrai bouton Preact (ReadingEnd), posé sur la scène : rien à dessiner ici. */
const checkButton = () => '';
const checkButtonCss = () => '';

/** Plus de fondu de fin : la scène reste sur sa pose finale. */
const actorsCss = () => '';

export {
  T, W, H, SETTLE, anim, arc, arcStart, land, lin, sparkle, sparkleAnim, SPARK, puff, puffAnim, happyCss, blinkCss,
  objSlot, squirrel, SQ, pine, roundTree, flower, grass, bush, hollowTree, forestBackground, treeCrownCss,
  wave, cloud, seaBackground, seaBeach, splash, splashCss, SEA_TOP, rock, bigRock, edelweiss, mpine, mountainBackground,
  skyCloud, cloudsBackground, seaOfClouds, platformCloud, checkButton, checkButtonCss, actorsCss, r2, HW0, HH0,
};
