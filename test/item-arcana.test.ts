import test from 'node:test';
import assert from 'node:assert/strict';
import { ARCANA_ITEMS, ARCANA_COMPANIONS, createArcanaContext, defaultArcanaVisuals, arcanaBodyCopies } from '../src/item-arcana.ts';
import { itemSlots, itemEffectPatch, defaultItemForWearable, gameAssetEntries } from '../src/item-builder.ts';
import { heroModelPath } from '../src/item-arcana-assets.ts';
import { buildVpk, entryAt, entryPath } from '../src/vpk.ts';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function wearable(id: string, hero: string, slot: string, visuals = '', model = '', prefab = 'wearable'): string {
  return `"${id}" { "name" "${id} Arcana" "prefab" "${prefab}" "item_slot" "${slot}"
    ${model ? `"model_player" "${model}"` : ''} "used_by_heroes" { "npc_dota_hero_${hero}" "1" }
    "visuals" { ${visuals} } }`;
}
const table = (...items: string[]) => `"items_game" { "items" { ${items.join('\n')} } }`;
const modifier = (type: string, asset: string, value: string, extra = '', key = 'asset_modifier') =>
  `"${key}" { "type" "${type}" "asset" "${asset}" "modifier" "${value}" ${extra} }`;

test('original Arcana outfit parts share the ordinary slot and keep only their default style', () => {
  for (const [id, part] of Object.entries(ARCANA_COMPANIONS)) {
    const text = table(
      wearable('1', part.hero, part.slot, '', '', 'default_item').replace('1 Arcana', 'Stock item'),
      wearable(id, part.hero, part.slot, modifier('particle', 'skill', 'first', '"style" "0"')
        + modifier('particle', 'skill', 'second', '"style" "1"')),
      wearable('99990', part.hero, part.slot).replace('99990 Arcana', 'Ordinary Immortal'),
    );
    const slots = itemSlots(text);
    assert.equal(slots.length, 1, 'an outfit part must not create a second equipment slot');
    assert.deepEqual(new Set(slots[0].options.map(o => o.id)), new Set([id, '99990']));
    const built = itemEffectPatch(text, id, '');
    assert.equal(built.id, '1');
    assert.match(built.block, /first/);
    assert.doesNotMatch(built.block, /second|"style"/);
  }
  const unknown = table(wearable('1', 'juggernaut', 'head', '', '', 'default_item').replace('1 Arcana', 'Stock'),
    wearable('99991', 'juggernaut', 'head'));
  assert.deepEqual(itemSlots(unknown), [], 'unreviewed Arcana parts remain excluded');
});

test('only reviewed Arcana and their real stock slots are enabled, including Io', () => {
  for (const [id, a] of Object.entries(ARCANA_ITEMS)) {
    const text = table(wearable(a.target, a.hero, 'hero_base', '', '', 'default_item'), wearable(id, a.hero, 'hero_base'));
    assert.equal(defaultItemForWearable(text, id)?.id, a.target);
    assert.deepEqual(itemSlots(text).map((s) => s.options.map((i) => i.id)), [[id]]);
    assert.equal(itemEffectPatch(text, id, '').id, a.target);
  }
  const unknown = table(wearable('905', 'drow_ranger', 'hero_base', '', '', 'default_item'), wearable('99991', 'drow_ranger', 'hero_base'));
  assert.deepEqual(itemSlots(unknown), []);
  assert.equal(defaultItemForWearable(unknown, '99991'), null);
  const persona = table(wearable('905', 'drow_ranger', 'persona_selector', '', '', 'default_item'), wearable('99992', 'drow_ranger', 'persona_selector'));
  assert.deepEqual(itemSlots(persona), []);
  assert.throws(() => itemEffectPatch(table(wearable('905', 'axe', 'hero_base', '', '', 'default_item'), wearable('19090', 'axe', 'hero_base')), '19090', ''));
});

test('default Arcana style drops alternate colours and progression gates but keeps default skin', () => {
  const visuals = `"visuals" {
    ${modifier('particle', 'default', 'blue', '"style" "0"')}
    ${modifier('particle', 'default', 'red', '"style" "1"', 'asset_modifier1')}
    ${modifier('model_skin', '', '', '"skin" "1"')}
    ${modifier('entity_model', 'summon', 'rubick', '"criteria" "isbetween( style, 2, 100 )"')}
  }`;
  const clean = defaultArcanaVisuals(visuals);
  assert.match(clean, /blue/);
  assert.match(clean, /"skin" "1"/);
  assert.doesNotMatch(clean, /red|rubick|"style"/);
});

test('body replacement is limited to the Arcana owner, never another hero or shared summon', () => {
  const visuals = `"visuals" {
    ${modifier('entity_model', 'npc_dota_hero_rubick', 'models/rubick.vmdl')}
    ${modifier('entity_model', 'npc_dota_lone_druid_bear', 'models/bear.vmdl')}
  }`;
  assert.deepEqual(arcanaBodyCopies('12451', visuals), [{ from: 'models/rubick.vmdl', to: 'npc_dota_hero_rubick', entityModel: true }]);
  assert.deepEqual(arcanaBodyCopies('9999', visuals), []);
});

test('Arcana wins overlapping skill effects, keeps Immortal body and uses Valve refits only while enabled', () => {
  const arc = modifier('model', 'models/cape.vmdl', 'models/cape_refit.vmdl')
    + modifier('particle', 'particles/units/heroes/hero_drow/skill.vpcf', 'particles/arcana.vpcf', '"style" "0"', 'asset_modifier0')
    + modifier('particle', 'particles/items_fx/blink.vpcf', 'particles/arcana_blink.vpcf')
    + modifier('entity_model', 'npc_dota_hero_drow_ranger', 'models/arcana_body.vmdl');
  const text = table(
    wearable('905', 'drow_ranger', 'hero_base', '', '', 'default_item'), wearable('19090', 'drow_ranger', 'hero_base', arc),
    wearable('50', 'drow_ranger', 'back', '', 'models/stock.vmdl', 'default_item').replace('50 Arcana', 'Stock cape'),
    wearable('51', 'drow_ranger', 'back', modifier('particle', 'particles/units/heroes/hero_drow/skill.vpcf', 'particles/immortal.vpcf')
      + modifier('particle_create', '', 'particles/ambient.vpcf'), 'models/cape.vmdl').replace('51 Arcana', 'Immortal cape'),
  );
  const ctx = createArcanaContext(text, ['51', '19090', '9999']);
  const arcana = itemEffectPatch(text, '19090', '', ctx);
  assert(arcana.assetCopies.some((c) => c.to.endsWith('/skill.vpcf')));
  assert(!arcana.assetCopies.some((c) => c.to.includes('blink')));
  assert.match(arcana.block, /arcana_blink/); // still scoped to the wearer in the schema
  const cape = itemEffectPatch(text, '51', '', ctx);
  assert.deepEqual(cape.assetCopies, [{ from: 'models/cape_refit.vmdl', to: 'models/stock.vmdl' }]);
  assert.match(cape.block, /models\/cape_refit/);
  assert.match(cape.block, /particles\/ambient/);
  assert.doesNotMatch(cape.block, /particles\/immortal/);
  const off = itemEffectPatch(text, '51', '', createArcanaContext(text, ['51']));
  assert.equal(off.assetCopies[0].from, 'models/cape.vmdl');
  assert.match(off.block, /particles\/immortal/);
});

test('hero models resolve both current split files and older monolithic tables, failing on missing data', () => {
  const bytes = Buffer.from('"DOTAHeroes" { "npc_dota_hero_drow_ranger" { "Model" "models/drow.vmdl" } }');
  assert.equal(heroModelPath((p) => p.includes('/heroes/') ? bytes : null, 'npc_dota_hero_drow_ranger'), 'models/drow.vmdl');
  assert.equal(heroModelPath((p) => p.endsWith('/npc_heroes.txt') ? bytes : null, 'npc_dota_hero_drow_ranger'), 'models/drow.vmdl');
  assert.throws(() => heroModelPath(() => bytes, '../escape'));
  assert.throws(() => heroModelPath(() => null, 'npc_dota_hero_drow_ranger'));
  assert.throws(() => heroModelPath(() => bytes, 'npc_dota_hero_axe'));
});

test('compiled body models are copied to the game-derived stock path', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'arcana-assets-'));
  try {
    fs.mkdirSync(path.join(root, 'dota'));
    fs.writeFileSync(path.join(root, 'dota/pak01_dir.vpk'), buildVpk([
      entryAt('scripts/npc/heroes/npc_dota_hero_drow_ranger.txt', Buffer.from('"DOTAHeroes" { "npc_dota_hero_drow_ranger" { "Model" "models/drow.vmdl" } }')),
      entryAt('models/arcana.vmdl_c', Buffer.from('official model')),
    ]));
    const assets = gameAssetEntries(root, [{ from: 'models/arcana.vmdl', to: 'npc_dota_hero_drow_ranger', entityModel: true }]);
    assert.equal(entryPath(assets[0]), 'models/drow.vmdl_c');
    assert.equal(assets[0].data.toString(), 'official model');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
