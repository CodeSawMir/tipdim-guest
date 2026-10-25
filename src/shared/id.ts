// UUIDv7 layout (RFC 9562): 48-bit Unix ms · version 7 · 12-bit counter · variant 10 · 62 random bits.
// The 12-bit counter (RFC "method 1") keeps ids from one device strictly increasing within a millisecond.

const MAX_MS = 2 ** 48 - 1;
export const UUIDV7_MAX_COUNTER = 0xfff;

export function formatUuidV7(ms: number, counter: number, random: Uint8Array): string {
  if (!Number.isSafeInteger(ms) || ms < 0 || ms > MAX_MS) throw new RangeError(`timestamp out of range: ${ms}`);
  if (!Number.isInteger(counter) || counter < 0 || counter > UUIDV7_MAX_COUNTER)
    throw new RangeError(`counter out of range: ${counter}`);
  if (random.length < 8) throw new RangeError('need at least 8 random bytes');
  const b = new Uint8Array(16);
  let t = ms;
  for (let i = 5; i >= 0; i--) {
    b[i] = t % 256;
    t = Math.floor(t / 256);
  }
  b[6] = 0x70 | (counter >> 8);
  b[7] = counter & 0xff;
  b[8] = 0x80 | ((random[0] as number) & 0x3f);
  for (let i = 1; i < 8; i++) b[8 + i] = random[i] as number;
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Milliseconds encoded in a UUIDv7. */
export const uuidV7Time = (id: string): number => parseInt(id.replace(/-/g, '').slice(0, 12), 16);
