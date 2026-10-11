// Default-style Arcana support for the personal fork (2026-10-11).
// Item-builder copyright (C) 2026 h6rd and TheFleece; GPL-3.0-or-later, see NOTICE.
// IDs are deliberately explicit: a newly added persona or Arcana is not silently opted in.
import { blockBounds, eachChild, findItem, type SchemaItem } from './schema.ts';
import type { AssetCopy } from './item-builder-slots.ts';

export const ARCANA_ITEMS: Record<string, { hero: string; target: string }> = {
  '7385': { hero: 'crystal_maiden', target: '38' },
  '19090': { hero: 'drow_ranger', target: '905' },
  '12692': { hero: 'earthshaker', target: '855' },
  '9059': { hero: 'juggernaut', target: '811' },
  '6996': { hero: 'nevermore', target: '826' },
  '7756': { hero: 'pudge', target: '810' },
  '23095': { hero: 'razor', target: '340' },
  '22718': { hero: 'vengefulspirit', target: '445' },
  '13806': { hero: 'windrunner', target: '828' },
  '6914': { hero: 'zuus', target: '604' },
  '4794': { hero: 'lina', target: '319' },
  '37143': { hero: 'tidehunter', target: '904' },
  '12930': { hero: 'queenofpain', target: '82' },
  '18033': { hero: 'faceless_void', target: '90' },
  '13456': { hero: 'skeleton_king', target: '148' },
  '7247': { hero: 'phantom_assassin', target: '140' },
  '9662': { hero: 'spectre', target: '323' },
  '13670': { hero: 'ogre_magi', target: '830' },
  '12451': { hero: 'rubick', target: '204' },
  '9235': { hero: 'wisp', target: '639' },
  '18539': { hero: 'skywrath_mage', target: '422' },
  '5810': { hero: 'legion_commander', target: '847' },
  '5957': { hero: 'terrorblade', target: '913' },
  '6879': { hero: 'techies', target: '490' },
  '9050': { hero: 'monkey_king', target: '825' },
};
const targets = new Set(Object.values(ARCANA_ITEMS).map((a) => a.target));
const companions = new Set(['37144', '37140']);

export function supportedArcana(item: Partial<SchemaItem> | null): boolean {
  return !!item?.id && (Object.hasOwn(ARCANA_ITEMS, item.id)
    || companions.has(item.id)
    || (item.prefab === 'default_item' && targets.has(item.id)));
}

type Modifier = Record<string, string>;
export function arcanaModifiers(visuals: string): Modifier[] {
  const out: Modifier[] = [];
  eachChild(visuals, blockBounds(visuals, 0), (c) => {
    if (!c.isBlock || !/^asset_modifier\d*$/i.test(c.key)) return;
    const fields: Modifier = {};
    eachChild(visuals, c.body, (f) => { if (!f.isBlock) fields[f.key.toLowerCase()] = f.value; });
    out.push(fields);
  });
  return out;
}

// Removing "styles" alone leaves every red/blue effect enabled at once. Keep only style 0;
// progression-specific Rubick overrides stay out, rather than recolouring other heroes' spells.
export function defaultArcanaVisuals(visuals: string, priority = new Set<string>()): string {
  const edits: { start: number; end: number; text: string }[] = [];
  eachChild(visuals, blockBounds(visuals, 0), (c) => {
    if (!c.isBlock || !/^asset_modifier\d*$/i.test(c.key)) return;
    let excluded = false;
    const fields: Modifier = {};
    const styles: { start: number; end: number; text: string }[] = [];
    eachChild(visuals, c.body, (f) => {
      if (f.isBlock) return;
      fields[f.key.toLowerCase()] = f.value;
      if (f.key.toLowerCase() === 'style') {
        if (f.value !== '0') excluded = true;
        else styles.push({ start: f.start, end: f.end, text: '' });
      }
      if (f.key.toLowerCase() === 'criteria' && /\bstyle\b/i.test(f.value)) excluded = true;
    });
    if (fields.asset && priority.has(`${fields.type}:${fields.asset}`)) excluded = true;
    if (excluded) edits.push({ start: c.start, end: c.end, text: '' });
    else edits.push(...styles);
  });
  for (const e of edits.sort((a, b) => b.start - a.start)) visuals = visuals.slice(0, e.start) + e.text + visuals.slice(e.end);
  return visuals;
}

function visualsOf(text: string, id: string): string {
  const item = findItem(text, id);
  let visuals = '"visuals" {}';
  if (item) eachChild(text, blockBounds(text, item.start), (c) => {
    if (c.isBlock && c.key === 'visuals') visuals = text.slice(c.start, c.end);
  });
  return defaultArcanaVisuals(visuals);
}

export type ArcanaContext = Map<string, { id: string; refits: Map<string, string>; priority: Set<string> }>;

/** Read once per rebuild; refits apply only to a hero with its Arcana actually enabled. */
export function createArcanaContext(text: string, activeIds: string[]): ArcanaContext {
  const out: ArcanaContext = new Map();
  for (const id of activeIds) {
    const def = ARCANA_ITEMS[id];
    if (!def || !findItem(text, id)) continue;
    const refits = new Map<string, string>();
    const priority = new Set<string>();
    for (const m of arcanaModifiers(visualsOf(text, id))) {
      if (m.type === 'model' && m.asset && m.modifier && !m.criteria) refits.set(m.asset.toLowerCase(), m.modifier);
      if (['particle', 'ability_icon', 'sound'].includes(m.type) && m.asset) priority.add(`${m.type}:${m.asset}`);
    }
    out.set('npc_dota_hero_' + def.hero, { id, refits, priority });
  }
  return out;
}

/** Whole-body models must be replaced too; do not redirect shared summons globally. */
export function arcanaBodyCopies(itemId: string, visuals: string): AssetCopy[] {
  const def = ARCANA_ITEMS[itemId];
  if (!def) return [];
  return arcanaModifiers(visuals)
    .filter((m) => m.type === 'entity_model' && m.asset === 'npc_dota_hero_' + def.hero && m.modifier && !m.criteria)
    .map((m) => ({ from: m.modifier, to: m.asset, entityModel: true }));
}
