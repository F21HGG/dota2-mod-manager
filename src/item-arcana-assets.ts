// Resolve a hero's stock model from the installed game, not a version-dependent path list.
import { blockBounds, eachChild } from './schema.ts';
import { t } from './i18n.ts';

export function heroModelPath(read: (name: string) => Buffer | null, hero: string): string {
  if (!/^npc_dota_hero_[a-z0-9_]+$/.test(hero)) throw new Error(t('Не найден {0}', hero));
  // Valve moved heroes to #base files; older installations still have the monolithic table.
  for (const name of [`scripts/npc/heroes/${hero}.txt`, 'scripts/npc/npc_heroes.txt']) {
    const bytes = read(name);
    if (!bytes) continue;
    const text = bytes.toString('latin1');
    let model = '';
    eachChild(text, blockBounds(text, 0), (h) => {
      if (!h.isBlock || h.key !== hero) return;
      eachChild(text, h.body, (f) => { if (!f.isBlock && f.key.toLowerCase() === 'model') model = f.value; });
    });
    if (model) return model;
  }
  throw new Error(t('Не найден {0}', hero + ': Model'));
}
