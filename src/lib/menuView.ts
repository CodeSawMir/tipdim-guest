// What the menu page shows: items A to Z by the name the guest sees, narrowed by category and search.
import type { Lang } from '../shared/numerals';

import type { GuestItem } from './api';

export type Layout = 'table' | 'list' | 'grid';
export const LAYOUTS: readonly Layout[] = ['table', 'list', 'grid'];

export function filterMenu(
  items: readonly GuestItem[],
  opts: { lang: Lang; query: string; categoryId: string | null; name: (i: GuestItem) => string },
): GuestItem[] {
  const q = opts.query.trim().toLowerCase();
  const collator = new Intl.Collator(opts.lang === 'ne' ? 'ne' : 'en', { sensitivity: 'base', numeric: true });
  return items
    .filter(
      (i) =>
        (!opts.categoryId || i.category_id === opts.categoryId) &&
        (!q || [i.name_en, i.name_ne, i.description_en, i.description_ne].some((x) => x?.toLowerCase().includes(q))),
    )
    .sort((a, b) => collator.compare(opts.name(a), opts.name(b)));
}
