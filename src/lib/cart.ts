// The guest's cart: pure, so it is tested without a browser. Money arithmetic is the app's domain code.
import { formatUuidV7 } from '../shared/id';
import { multiply, sum } from '../shared/money';

import type { GuestItem, GuestLine } from './api';

export type CartLine = { itemId: string; sizeId: string | null; qty: number };

export function addOne(cart: readonly CartLine[], itemId: string, sizeId: string | null = null): CartLine[] {
  const i = cart.findIndex((l) => l.itemId === itemId && l.sizeId === sizeId);
  if (i < 0) return [...cart, { itemId, sizeId, qty: 1 }];
  return cart.map((l, j) => (j === i ? { ...l, qty: Math.min(50, l.qty + 1) } : l));
}

/** 0 removes the line. */
export function setQty(cart: readonly CartLine[], index: number, qty: number): CartLine[] {
  return qty <= 0
    ? cart.filter((_, j) => j !== index)
    : cart.map((l, j) => (j === index ? { ...l, qty: Math.min(50, qty) } : l));
}

export function unitPrice(item: GuestItem, sizeId: string | null): number {
  return item.sizes.find((s) => s.id === sizeId)?.price_paisa ?? item.price_paisa;
}

export function cartTotal(cart: readonly CartLine[], items: ReadonlyMap<string, GuestItem>): number {
  return sum(
    cart.map((l) => {
      const item = items.get(l.itemId);
      return item ? multiply(unitPrice(item, l.sizeId), l.qty) : 0;
    }),
  );
}

export const cartCount = (cart: readonly CartLine[]): number => cart.reduce((n, l) => n + l.qty, 0);

/** The order as place_guest_order() takes it. Prices are not sent: the server reads them from the live menu. */
export function toLines(cart: readonly CartLine[], note: string, newId: () => string): GuestLine[] {
  const text = note.trim().slice(0, 200) || null;
  return cart.map((l, i) => ({
    line_id: newId(),
    menu_item_id: l.itemId,
    variant_id: l.sizeId,
    qty: l.qty,
    // One note for the kitchen, carried on the first line (the prototype has a single "anything for the kitchen?").
    note_text: i === 0 ? text : null,
  }));
}

let lastMs = 0;
let counter = 0;
/** UUIDv7 like every other id in the system; the counter keeps ids from one page ordered within a millisecond. */
export function newId(now = Date.now(), random = crypto.getRandomValues(new Uint8Array(8))): string {
  counter = now === lastMs ? Math.min(counter + 1, 0xfff) : 0;
  lastMs = now;
  return formatUuidV7(now, counter, random);
}
