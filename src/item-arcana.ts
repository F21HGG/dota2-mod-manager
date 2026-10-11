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
// Reviewed wearable parts of Valve's original Arcana bundles, excluding voice/personas.
export const ARCANA_COMPANIONS: Record<string, { hero: string; slot: string }> = {
  '6908': { hero: 'techies', slot: 'arms' },
  '6911': { hero: 'techies', slot: 'shoulder' },
  '6946': { hero: 'techies', slot: 'belt' },
  '7009': { hero: 'techies', slot: 'head' },
  '7011': { hero: 'techies', slot: 'back' },
  '8692': { hero: 'zuus', slot: 'arms' },
  '8693': { hero: 'zuus', slot: 'back' },
  '9663': { hero: 'spectre', slot: 'shoulder' },
  '12312': { hero: 'spectre', slot: 'weapon' },
  '12313': { hero: 'spectre', slot: 'misc' },
  '12314': { hero: 'spectre', slot: 'belt' },
  '13473': { hero: 'skeleton_king', slot: 'back' },
  '13569': { hero: 'skeleton_king', slot: 'armor' },
  '13571': { hero: 'skeleton_king', slot: 'shoulder' },
  '13743': { hero: 'skeleton_king', slot: 'arms' },
  '13760': { hero: 'skeleton_king', slot: 'weapon' },
  '13768': { hero: 'queenofpain', slot: 'shoulder' },
  '13769': { hero: 'queenofpain', slot: 'head' },
  '13770': { hero: 'queenofpain', slot: 'weapon' },
  '13804': { hero: 'windrunner', slot: 'back' },
  '13805': { hero: 'windrunner', slot: 'weapon' },
  '13807': { hero: 'windrunner', slot: 'shoulder' },
  '13808': { hero: 'windrunner', slot: 'offhand_weapon' },
  '18540': { hero: 'skywrath_mage', slot: 'weapon' },
  '18541': { hero: 'skywrath_mage', slot: 'head' },
  '18542': { hero: 'skywrath_mage', slot: 'belt' },
  '18543': { hero: 'skywrath_mage', slot: 'shoulder' },
  '18544': { hero: 'skywrath_mage', slot: 'arms' },
  '19088': { hero: 'drow_ranger', slot: 'arms' },
  '19089': { hero: 'drow_ranger', slot: 'back' },
  '19091': { hero: 'drow_ranger', slot: 'legs' },
  '19092': { hero: 'drow_ranger', slot: 'misc' },
  '19093': { hero: 'drow_ranger', slot: 'shoulder' },
  '19094': { hero: 'drow_ranger', slot: 'head' },
  '22719': { hero: 'vengefulspirit', slot: 'weapon' },
  '22720': { hero: 'vengefulspirit', slot: 'head' },
  '22721': { hero: 'vengefulspirit', slot: 'legs' },
  '22822': { hero: 'faceless_void', slot: 'weapon' },
  '22823': { hero: 'faceless_void', slot: 'shoulder' },
  '22824': { hero: 'faceless_void', slot: 'arms' },
  '22825': { hero: 'faceless_void', slot: 'belt' },
  '23096': { hero: 'razor', slot: 'head' },
  '23097': { hero: 'razor', slot: 'armor' },
  '23098': { hero: 'razor', slot: 'arms' },
  '23099': { hero: 'razor', slot: 'belt' },
  '29687': { hero: 'pudge', slot: 'back' },
  '30261': { hero: 'juggernaut', slot: 'head' },
  '32650': { hero: 'windrunner', slot: 'head' },
  '34183': { hero: 'monkey_king', slot: 'head' },
  '34184': { hero: 'nevermore', slot: 'head' },
  '34185': { hero: 'nevermore', slot: 'shoulder' },
  '34186': { hero: 'nevermore', slot: 'arms' },
  '34379': { hero: 'earthshaker', slot: 'arms' },
  '34380': { hero: 'earthshaker', slot: 'belt' },
  '34381': { hero: 'earthshaker', slot: 'weapon' },
  '34382': { hero: 'earthshaker', slot: 'head' },
  '34483': { hero: 'tidehunter', slot: 'weapon' },
  '34484': { hero: 'tidehunter', slot: 'belt' },
  '34485': { hero: 'tidehunter', slot: 'offhand_weapon' },
  '34487': { hero: 'tidehunter', slot: 'arms' },
  '35553': { hero: 'ogre_magi', slot: 'head' },
  '35989': { hero: 'techies', slot: 'misc' },
  '37140': { hero: 'legion_commander', slot: 'weapon' },
  '37144': { hero: 'drow_ranger', slot: 'weapon' },
  '37161': { hero: 'terrorblade', slot: 'head' },
};

export function supportedArcana(item: Partial<SchemaItem> | null): boolean {
  return !!item?.id && (Object.hasOwn(ARCANA_ITEMS, item.id)
    || Object.hasOwn(ARCANA_COMPANIONS, item.id)
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
