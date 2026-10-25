// The two calls a guest makes, straight to Supabase's REST endpoint (no client library: the page stays small).
export type Named = { name_en: string | null; name_ne: string | null };
export type GuestItem = Named & {
  id: string;
  category_id: string | null;
  description_en: string | null;
  description_ne: string | null;
  /** Photo address, if the owner added one. */
  photo?: string | null;
  price_paisa: number;
  in_stock: boolean;
  sizes: (Named & { id: string; price_paisa: number })[];
};
export type GuestMenu = {
  restaurant: { name: string; name_ne: string | null; address: string | null };
  /** Missing on the menu-only page, which has no table and takes no orders. */
  table?: { label: string };
  needs_accept?: boolean;
  categories: (Named & { id: string })[];
  items: GuestItem[];
};
export type GuestLine = {
  line_id: string;
  menu_item_id: string;
  variant_id: string | null;
  qty: number;
  note_text: string | null;
};
export type PlaceResult = { order_id: string; round_id: string; status: 'placed' | 'duplicate' };

/** Why a call failed, as a code the page words in the guest's language. */
export type GuestError =
  'unknown_table' | 'unknown_menu' | 'ordering_off' | 'unavailable' | 'too_many' | 'network' | 'unknown';

export class GuestApiError extends Error {
  constructor(readonly code: GuestError) {
    super(code);
  }
}

function errorCode(message: string): GuestError {
  if (/unknown table/u.test(message)) return 'unknown_table';
  if (/unknown menu/u.test(message)) return 'unknown_menu';
  if (/guest ordering is off/u.test(message)) return 'ordering_off';
  if (/unavailable/u.test(message)) return 'unavailable';
  if (/too many orders/u.test(message)) return 'too_many';
  return 'unknown';
}

export type ApiConfig = {
  url: string;
  anonKey: string;
  fetch: (
    input: string,
    init: { method: string; headers: Record<string, string>; body: string },
  ) => Promise<{
    ok: boolean;
    json: () => Promise<unknown>;
  }>;
};

export function createGuestApi(c: ApiConfig) {
  async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
    let res;
    try {
      res = await c.fetch(`${c.url.replace(/\/+$/u, '')}/rest/v1/rpc/${fn}`, {
        method: 'POST',
        headers: { apikey: c.anonKey, Authorization: `Bearer ${c.anonKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      });
    } catch {
      throw new GuestApiError('network');
    }
    const body = await res.json();
    if (!res.ok) throw new GuestApiError(errorCode(String((body as { message?: string })?.message ?? '')));
    return body as T;
  }
  return {
    menu: (token: string) => rpc<GuestMenu>('guest_menu', { p_qr_token: token }),
    /** The cafe's menu from its menu-only QR: the same menu, with no table and no ordering. */
    publicMenu: (token: string) => rpc<GuestMenu>('public_menu', { p_menu_token: token }),
    /** Idempotent per round id: sending the same round twice (a double tap, a retry) places it once. */
    place: (token: string, ids: { session: string; order: string; round: string }, lines: GuestLine[]) =>
      rpc<PlaceResult>('place_guest_order', {
        p_qr_token: token,
        p_session_id: ids.session,
        p_order_id: ids.order,
        p_round_id: ids.round,
        p_lines: lines,
      }),
  };
}
