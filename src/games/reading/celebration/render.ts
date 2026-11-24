// Rendu d'une scène : pose l'objet (lettre ou étoile) dans ses emplacements et résout les attributs `data-t`,
// qui dépendent de la taille réelle de l'objet (ex. `rx={hw+16}` pour l'onde d'un nageur).
import { buildObject, OBJECT_DEFS, type ObjectShape } from './object';
import type { SceneModule } from './types';

export interface RenderedScene {
  title: string;
  /** Contenu du `<svg>` (viewBox 412 × 915). */
  svg: string;
  /** Keyframes et classes de la scène. */
  css: string;
  /** Variables CSS de l'objet (`--hw`, `--hh`…), lues par les keyframes. */
  vars: string;
}

/** Évalue une expression arithmétique des maquettes (`hw*0.95+8`, `Math.max(…)`) pour l'objet donné. */
function evalExpr(expr: string, o: ObjectShape): number {
  const value = new Function('hw', 'hh', 'gl', 'gr', 'gy', 'gc', `return (${expr})`)(o.hw, o.hh, o.gl, o.gr, o.gy, o.gc) as number;
  return Math.round(value * 100) / 100;
}

function setAttr(tag: string, name: string, value: string): string {
  const re = new RegExp(`(\\s)${name}="[^"]*"`);
  if (re.test(tag)) return tag.replace(re, `$1${name}="${value}"`);
  return tag.replace(/\s*(\/?>)$/, ` ${name}="${value}"$1`);
}

/** Résout `data-t="attr=texte {expr}|attr2=…"` sur chaque balise, puis retire `data-t`. */
export function resolveDataT(svg: string, o: ObjectShape): string {
  return svg.replace(/<[a-zA-Z][^<>]*\sdata-t="([^"]*)"[^<>]*>/g, (tag, spec: string) => {
    let out = tag.replace(/\sdata-t="[^"]*"/, '');
    for (const part of spec.split('|')) {
      const eq = part.indexOf('=');
      if (eq < 0) continue;
      const value = part.slice(eq + 1).replace(/\{([^}]*)\}/g, (_m, expr: string) => String(evalExpr(expr, o)));
      out = setAttr(out, part.slice(0, eq).trim(), value);
    }
    return out;
  });
}

/** `object` : capitales du son (« M », « CH ») ou `'star'`. */
export function renderScene(scene: SceneModule, object: string): RenderedScene {
  const o = buildObject(object === 'star' ? 'STAR' : object.toUpperCase(), scene.box[0], scene.box[1]);
  const slotted = scene.svg().replace(/<g class="obj"([^>]*)><\/g>/g, (_m, attrs: string) => `<g class="obj"${attrs}>${o.svg}</g>`);
  return {
    title: scene.title,
    svg: `<defs>${OBJECT_DEFS}</defs>${resolveDataT(slotted, o)}`,
    css: scene.css(),
    vars: `--hw:${o.hw};--hh:${o.hh};--gl:${o.gl};--gr:${o.gr};--gy:${o.gy};--gc:${o.gc}`,
  };
}
